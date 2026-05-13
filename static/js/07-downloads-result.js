"use strict";

function escapeCsvValue(value) {
  let text = value === null || value === undefined ? "" : String(value);
  const trimmed = text.trimStart();
  const isNumericNegative = /^-\d*\.?\d+(?:e[+-]?\d+)?$/i.test(trimmed);
  if (/^[=+@]/.test(trimmed) || (trimmed.startsWith("-") && !isNumericNegative)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function rowsToCsv(rows, columns) {
  const lines = [];
  lines.push(columns.map(escapeCsvValue).join(","));
  rows.forEach((row) => {
    lines.push(columns.map((column) => escapeCsvValue(row[column])).join(","));
  });
  return lines.join("\r\n");
}

function buildFitReport(stats, title) {
  const lines = [];
  lines.push("LabPlot Lite 图表报告");
  lines.push("================================");
  lines.push("");
  lines.push("一、图表");
  lines.push(`图表标题：${title || "未填写"}`);
  lines.push(`X 数据列：${stats.x_col}`);
  lines.push(`Y 数据列：${stats.y_col}`);
  lines.push(`X 轴标题：${stats.x_label}`);
  lines.push(`Y 轴标题：${stats.y_label}`);
  lines.push(`X 轴刻度：${stats.x_axis_scale_label}`);
  lines.push(`Y 轴刻度：${stats.y_axis_scale_label}`);
  lines.push(`X 轴范围：${stats.x_axis_range_label}`);
  lines.push(`Y 轴范围：${stats.y_axis_range_label}`);
  lines.push(`图表类型：${stats.chart_type}`);
  lines.push(`图例：${stats.legend_mode_label}`);
  lines.push(`数据标签：${stats.data_label_mode_label}`);
  lines.push(`参考线：${stats.reference_lines_label}`);
  lines.push(`误差棒：${stats.error_bar_count_label}`);
  lines.push(`数据点数：${stats.points}`);
  if (hasMissingPoints(stats)) {
    lines.push(`缺失值处理：${stats.missing_points_label}`);
  }
  lines.push("");
  lines.push("二、范围");
  lines.push(`表头行：第 ${stats.header_row} 行`);
  lines.push(`数据起始行：第 ${stats.data_start_row} 行`);
  lines.push(`数据结束行：${stats.data_end_row}`);
  lines.push("");
  lines.push("三、统计");
  lines.push(`Y 最大值：${stats.max_value}`);
  lines.push(`Y 最小值：${stats.min_value}`);
  lines.push(`Y 平均值：${stats.avg_value}`);
  lines.push(`峰值对应 X：${stats.peak_x}`);
  lines.push("");
  lines.push("四、拟合");
  lines.push(`拟合方式：${stats.fit_type_label}`);

  if (stats.has_fit) {
    lines.push(`拟合方程：${stats.equation}`);
    lines.push(`拟合判断：${stats.fit_quality}`);
    if (stats.fit_type === "linear") {
      lines.push(`斜率 a：${stats.fit_a}`);
      lines.push(`截距 b：${stats.fit_b}`);
    } else if (stats.fit_type === "quadratic") {
      lines.push(`二次项系数 a：${stats.fit_a}`);
      lines.push(`一次项系数 b：${stats.fit_b}`);
      lines.push(`常数项 c：${stats.fit_c}`);
    }
    lines.push("");
    lines.push("五、指标");
    stats.metric_display.forEach((metric) => {
      lines.push(`${metric.label}：${metric.value}`);
    });
  } else {
    lines.push("本次未拟合。");
    lines.push("");
    lines.push("五、指标");
    lines.push(stats.multi_y ? "多曲线暂不拟合。" : "未拟合，无拟合误差指标。");
  }

  lines.push("");
  lines.push("六、说明");
  lines.push("R² 只反映拟合程度，不能证明模型正确。");
  lines.push("RMSE、MAE、最大绝对误差可辅助判断误差大小。");
  lines.push("请结合实验原理判断模型。");

  return lines.join("\n");
}

function revokeDownloadUrls() {
  state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.objectUrls = [];
  state.pendingZipPackage = null;
  qsa("[data-object-url]").forEach((link) => {
    delete link.dataset.objectUrl;
  });
}

function setDownloadLink(selector, blob, filename) {
  const link = qs(selector);
  if (link.dataset.objectUrl) {
    URL.revokeObjectURL(link.dataset.objectUrl);
    state.objectUrls = state.objectUrls.filter((url) => url !== link.dataset.objectUrl);
  }
  const url = URL.createObjectURL(blob);
  state.objectUrls.push(url);
  link.dataset.objectUrl = url;
  link.href = url;
  link.download = filename;
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.removeAttribute("aria-disabled");
  link.removeAttribute("disabled");
  link.disabled = false;
}

function getRenderedPlotlyGraph(target) {
  if (!target) {
    return null;
  }
  return target._labPlotGraphDiv || target.querySelector(".js-plotly-plot");
}

function getRenderedPlotlySize(target, payload) {
  const outputSize = getPlotPixelSize(payload);
  const renderWidth = Number(target?.dataset.renderWidth) || outputSize.width;
  const renderHeight = Number(target?.dataset.renderHeight) || outputSize.height;
  return {
    outputSize,
    renderHeight,
    renderWidth,
  };
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error("图表导出失败。");
  }
  return response.blob();
}

async function renderedPlotToPngBlob(selector, payload) {
  const target = qs(selector);
  const plotlyGraph = getRenderedPlotlyGraph(target);
  if (!plotlyGraph || !window.Plotly) {
    throw new Error("没有可导出的图表。");
  }

  const { outputSize, renderHeight, renderWidth } = getRenderedPlotlySize(target, payload);
  const dataUrl = await Plotly.toImage(plotlyGraph, {
    format: "png",
    height: renderHeight,
    scale: outputSize.width / renderWidth,
    width: renderWidth,
  });
  return dataUrlToBlob(dataUrl);
}

async function renderedPlotToSvgBlob(selector, payload) {
  const target = qs(selector);
  const plotlyGraph = getRenderedPlotlyGraph(target);
  if (!plotlyGraph || !window.Plotly) {
    throw new Error("没有可导出的图表。");
  }

  const { renderHeight, renderWidth } = getRenderedPlotlySize(target, payload);
  const dataUrl = await Plotly.toImage(plotlyGraph, {
    format: "svg",
    height: renderHeight,
    scale: 1,
    width: renderWidth,
  });
  return dataUrlToBlob(dataUrl);
}

function clearDownloadLink(selector) {
  const link = qs(selector);
  if (!link) {
    return;
  }
  if (link.dataset.objectUrl) {
    URL.revokeObjectURL(link.dataset.objectUrl);
    state.objectUrls = state.objectUrls.filter((url) => url !== link.dataset.objectUrl);
    delete link.dataset.objectUrl;
  }
  link.removeAttribute("download");
  link.removeAttribute("href");
  link.setAttribute("aria-disabled", "true");
  link.setAttribute("disabled", "");
  link.disabled = true;
}

function clearResultDownloadLinks() {
  [
    "#downloadPng",
    "#downloadSvg",
    "#downloadOriginCsv",
    "#downloadFullCsv",
    "#downloadFitReport",
    "#downloadZip",
  ].forEach(clearDownloadLink);
}

function clearSimpleDownloadLinks() {
  [
    "#simpleDownloadPng",
    "#simpleDownloadSvg",
  ].forEach(clearDownloadLink);
}

async function renderDownloads(payload) {
  revokeDownloadUrls();

  const pngBlob = await renderedPlotToPngBlob("#plotCanvas", payload);
  const svgBlob = await renderedPlotToSvgBlob("#plotCanvas", payload);
  const originCsvBlob = new Blob(
    ["\uFEFF", rowsToCsv(payload.originRows, payload.originColumns)],
    { type: "text/csv;charset=utf-8" },
  );
  const fullCsvBlob = new Blob(
    ["\uFEFF", rowsToCsv(payload.fullRows, payload.fullColumns)],
    { type: "text/csv;charset=utf-8" },
  );
  const fitReportText = buildFitReport(payload.stats, payload.plotTitle);
  const fitReportBlob = new Blob([fitReportText], { type: "text/plain;charset=utf-8" });

  setDownloadLink("#downloadPng", pngBlob, payload.filenames.png);
  if (svgBlob && payload.filenames.svg) {
    setDownloadLink("#downloadSvg", svgBlob, payload.filenames.svg);
  } else {
    clearDownloadLink("#downloadSvg");
  }
  setDownloadLink("#downloadOriginCsv", originCsvBlob, payload.filenames.originCsv);
  setDownloadLink("#downloadFullCsv", fullCsvBlob, payload.filenames.fullCsv);
  setDownloadLink("#downloadFitReport", fitReportBlob, payload.filenames.fitReport);
  state.pendingZipPackage = {
    filenames: payload.filenames,
    files: {
      fitReport: fitReportBlob,
      fullCsv: fullCsvBlob,
      originCsv: originCsvBlob,
      png: pngBlob,
      svg: svgBlob,
    },
  };
  const zipLink = qs("#downloadZip");
  zipLink.href = "#";
  zipLink.setAttribute("href", "#");
  zipLink.removeAttribute("download");
  zipLink.removeAttribute("aria-disabled");
  zipLink.removeAttribute("disabled");
  zipLink.disabled = false;
}

async function renderSimpleDownloads(payload) {
  clearSimpleDownloadLinks();
  const pngBlob = await renderedPlotToPngBlob("#simplePlotCanvas", payload);
  const svgBlob = await renderedPlotToSvgBlob("#simplePlotCanvas", payload);
  setDownloadLink("#simpleDownloadPng", pngBlob, payload.filenames.png);
  if (svgBlob && payload.filenames.svg) {
    setDownloadLink("#simpleDownloadSvg", svgBlob, payload.filenames.svg);
  } else {
    clearDownloadLink("#simpleDownloadSvg");
  }
}

async function generateZipDownload() {
  const packageInfo = state.pendingZipPackage;
  if (!packageInfo) {
    throw new Error("请先生成图表，再下载 ZIP。");
  }
  if (!window.JSZip) {
    await ensureExternalLibrary("jszip");
  }

  const { filenames, files } = packageInfo;
  const zip = new JSZip();
  zip.file(filenames.png, files.png);
  if (files.svg && filenames.svg) {
    zip.file(filenames.svg, files.svg);
  }
  zip.file(filenames.originCsv, files.originCsv);
  zip.file(filenames.fullCsv, files.fullCsv);
  zip.file(filenames.fitReport, files.fitReport);
  const zipBlob = await zip.generateAsync({ type: "blob" });
  setDownloadLink("#downloadZip", zipBlob, filenames.zip);
  return {
    filename: filenames.zip,
    url: qs("#downloadZip").href,
  };
}

function triggerDownload(url, filename) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

window.addEventListener("beforeunload", revokeDownloadUrls);

function addResultTableRow(body, label, value, options = {}) {
  body.appendChild(createElement("cds-table-row", {
    className: options.large ? "result-row-large" : "",
    children: [
      createElement("cds-table-cell", { textContent: label }),
      createElement("cds-table-cell", { textContent: value ?? "" }),
    ],
  }));
}

function addSummaryRow(body, label, value, large = false) {
  addResultTableRow(body, label, value, { large });
}

function addStat(body, label, value) {
  addResultTableRow(body, label, value);
}

function hasMissingPoints(stats) {
  return Number(stats.missing_points) > 0;
}

function addMissingSummaryRow(body, stats) {
  if (hasMissingPoints(stats)) {
    addSummaryRow(body, "缺失值", stats.missing_points_label, true);
  }
}

function renderResult(payload) {
  const stats = payload.stats;
  qs("#resultFigureTitle").textContent = payload.plotTitle || "未命名";
  qs("#resultFigureMeta").textContent = `${stats.fig_width} × ${stats.fig_height} in / ${stats.fig_dpi} DPI`;
  qs("#resultFigureCurves").textContent = `${stats.curve_count} 条曲线`;

  const summary = qs("#summaryBody");
  summary.replaceChildren();

  if (stats.has_fit) {
    addSummaryRow(summary, "拟合方程", stats.equation, true);
    addSummaryRow(summary, "R²", stats.core_metrics.r2);
    addSummaryRow(summary, "RMSE", stats.core_metrics.rmse);
    addSummaryRow(summary, "MAE", stats.core_metrics.mae);
    addSummaryRow(summary, "点数", stats.points);
    addMissingSummaryRow(summary, stats);
    addSummaryRow(summary, "判断", stats.fit_quality, true);
  } else {
    addSummaryRow(summary, "拟合", stats.fit_type_label);
    addSummaryRow(summary, "点数", stats.points);
    addMissingSummaryRow(summary, stats);
    if (stats.multi_y) {
      addSummaryRow(summary, "提示", stats.fit_notice, true);
    }
  }
  addSummaryRow(summary, "X 轴", stats.x_col);
  addSummaryRow(summary, "Y 轴", stats.y_cols_label || stats.y_col);
  addSummaryRow(summary, "曲线数", stats.curve_count);
  addSummaryRow(summary, "类型", stats.chart_type);
  addSummaryRow(summary, "参考线", stats.reference_lines_label);

  const statsGrid = qs("#statsBody");
  statsGrid.replaceChildren();
  addStat(statsGrid, "X 轴标题", stats.x_label);
  addStat(statsGrid, "Y 轴标题", stats.y_label);
  addStat(statsGrid, "X 轴刻度", stats.x_axis_scale_label);
  addStat(statsGrid, "Y 轴刻度", stats.y_axis_scale_label);
  addStat(statsGrid, "X 轴范围", stats.x_axis_range_label);
  addStat(statsGrid, "Y 轴范围", stats.y_axis_range_label);
  addStat(statsGrid, "图例", stats.legend_mode_label);
  addStat(statsGrid, "数据标签", stats.data_label_mode_label);
  addStat(statsGrid, "参考线", stats.reference_lines_label);
  addStat(statsGrid, "误差棒", stats.error_bar_count_label);
  addStat(statsGrid, "Y 最大值", stats.max_value);
  addStat(statsGrid, "Y 最小值", stats.min_value);
  addStat(statsGrid, "Y 平均值", stats.avg_value);
  if (hasMissingPoints(stats)) {
    addStat(statsGrid, "缺失值", stats.missing_points_label);
  }
  addStat(statsGrid, "峰值对应 X", stats.peak_x);
  addStat(statsGrid, "表头行", `第 ${stats.header_row} 行`);
  addStat(statsGrid, "数据起始行", `第 ${stats.data_start_row} 行`);
  addStat(statsGrid, "数据结束行", stats.data_end_row);
  addStat(statsGrid, "导出尺寸", `${stats.fig_width} × ${stats.fig_height} inch`);
  addStat(statsGrid, "图片 DPI", String(stats.fig_dpi));
  addStat(statsGrid, "网格线", stats.show_grid ? "显示" : "隐藏");

  show(qs("#resultSection"));
}
