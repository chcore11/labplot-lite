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
  lines.push("LabPlot Lite 拟合报告");
  lines.push("================================");
  lines.push("");
  lines.push("一、图表信息");
  lines.push(`图表标题：${title || "未填写"}`);
  lines.push(`X 数据列：${stats.x_col}`);
  lines.push(`Y 数据列：${stats.y_col}`);
  lines.push(`X 轴显示名称：${stats.x_label}`);
  lines.push(`Y 轴显示名称：${stats.y_label}`);
  lines.push(`X 轴刻度：${stats.x_axis_scale_label}`);
  lines.push(`Y 轴刻度：${stats.y_axis_scale_label}`);
  lines.push(`图表类型：${stats.chart_type}`);
  lines.push(`数据点数：${stats.points}`);
  lines.push("");
  lines.push("二、数据范围");
  lines.push(`表头行：第 ${stats.header_row} 行`);
  lines.push(`数据起始行：第 ${stats.data_start_row} 行`);
  lines.push(`数据结束行：${stats.data_end_row}`);
  lines.push("");
  lines.push("三、基础统计");
  lines.push(`Y 最大值：${stats.max_value}`);
  lines.push(`Y 最小值：${stats.min_value}`);
  lines.push(`Y 平均值：${stats.avg_value}`);
  lines.push(`峰值对应 X：${stats.peak_x}`);
  lines.push("");
  lines.push("四、拟合结果");
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
    lines.push("五、拟合指标");
    stats.metric_display.forEach((metric) => {
      lines.push(`${metric.label}：${metric.value}`);
    });
  } else {
    lines.push("本次未进行拟合。");
    lines.push("");
    lines.push("五、拟合指标");
    lines.push(stats.multi_y ? "多曲线模式下暂不进行拟合。" : "未进行拟合，因此没有拟合误差指标。");
  }

  lines.push("");
  lines.push("六、提醒");
  lines.push("R² 只能反映拟合程度，不能单独证明物理模型正确。");
  lines.push("RMSE、MAE、最大绝对误差可以辅助判断拟合误差大小。");
  lines.push("请结合实验原理判断一次拟合或二次拟合是否合理。");

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
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG 图片生成失败。"));
      }
    }, "image/png");
  });
}

function getRenderedCanvas(target) {
  if (target instanceof HTMLCanvasElement) {
    return target;
  }
  return target ? target.querySelector("canvas") : null;
}

function getRenderedSvg(target) {
  if (target instanceof SVGSVGElement) {
    return target;
  }
  return target ? target.querySelector("svg") : null;
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
    throw new Error("图像导出失败。");
  }
  return response.blob();
}

function svgToBlob(svg) {
  if (!svg) {
    return null;
  }

  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("width") && svg.viewBox && svg.viewBox.baseVal.width) {
    clone.setAttribute("width", String(svg.viewBox.baseVal.width));
  }
  if (!clone.getAttribute("height") && svg.viewBox && svg.viewBox.baseVal.height) {
    clone.setAttribute("height", String(svg.viewBox.baseVal.height));
  }

  const source = new XMLSerializer().serializeToString(clone);
  return new Blob([source], { type: "image/svg+xml;charset=utf-8" });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SVG 图像转换失败。"));
    image.src = url;
  });
}

