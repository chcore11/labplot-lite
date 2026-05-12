"use strict";

function buildPlotPayload() {
  const xCol = getControlValue("#xCol");
  const curveConfigs = getCurveConfigsFromForm();
  const yCols = curveConfigs.map((config) => config.yCol);
  const uniqueYCols = Array.from(new Set(yCols));
  const chartType = getControlValue("#chartType");
  let fitType = getControlValue("#fitType");
  const metricMode = getControlValue("#metricMode");
  const selectedMetrics = normalizeSelectedMetrics();

  if (!xCol || !yCols.length) {
    throw new Error("请选择 X 轴和 Y 轴。");
  }
  if (uniqueYCols.includes(xCol)) {
    throw new Error("X 轴和 Y 轴不能选择同一列。");
  }
  if (!CHART_TYPES[chartType]) {
    throw new Error("请选择正确的图表类型。");
  }
  if (!FIT_TYPES[fitType]) {
    throw new Error("请选择正确的拟合方式。");
  }

  const figWidth = parsePositiveFloat(getControlValue("#figWidth"), 7, "图片宽度", 3, 20);
  const figHeight = parsePositiveFloat(getControlValue("#figHeight"), 4.6, "图片高度", 2, 16);
  const figDpi = Math.round(parsePositiveFloat(getControlValue("#figDpi"), 300, "图片 DPI", 72, 600));
  const titleFontsize = parsePositiveFloat(getControlValue("#titleFontsize"), 15, "标题字体大小", 8, 40);
  const labelFontsize = parsePositiveFloat(getControlValue("#labelFontsize"), 13, "坐标轴字体大小", 8, 32);
  const legendFontsize = parsePositiveFloat(getControlValue("#legendFontsize"), 11, "图例字体大小", 6, 24);
  const showGrid = getControlChecked("#showGrid");

  const xLabel = cellText(getControlValue("#xLabel")) || xCol;
  const yLabel = cellText(getControlValue("#yLabel")) || (curveConfigs.length > 1 ? uniqueYCols.join(" / ") : yCols[0]);
  const plotTitle = autoTitle(getControlValue("#plotTitle"), xLabel, yLabel);
  const headerRow = parsePositiveInt(getControlValue("#headerRow"), 1);
  const dataStartRow = parsePositiveInt(getControlValue("#dataStartRow"), headerRow + 1);
  const dataEndRow = parsePositiveInt(getControlValue("#dataEndRow"), null);

  const datasets = [];
  const allPairs = [];
  let fitResult = null;
  let originRows = [];

  if (curveConfigs.length > 1) {
    fitType = "none";

    curveConfigs.forEach((config) => {
      const pairs = sortPairsByX(getPlotPairs(xCol, config.yCol));
      if (!pairs.length) {
        return;
      }
      allPairs.push(...pairs.map((point) => ({ ...point, yCol: config.yCol })));
      datasets.push(makeChartDataset(config.yCol, pairs, config, chartType));
    });

    if (!datasets.length) {
      throw new Error("所选 X/Y 列中没有可用于绘图的成对数值数据。");
    }

    originRows = state.data.map((row) => {
      const item = { [xCol]: row[xCol] };
      uniqueYCols.forEach((column) => {
        item[column] = row[column];
      });
      return item;
    });
  } else {
    const config = curveConfigs[0];
    const pairs = sortPairsByX(getPlotPairs(xCol, config.yCol));
    if (!pairs.length) {
      throw new Error("所选 X/Y 列中没有可用的数值数据，请检查表格内容。");
    }

    allPairs.push(...pairs.map((point) => ({ ...point, yCol: config.yCol })));
    originRows = pairs.map((point) => ({ [xCol]: point.x, [config.yCol]: point.y }));

    if (fitType === "linear") {
      fitResult = linearFit(pairs);
    } else if (fitType === "quadratic") {
      fitResult = quadraticFit(pairs);
    }

    if (fitResult) {
      datasets.push({
        label: "Data",
        data: pairs,
        showLine: false,
        pointRadius: 4.2,
        pointHoverRadius: 5.2,
        pointBorderWidth: 1.2,
        pointBorderColor: "rgb(252, 252, 249)",
        borderColor: config.color,
        backgroundColor: config.color,
      });
      datasets.push({
        label: fitType === "linear" ? "Linear Fit" : "Quadratic Fit",
        data: fitResult.fitPoints,
        showLine: true,
        pointRadius: 0,
        borderColor: "rgb(31, 41, 55)",
        backgroundColor: "rgb(31, 41, 55)",
        borderWidth: Math.max(config.lineWidth + 0.5, 2),
        borderDash: [9, 5],
      });

      const fitColumn = fitType === "linear" ? "linear_fit_y" : "quadratic_fit_y";
      originRows = pairs.map((point, index) => {
        const fitted = fitResult.yPred[index];
        const residual = point.y - fitted;
        return {
          [xCol]: point.x,
          [config.yCol]: point.y,
          [fitColumn]: fitted,
          residual,
          abs_residual: Math.abs(residual),
        };
      });
    } else {
      datasets.push(makeChartDataset(config.yCol, pairs, config, chartType));
    }
  }

  const xValues = allPairs.map((point) => point.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yValues = allPairs.map((point) => point.y);
  const maxValue = Math.max(...yValues);
  const minValue = Math.min(...yValues);
  const avgValue = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const peakPoint = allPairs.reduce((best, point) => point.y > best.y ? point : best, allPairs[0]);

  const metricValues = {};
  const metricDisplay = [];
  if (fitResult) {
    selectedMetrics.forEach((metricKey) => {
      const value = fitResult.allMetrics[metricKey];
      metricValues[metricKey] = formatNumber(value);
      metricDisplay.push({
        key: metricKey,
        label: AVAILABLE_METRICS[metricKey] || metricKey,
        value: formatNumber(value),
      });
    });
  }

  const stats = {
    x_col: xCol,
    y_col: uniqueYCols.join(" / "),
    y_cols_label: uniqueYCols.join(" / "),
    curve_count: String(curveConfigs.length),
    curve_configs: curveConfigs,
    multi_y: curveConfigs.length > 1,
    fit_notice: curveConfigs.length > 1 ? MULTI_Y_FIT_NOTICE : "",
    x_label: xLabel,
    y_label: yLabel,
    max_value: formatShortNumber(maxValue),
    min_value: formatShortNumber(minValue),
    avg_value: formatShortNumber(avgValue),
    peak_x: String(peakPoint.x),
    points: String(allPairs.length),
    header_row: String(headerRow),
    data_start_row: String(dataStartRow),
    data_end_row: dataEndRow ? String(dataEndRow) : "未限制",
    chart_type: CHART_TYPES[chartType],
    fit_type: fitType,
    fit_type_label: curveConfigs.length > 1 ? MULTI_Y_FIT_NOTICE : FIT_TYPES[fitType],
    has_fit: Boolean(fitResult),
    equation: fitResult ? fitResult.equation : null,
    fit_quality: fitResult ? describeFitQuality(fitResult.allMetrics) : "",
    fit_a: fitResult ? formatNumber(fitResult.a) : null,
    fit_b: fitResult ? formatNumber(fitResult.b) : null,
    fit_c: fitResult && fitResult.c !== null ? formatNumber(fitResult.c) : null,
    metric_mode: metricMode,
    metric_mode_label: METRIC_MODES[metricMode],
    selected_metrics: fitResult ? selectedMetrics : [],
    metric_values: metricValues,
    metric_display: metricDisplay,
    core_metrics: fitResult ? {
      r2: formatNumber(fitResult.allMetrics.r2),
      rmse: formatNumber(fitResult.allMetrics.rmse),
      mae: formatNumber(fitResult.allMetrics.mae),
    } : null,
    fig_width: figWidth,
    fig_height: figHeight,
    fig_dpi: figDpi,
    title_fontsize: titleFontsize,
    label_fontsize: labelFontsize,
    legend_fontsize: legendFontsize,
    show_grid: showGrid,
  };

  const xName = safeFilenamePart(xCol);
  const yName = curveConfigs.length > 1 ? "multi_y" : safeFilenamePart(uniqueYCols[0]);
  const prefix = `${yName}_vs_${xName}`;
  const jobId = randomId();

  return {
    datasets,
    stats,
    plotTitle,
    xLabel,
    yLabel,
    fitText: fitResult ? `${fitResult.equation}\nR² = ${formatNumber(fitResult.allMetrics.r2)}` : "",
    figWidth,
    figHeight,
    figDpi,
    titleFontsize,
    labelFontsize,
    legendFontsize,
    showGrid,
    xMin,
    xMax,
    yMin: minValue,
    yMax: maxValue,
    originRows,
    originColumns: Object.keys(originRows[0] || {}),
    fullRows: state.data,
    fullColumns: state.columns,
    filenames: {
      png: `${prefix}_${jobId}.png`,
      svg: `${prefix}_${jobId}.svg`,
      originCsv: `${prefix}_origin_${jobId}.csv`,
      fullCsv: `${prefix}_full_data_${jobId}.csv`,
      fitReport: `${prefix}_fit_report_${jobId}.txt`,
      zip: `report_package_${safeFilenamePart(plotTitle)}_${jobId}.zip`,
    },
  };
}

function buildSimplePlotPayload(options) {
  const xCol = options.xCol;
  const yCol = options.yCol;
  const pairs = sortPairsByX(getPlotPairs(xCol, yCol));

  if (!pairs.length) {
    throw new Error("所选 X/Y 列中没有可用于绘图的成对数值数据。");
  }

  const config = {
    yCol,
    color: DEFAULT_CURVE_COLORS[0],
    lineWidth: 1.8,
    lineStyle: "solid",
  };
  const xValues = pairs.map((point) => point.x);
  const yValues = pairs.map((point) => point.y);
  const maxValue = Math.max(...yValues);
  const minValue = Math.min(...yValues);
  const avgValue = yValues.reduce((sum, value) => sum + value, 0) / yValues.length;
  const peakPoint = pairs.reduce((best, point) => point.y > best.y ? point : best, pairs[0]);
  const figWidth = 7;
  const figHeight = 4.6;
  const figDpi = 300;
  const plotTitle = autoTitle("", xCol, yCol);
  const jobId = randomId();
  const prefix = `${safeFilenamePart(yCol)}_vs_${safeFilenamePart(xCol)}`;
  const headerGuess = options.headerGuess || {};

  const stats = {
    x_col: xCol,
    y_col: yCol,
    y_cols_label: yCol,
    curve_count: "1",
    curve_configs: [config],
    multi_y: false,
    fit_notice: "",
    x_label: xCol,
    y_label: yCol,
    max_value: formatShortNumber(maxValue),
    min_value: formatShortNumber(minValue),
    avg_value: formatShortNumber(avgValue),
    peak_x: String(peakPoint.x),
    points: String(pairs.length),
    header_row: String(headerGuess.headerRow || 1),
    data_start_row: String(headerGuess.dataStartRow || 2),
    data_end_row: "未限制",
    chart_type: CHART_TYPES.line_marker,
    fit_type: "none",
    fit_type_label: FIT_TYPES.none,
    has_fit: false,
    equation: null,
    fit_quality: "",
    fit_a: null,
    fit_b: null,
    fit_c: null,
    metric_mode: "basic",
    metric_mode_label: METRIC_MODES.basic,
    selected_metrics: [],
    metric_values: {},
    metric_display: [],
    core_metrics: null,
    fig_width: figWidth,
    fig_height: figHeight,
    fig_dpi: figDpi,
    title_fontsize: 15,
    label_fontsize: 13,
    legend_fontsize: 11,
    show_grid: false,
  };

  return {
    datasets: [makeChartDataset(yCol, pairs, config, "line_marker")],
    stats,
    plotTitle,
    xLabel: xCol,
    yLabel: yCol,
    fitText: "",
    figWidth,
    figHeight,
    figDpi,
    titleFontsize: 15,
    labelFontsize: 13,
    legendFontsize: 11,
    showGrid: false,
    xMin: Math.min(...xValues),
    xMax: Math.max(...xValues),
    yMin: minValue,
    yMax: maxValue,
    originRows: pairs.map((point) => ({ [xCol]: point.x, [yCol]: point.y })),
    originColumns: [xCol, yCol],
    fullRows: state.data,
    fullColumns: state.columns,
    filenames: {
      png: `${prefix}_${jobId}.png`,
      svg: `${prefix}_${jobId}.svg`,
      originCsv: `${prefix}_origin_${jobId}.csv`,
      fullCsv: `${prefix}_full_data_${jobId}.csv`,
      fitReport: `${prefix}_report_${jobId}.txt`,
      zip: `report_package_${safeFilenamePart(plotTitle)}_${jobId}.zip`,
    },
  };
}

function makeChartDataset(label, pairs, config, chartType) {
  const isScatter = chartType === "scatter";
  const isLineOnly = chartType === "line";
  const isArea = chartType === "area";
  const isBar = chartType === "bar";

  return {
    label,
    chartType,
    data: pairs,
    showLine: !isScatter && !isBar,
    pointRadius: isLineOnly || isArea || isBar ? 0 : 3.6,
    pointHoverRadius: isLineOnly || isArea || isBar ? 0 : 4.8,
    pointBorderWidth: isLineOnly || isArea || isBar ? 0 : 1,
    pointBorderColor: "rgb(252, 252, 249)",
    borderColor: config.color,
    backgroundColor: config.color,
    borderWidth: Math.max(config.lineWidth, 1.7),
    borderDash: LINE_DASHES[config.lineStyle],
    lineStyle: config.lineStyle,
    tension: 0,
    spanGaps: true,
  };
}

function shouldAxisStartAtZero(minValue, maxValue) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || minValue < 0) {
    return false;
  }

  const range = maxValue - minValue;
  if (range <= 0) {
    return minValue === 0;
  }
  return minValue <= range * 0.08;
}

function nicePositiveAxisMax(maxValue) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return undefined;
  }

  const padded = maxValue * 1.08;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  const normalized = padded / magnitude;
  let niceNormalized = 1;
  if (normalized <= 1) {
    niceNormalized = 1;
  } else if (normalized <= 1.2) {
    niceNormalized = 1.2;
  } else if (normalized <= 1.5) {
    niceNormalized = 1.5;
  } else if (normalized <= 2) {
    niceNormalized = 2;
  } else if (normalized <= 3) {
    niceNormalized = 3;
  } else if (normalized <= 5) {
    niceNormalized = 5;
  } else {
    niceNormalized = 10;
  }
  return niceNormalized * magnitude;
}

function getThemeColors() {
  return {
    text: "rgb(17, 24, 39)",
    muted: "rgb(75, 85, 99)",
    axis: "rgb(17, 24, 39)",
    line: "rgba(17, 24, 39, 0.16)",
    surface: "rgb(250, 250, 247)",
    fitLabelBg: "rgba(250, 250, 247, 0.95)",
    fitLabelText: "rgb(17, 24, 39)",
    fitLabelBorder: "rgba(17, 24, 39, 0.22)",
  };
}

function getPlotPixelSize(payload) {
  return {
    width: Math.round(payload.figWidth * payload.figDpi),
    height: Math.round(payload.figHeight * payload.figDpi),
  };
}