async function svgBlobToPngBlob(svgBlob, width, height) {
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = getThemeColors().surface;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function renderedPlotToPngBlob(selector, payload) {
  const target = qs(selector);
  const plotlyGraph = getRenderedPlotlyGraph(target);
  if (plotlyGraph && window.Plotly) {
    const { outputSize, renderHeight, renderWidth } = getRenderedPlotlySize(target, payload);
    const dataUrl = await Plotly.toImage(plotlyGraph, {
      format: "png",
      height: renderHeight,
      scale: outputSize.width / renderWidth,
      width: renderWidth,
    });
    return dataUrlToBlob(dataUrl);
  }

  const canvas = getRenderedCanvas(target);
  if (canvas) {
    return canvasToBlob(canvas);
  }

  const svg = getRenderedSvg(target);
  const svgBlob = svgToBlob(svg);
  if (!svg || !svgBlob) {
    throw new Error("没有找到可导出的图像。");
  }

  const width = Math.round(Number(svg.getAttribute("width")) || payload.figWidth * payload.figDpi);
  const height = Math.round(Number(svg.getAttribute("height")) || payload.figHeight * payload.figDpi);
  return svgBlobToPngBlob(svgBlob, width, height);
}

async function renderedPlotToSvgBlob(selector, payload) {
  const target = qs(selector);
  const plotlyGraph = getRenderedPlotlyGraph(target);
  if (plotlyGraph && window.Plotly) {
    const { renderHeight, renderWidth } = getRenderedPlotlySize(target, payload);
    const dataUrl = await Plotly.toImage(plotlyGraph, {
      format: "svg",
      height: renderHeight,
      scale: 1,
      width: renderWidth,
    });
    return dataUrlToBlob(dataUrl);
  }

  return svgToBlob(getRenderedSvg(target));
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
  link.href = "#";
  link.removeAttribute("download");
  link.setAttribute("href", "#");
  link.setAttribute("aria-disabled", "true");
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
}

async function renderSimpleDownloads(payload) {
  revokeDownloadUrls();
  const pngBlob = await renderedPlotToPngBlob("#simplePlotCanvas", payload);
  setDownloadLink("#simpleDownloadPng", pngBlob, payload.filenames.png);
}

async function generateZipDownload() {
  const packageInfo = state.pendingZipPackage;
  if (!packageInfo) {
    throw new Error("请先生成图表，再下载 ZIP 素材包。");
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

function renderResult(payload) {
  const stats = payload.stats;
  qs("#resultFigureTitle").textContent = payload.plotTitle || "未命名图像";
  qs("#resultFigureMeta").textContent = `${stats.fig_width} × ${stats.fig_height} in / ${stats.fig_dpi} DPI`;
  qs("#resultFigureCurves").textContent = `${stats.curve_count} 条曲线`;

  const summary = qs("#summaryBody");
  summary.replaceChildren();

  if (stats.has_fit) {
    addSummaryRow(summary, "拟合方程", stats.equation, true);
    addSummaryRow(summary, "R²", stats.core_metrics.r2);
    addSummaryRow(summary, "RMSE", stats.core_metrics.rmse);
    addSummaryRow(summary, "MAE", stats.core_metrics.mae);
    addSummaryRow(summary, "数据点数", stats.points);
    addSummaryRow(summary, "拟合判断", stats.fit_quality, true);
  } else {
    addSummaryRow(summary, "拟合方式", stats.fit_type_label);
    addSummaryRow(summary, "数据点数", stats.points);
    if (stats.multi_y) {
      addSummaryRow(summary, "提示", stats.fit_notice, true);
    }
  }
  addSummaryRow(summary, "X 轴", stats.x_col);
  addSummaryRow(summary, "Y 轴", stats.y_cols_label || stats.y_col);
  addSummaryRow(summary, "曲线数量", stats.curve_count);
  addSummaryRow(summary, "图表类型", stats.chart_type);

  const statsGrid = qs("#statsBody");
  statsGrid.replaceChildren();
  addStat(statsGrid, "X 轴显示名称", stats.x_label);
  addStat(statsGrid, "Y 轴显示名称", stats.y_label);
  addStat(statsGrid, "X 轴刻度", stats.x_axis_scale_label);
  addStat(statsGrid, "Y 轴刻度", stats.y_axis_scale_label);
  addStat(statsGrid, "Y 最大值", stats.max_value);
  addStat(statsGrid, "Y 最小值", stats.min_value);
  addStat(statsGrid, "Y 平均值", stats.avg_value);
  addStat(statsGrid, "峰值对应 X", stats.peak_x);
  addStat(statsGrid, "表头行", `第 ${stats.header_row} 行`);
  addStat(statsGrid, "数据起始行", `第 ${stats.data_start_row} 行`);
  addStat(statsGrid, "数据结束行", stats.data_end_row);
  addStat(statsGrid, "图片尺寸", `${stats.fig_width} × ${stats.fig_height} inch`);
  addStat(statsGrid, "图片 DPI", String(stats.fig_dpi));
  addStat(statsGrid, "网格线", stats.show_grid ? "显示" : "隐藏");

  show(qs("#resultSection"));
}