function getPlotAvailableWidth(target) {
  const parent = target.parentElement;
  const parentRect = parent?.getBoundingClientRect();
  const parentStyles = parent ? window.getComputedStyle(parent) : null;
  const horizontalPadding = parentStyles
    ? (parseFloat(parentStyles.paddingLeft) || 0) + (parseFloat(parentStyles.paddingRight) || 0)
    : 0;
  const measuredWidth = (parentRect?.width || parent?.clientWidth || 980) - horizontalPadding;
  return Math.max(Math.min(measuredWidth > 0 ? measuredWidth : 980, 980), 280);
}

function getPlotPreviewSize(target, payload) {
  const width = getPlotAvailableWidth(target);
  return {
    width,
    height: Math.round(width * (payload.figHeight / payload.figWidth)),
  };
}

function getPlotTarget(selector) {
  const target = qs(selector);
  if (!target) {
    throw new Error("图像预览容器不存在。");
  }
  return target;
}

function clearRenderedPlot(target) {
  if (target._labPlotGraphDiv && window.Plotly) {
    Plotly.purge(target._labPlotGraphDiv);
  }
  target._labPlotGraphDiv = null;
  target.replaceChildren();
}

function estimateLegendRows(datasets, width, margins, scale, fontSize) {
  if (datasets.length <= 1) {
    return 0;
  }

  const left = margins.left ?? margins.l ?? 0;
  const right = margins.right ?? margins.r ?? 0;
  const availableWidth = Math.max(width - left - right, 320 * scale);
  let rows = 1;
  let usedWidth = 0;

  datasets.forEach((dataset) => {
    const labelWidth = String(dataset.label || "").length * fontSize * 0.58;
    const itemWidth = Math.min(Math.max(labelWidth + (58 * scale), 150 * scale), 360 * scale);
    if (usedWidth > 0 && usedWidth + itemWidth > availableWidth) {
      rows += 1;
      usedWidth = 0;
    }
    usedWidth += itemWidth;
  });

  return rows;
}

function getPlotlyMargins(payload, width, scale) {
  const margins = {
    t: 34 * scale,
    r: 36 * scale,
    b: 64 * scale,
    l: 78 * scale,
  };
  const legendRows = estimateLegendRows(payload.datasets, width, margins, scale, payload.legendFontsize * scale);
  if (legendRows) {
    margins.t += (legendRows * 25 * scale) + (10 * scale);
  }
  return margins;
}

function makePlotDomain(minValue, maxValue, axisMaxValue) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return undefined;
  }
  const range = maxValue - minValue;
  const pad = range > 0 ? range * 0.04 : Math.max(Math.abs(maxValue) * 0.04, 1);
  if (shouldAxisStartAtZero(minValue, maxValue)) {
    return [0, axisMaxValue || maxValue + pad];
  }
  return [minValue - pad, maxValue + pad];
}

function getFitAnnotation(payload, scale, colors) {
  if (!payload.fitText) {
    return [];
  }

  return [{
    align: "left",
    bgcolor: colors.fitLabelBg,
    bordercolor: colors.fitLabelBorder,
    borderpad: 8 * scale,
    borderwidth: 0.8 * scale,
    font: {
      color: colors.fitLabelText,
      family: "SFMono-Regular, Menlo, Monaco, Cascadia Mono, Roboto Mono, Consolas, monospace",
      size: 11 * scale,
    },
    opacity: 1,
    showarrow: false,
    text: payload.fitText.replace(/\n/g, "<br>"),
    x: 0.02,
    xanchor: "left",
    xref: "paper",
    y: 0.98,
    yanchor: "top",
    yref: "paper",
  }];
}

function plotlyDashStyle(dataset) {
  if (dataset.lineDash) {
    return dataset.lineDash;
  }
  if (dataset.lineStyle && dataset.lineStyle !== "solid") {
    const dashMap = {
      dashed: "dash",
      dotted: "dot",
      dashdot: "dashdot",
    };
    return dashMap[dataset.lineStyle] || "solid";
  }
  if (Array.isArray(dataset.borderDash) && dataset.borderDash.length) {
    if (dataset.borderDash.length >= 4) {
      return "dashdot";
    }
    return dataset.borderDash[0] <= 2 ? "dot" : "dash";
  }
  return "solid";
}

function plotlyFillColor(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 0.16)`;
  }
  if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", ", 0.16)");
  }
  return color;
}

function getTraceMode(dataset) {
  const hasLine = dataset.showLine !== false;
  const hasPoint = (dataset.pointRadius || 0) > 0;
  if (hasLine && hasPoint) return "lines+markers";
  if (hasLine) return "lines";
  return "markers";
}

function makePlotlyTraces(payload, scale, colors) {
  return payload.datasets.map((dataset) => {
    const stroke = dataset.borderColor || colors.axis;
    const fill = dataset.backgroundColor || stroke;

    if (dataset.chartType === "bar") {
      return {
        hovertemplate: `${payload.xLabel}: %{x}<br>${dataset.label}: %{y}<extra></extra>`,
        marker: {
          color: fill,
          line: { color: stroke, width: Math.max((dataset.borderWidth || 1) * 0.4, 0.5) },
        },
        name: dataset.label || "Series",
        type: "bar",
        x: dataset.data.map((point) => point.x),
        y: dataset.data.map((point) => point.y),
      };
    }

    return {
      fill: dataset.chartType === "area" ? "tozeroy" : undefined,
      fillcolor: dataset.chartType === "area" ? plotlyFillColor(fill) : undefined,
      hovertemplate: `${payload.xLabel}: %{x}<br>${dataset.label}: %{y}<extra></extra>`,
      line: {
        color: stroke,
        dash: plotlyDashStyle(dataset),
        shape: "linear",
        width: Math.max((dataset.borderWidth || 1.7) * scale, 1),
      },
      marker: {
        color: fill,
        line: {
          color: dataset.pointBorderColor || "rgb(252, 252, 249)",
          width: Math.max((dataset.pointBorderWidth || 0) * scale, 0.6),
        },
        size: Math.max((dataset.pointRadius || 0) * 2 * scale, 3 * scale),
      },
      mode: getTraceMode(dataset),
      name: dataset.label || "Series",
      type: "scatter",
      x: dataset.data.map((point) => point.x),
      y: dataset.data.map((point) => point.y),
    };
  });
}

function setPlotPreviewSize(target, graphDiv, previewSize, outputSize) {
  target.style.width = `${previewSize.width}px`;
  target.style.height = `${previewSize.height}px`;
  target.style.setProperty("--plot-output-width", `${outputSize.width}px`);
  target.style.setProperty("--plot-output-height", `${outputSize.height}px`);
  target.dataset.renderWidth = String(previewSize.width);
  target.dataset.renderHeight = String(previewSize.height);

  graphDiv.style.width = `${previewSize.width}px`;
  graphDiv.style.height = `${previewSize.height}px`;
}

async function renderPlotlyChart(payload, selector) {
  if (!window.Plotly) {
    throw new Error("Plotly.js 绘图库未加载，请检查网络后刷新页面。");
  }

  const target = getPlotTarget(selector);
  clearRenderedPlot(target);

  const outputSize = getPlotPixelSize(payload);
  const previewSize = getPlotPreviewSize(target, payload);
  const colors = getThemeColors();
  const scale = 1;
  const margin = getPlotlyMargins(payload, previewSize.width, scale);
  const yAxisMax = shouldAxisStartAtZero(payload.yMin, payload.yMax) ? nicePositiveAxisMax(payload.yMax) : undefined;

  const graphDiv = document.createElement("div");
  graphDiv.className = "plotly-export-surface";
  graphDiv.setAttribute("aria-label", `${payload.plotTitle || "X-Y 图"}，${payload.xLabel} 对 ${payload.yLabel}`);
  graphDiv.setAttribute("role", "img");
  target.appendChild(graphDiv);
  target._labPlotGraphDiv = graphDiv;
  setPlotPreviewSize(target, graphDiv, previewSize, outputSize);

  const layout = {
    annotations: getFitAnnotation(payload, scale, colors),
    autosize: false,
    font: {
      color: colors.text,
      family: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Arial, sans-serif",
      size: Math.max((payload.labelFontsize - 2) * scale, 8 * scale),
    },
    dragmode: "zoom",
    height: previewSize.height,
    hovermode: "closest",
    legend: {
      bgcolor: "rgba(0,0,0,0)",
      font: {
        color: colors.text,
        size: payload.legendFontsize * scale,
      },
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: 1.12,
      yanchor: "bottom",
    },
    margin,
    paper_bgcolor: colors.surface,
    plot_bgcolor: colors.surface,
    showlegend: payload.datasets.length > 1,
    width: previewSize.width,
    xaxis: {
      automargin: true,
      gridcolor: colors.line,
      linecolor: colors.axis,
      linewidth: 1.05 * scale,
      mirror: true,
      range: makePlotDomain(payload.xMin, payload.xMax),
      showgrid: payload.showGrid,
      showline: true,
      ticks: "outside",
      tickfont: { size: Math.max((payload.labelFontsize - 3) * scale, 7 * scale) },
      title: {
        automargin: true,
        font: { color: colors.text, size: payload.labelFontsize * scale },
        standoff: 12 * scale,
        text: payload.xLabel,
      },
      zeroline: false,
    },
    yaxis: {
      automargin: true,
      gridcolor: colors.line,
      linecolor: colors.axis,
      linewidth: 1.05 * scale,
      mirror: true,
      range: makePlotDomain(payload.yMin, payload.yMax, yAxisMax),
      showgrid: payload.showGrid,
      showline: true,
      ticks: "outside",
      tickfont: { size: Math.max((payload.labelFontsize - 3) * scale, 7 * scale) },
      title: {
        automargin: true,
        font: { color: colors.text, size: payload.labelFontsize * scale },
        standoff: 12 * scale,
        text: payload.yLabel,
      },
      zeroline: false,
    },
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    doubleClick: "reset+autosize",
    responsive: false,
    scrollZoom: true,
    staticPlot: false,
    toImageButtonOptions: {
      filename: payload.filenames.png.replace(/\.png$/i, ""),
      format: "png",
      height: previewSize.height,
      scale: outputSize.width / previewSize.width,
      width: previewSize.width,
    },
  };

  await Plotly.newPlot(graphDiv, makePlotlyTraces(payload, scale, colors), layout, config);

  target.dataset.renderer = "plotly";
  target.dataset.outputWidth = String(outputSize.width);
  target.dataset.outputHeight = String(outputSize.height);
}

async function renderChart(payload, canvasSelector = "#plotCanvas") {
  await renderPlotlyChart(payload, canvasSelector);
}
