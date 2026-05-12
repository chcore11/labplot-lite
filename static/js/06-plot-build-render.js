"use strict";

function buildPlotPayload() {
  const xCol = qs("#xCol").value;
  const curveConfigs = getCurveConfigsFromForm();
  const yCols = curveConfigs.map((config) => config.yCol);
  const uniqueYCols = Array.from(new Set(yCols));
  const chartType = qs("#chartType").value;
  let fitType = qs("#fitType").value;
  const metricMode = qs("#metricMode").value;
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

  const figWidth = parsePositiveFloat(qs("#figWidth").value, 7, "图片宽度", 3, 20);
  const figHeight = parsePositiveFloat(qs("#figHeight").value, 4.6, "图片高度", 2, 16);
  const figDpi = Math.round(parsePositiveFloat(qs("#figDpi").value, 300, "图片 DPI", 72, 600));
  const titleFontsize = parsePositiveFloat(qs("#titleFontsize").value, 15, "标题字体大小", 8, 40);
  const labelFontsize = parsePositiveFloat(qs("#labelFontsize").value, 13, "坐标轴字体大小", 8, 32);
  const legendFontsize = parsePositiveFloat(qs("#legendFontsize").value, 11, "图例字体大小", 6, 24);
  const showGrid = qs("#showGrid").checked;

  const xLabel = cellText(qs("#xLabel").value) || xCol;
  const yLabel = cellText(qs("#yLabel").value) || (curveConfigs.length > 1 ? uniqueYCols.join(" / ") : yCols[0]);
  const plotTitle = autoTitle(qs("#plotTitle").value, xLabel, yLabel);
  const headerRow = parsePositiveInt(qs("#headerRow").value, 1);
  const dataStartRow = parsePositiveInt(qs("#dataStartRow").value, headerRow + 1);
  const dataEndRow = parsePositiveInt(qs("#dataEndRow").value, null);

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

  return {
    label,
    data: pairs,
    showLine: !isScatter,
    pointRadius: isLineOnly ? 0 : 3.6,
    pointHoverRadius: isLineOnly ? 0 : 4.8,
    pointBorderWidth: isLineOnly ? 0 : 1,
    pointBorderColor: "rgb(252, 252, 249)",
    borderColor: config.color,
    backgroundColor: config.color,
    borderWidth: Math.max(config.lineWidth, 1.7),
    borderDash: LINE_DASHES[config.lineStyle],
    tension: 0,
    spanGaps: true,
  };
}

function chartRenderScale(payload) {
  return Math.max(payload.figDpi / 96, 1);
}

function scaledChartValue(value, scale, minValue = 0) {
  if (!Number.isFinite(value)) {
    return value;
  }
  return Math.max(value * scale, minValue);
}

function scaleChartDataset(dataset, scale) {
  return {
    ...dataset,
    borderWidth: scaledChartValue(dataset.borderWidth || 0, scale, dataset.showLine === false ? 0 : 1),
    borderDash: Array.isArray(dataset.borderDash)
      ? dataset.borderDash.map((value) => scaledChartValue(value, scale))
      : dataset.borderDash,
    pointRadius: scaledChartValue(dataset.pointRadius || 0, scale),
    pointHoverRadius: scaledChartValue(dataset.pointHoverRadius || 0, scale),
    pointBorderWidth: scaledChartValue(dataset.pointBorderWidth || 0, scale),
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

function getPlotTarget(selector) {
  const target = qs(selector);
  if (!target) {
    throw new Error("图像预览容器不存在。");
  }
  return target;
}

function clearRenderedPlot(target) {
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }
  if (target instanceof HTMLCanvasElement) {
    const context = target.getContext("2d");
    if (context) {
      context.clearRect(0, 0, target.width, target.height);
    }
    return;
  }
  target.replaceChildren();
}

function prepareCanvasTarget(selector) {
  const target = getPlotTarget(selector);
  clearRenderedPlot(target);
  if (target instanceof HTMLCanvasElement) {
    return target;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "plot-canvas";
  canvas.setAttribute("aria-label", target.getAttribute("aria-label") || "X-Y 图");
  target.dataset.renderer = "chartjs";
  target.appendChild(canvas);
  return canvas;
}

function dashArrayToString(dashArray, scale) {
  if (!Array.isArray(dashArray) || !dashArray.length) {
    return null;
  }
  return dashArray.map((value) => Math.max(value * scale, 1).toFixed(2)).join(" ");
}

function estimateLegendRows(datasets, width, margins, scale, fontSize) {
  if (datasets.length <= 1) {
    return 0;
  }

  const availableWidth = Math.max(width - margins.left - margins.right, 320 * scale);
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

function getObservablePlotLayout(payload, width, scale) {
  const margins = {
    top: 34 * scale,
    right: 36 * scale,
    bottom: 64 * scale,
    left: 78 * scale,
  };
  const legendRows = estimateLegendRows(payload.datasets, width, margins, scale, payload.legendFontsize * scale);
  if (legendRows) {
    margins.top += (legendRows * 25 * scale) + (10 * scale);
  }
  return margins;
}

function makePlotDomain(minValue, maxValue, axisMaxValue) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return undefined;
  }
  if (shouldAxisStartAtZero(minValue, maxValue)) {
    return [0, axisMaxValue || maxValue];
  }
  return undefined;
}

function appendObservableLegend(svg, payload, layout, scale, colors) {
  if (payload.datasets.length <= 1) {
    return;
  }

  const fontSize = payload.legendFontsize * scale;
  const lineLength = 20 * scale;
  const itemGap = 16 * scale;
  const rowGap = 24 * scale;
  const startX = layout.left;
  const maxX = Number(svg.getAttribute("width")) - layout.right;
  let x = startX;
  let y = 26 * scale;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("aria-hidden", "true");
  svg.appendChild(group);

  payload.datasets.forEach((dataset) => {
    const label = String(dataset.label || "Series");
    const color = dataset.borderColor || dataset.backgroundColor || colors.axis;
    const labelWidth = label.length * fontSize * 0.58;
    const itemWidth = Math.min(Math.max(labelWidth + (58 * scale), 150 * scale), 360 * scale);

    if (x > startX && x + itemWidth > maxX) {
      x = startX;
      y += rowGap;
    }

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x));
    line.setAttribute("x2", String(x + lineLength));
    line.setAttribute("y1", String(y));
    line.setAttribute("y2", String(y));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", String(Math.max((dataset.borderWidth || 1.7) * scale, 1)));
    const dash = dashArrayToString(dataset.borderDash, scale);
    if (dash) {
      line.setAttribute("stroke-dasharray", dash);
    }
    group.appendChild(line);

    if (dataset.pointRadius) {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(x + (lineLength / 2)));
      dot.setAttribute("cy", String(y));
      dot.setAttribute("r", String(Math.max(dataset.pointRadius * scale, 2 * scale)));
      dot.setAttribute("fill", dataset.backgroundColor || color);
      dot.setAttribute("stroke", dataset.pointBorderColor || "rgb(252, 252, 249)");
      dot.setAttribute("stroke-width", String(Math.max((dataset.pointBorderWidth || 0) * scale, 0.8)));
      group.appendChild(dot);
    }

    const labelNode = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelNode.textContent = label;
    labelNode.setAttribute("x", String(x + lineLength + (8 * scale)));
    labelNode.setAttribute("y", String(y + (fontSize * 0.35)));
    labelNode.setAttribute("fill", colors.text);
    labelNode.setAttribute("font-size", String(fontSize));
    labelNode.setAttribute("font-weight", "560");
    group.appendChild(labelNode);

    x += itemWidth + itemGap;
  });
}

function appendObservableFitLabel(svg, payload, layout, scale, colors) {
  if (!payload.fitText) {
    return;
  }

  const lines = payload.fitText.split("\n");
  const fontSize = 11 * scale;
  const lineHeight = 16 * scale;
  const padding = 8 * scale;
  const x = layout.left + (14 * scale);
  const y = layout.top + (12 * scale);
  const textWidth = Math.max(...lines.map((line) => line.length * fontSize * 0.62));
  const boxWidth = textWidth + (padding * 2);
  const boxHeight = (lines.length * lineHeight) + (padding * 2);

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("aria-hidden", "true");
  svg.appendChild(group);

  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(boxWidth));
  rect.setAttribute("height", String(boxHeight));
  rect.setAttribute("rx", String(5 * scale));
  rect.setAttribute("fill", colors.fitLabelBg);
  rect.setAttribute("stroke", colors.fitLabelBorder);
  rect.setAttribute("stroke-width", String(0.8 * scale));
  group.appendChild(rect);

  lines.forEach((line, index) => {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent = line;
    text.setAttribute("x", String(x + padding));
    text.setAttribute("y", String(y + padding + fontSize + (index * lineHeight)));
    text.setAttribute("fill", colors.fitLabelText);
    text.setAttribute("font-size", String(fontSize));
    text.setAttribute("font-weight", "560");
    group.appendChild(text);
  });
}

function makeObservableMarks(payload, scale, colors) {
  const marks = [];
  payload.datasets.forEach((dataset) => {
    const stroke = dataset.borderColor || colors.axis;
    const fill = dataset.backgroundColor || stroke;
    const dash = dashArrayToString(dataset.borderDash, scale);

    if (dataset.showLine !== false) {
      marks.push(Plot.line(dataset.data, {
        x: "x",
        y: "y",
        stroke,
        strokeWidth: Math.max((dataset.borderWidth || 1.7) * scale, 1),
        strokeDasharray: dash,
        curve: "linear",
      }));
    }

    if ((dataset.pointRadius || 0) > 0) {
      marks.push(Plot.dot(dataset.data, {
        x: "x",
        y: "y",
        r: Math.max(dataset.pointRadius * scale, 1.8 * scale),
        fill,
        stroke: dataset.pointBorderColor || "rgb(252, 252, 249)",
        strokeWidth: Math.max((dataset.pointBorderWidth || 0) * scale, 0.6),
      }));
    }
  });

  marks.push(Plot.frame({
    stroke: colors.axis,
    strokeWidth: 1.05 * scale,
  }));
  return marks;
}

function renderObservablePlot(payload, selector) {
  if (!window.Plot) {
    throw new Error("Observable Plot 绘图库未加载，请检查网络后刷新页面。");
  }

  const target = getPlotTarget(selector);
  clearRenderedPlot(target);

  const { width, height } = getPlotPixelSize(payload);
  const colors = getThemeColors();
  const scale = chartRenderScale(payload);
  const layout = getObservablePlotLayout(payload, width, scale);
  const yAxisMax = shouldAxisStartAtZero(payload.yMin, payload.yMax) ? nicePositiveAxisMax(payload.yMax) : undefined;
  const plot = Plot.plot({
    width,
    height,
    marginTop: layout.top,
    marginRight: layout.right,
    marginBottom: layout.bottom,
    marginLeft: layout.left,
    style: {
      background: colors.surface,
      color: colors.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Arial, sans-serif",
      fontSize: `${Math.max((payload.labelFontsize - 2) * scale, 8 * scale)}px`,
    },
    x: {
      label: payload.xLabel,
      grid: payload.showGrid,
      domain: makePlotDomain(payload.xMin, payload.xMax),
      nice: true,
      tickFormat: formatShortNumber,
    },
    y: {
      label: payload.yLabel,
      grid: payload.showGrid,
      domain: makePlotDomain(payload.yMin, payload.yMax, yAxisMax),
      nice: true,
      tickFormat: formatShortNumber,
    },
    marks: makeObservableMarks(payload, scale, colors),
  });

  plot.setAttribute("role", "img");
  plot.setAttribute("aria-label", `${payload.plotTitle || "X-Y 图"}，${payload.xLabel} 对 ${payload.yLabel}`);
  plot.classList.add("plot-svg");
  appendObservableLegend(plot, payload, layout, scale, colors);
  appendObservableFitLabel(plot, payload, layout, scale, colors);

  target.dataset.renderer = "observable-plot";
  target.style.setProperty("--plot-output-width", `${width}px`);
  target.style.setProperty("--plot-output-height", `${height}px`);
  target.appendChild(plot);
}

function ensureChartPlugin() {
  if (!window.Chart || window.__labplotFitLabelPluginRegistered) {
    return;
  }

  Chart.register({
    id: "canvasBackground",
    beforeDraw(chart, args, options) {
      const { ctx, width, height } = chart;
      ctx.save();
      ctx.globalCompositeOperation = "destination-over";
      ctx.fillStyle = options.color || "rgb(248, 250, 252)";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    },
  });

  Chart.register({
    id: "fitLabelBox",
    afterDraw(chart, args, options) {
      if (!options || !options.text) {
        return;
      }

      const { ctx, chartArea } = chart;
      const lines = options.text.split("\n");
      const scale = options.scale || 1;
      const padding = 8 * scale;
      const lineHeight = 15 * scale;
      const radius = 5 * scale;
      ctx.save();
      ctx.font = `${11 * scale}px -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif`;
      const width = Math.max(...lines.map((line) => ctx.measureText(line).width)) + (padding * 2);
      const height = (lines.length * lineHeight) + (padding * 2);
      const x = chartArea.left + (12 * scale);
      const y = chartArea.top + (12 * scale);

      ctx.fillStyle = options.backgroundColor || "rgba(248, 250, 252, 0.92)";
      ctx.strokeStyle = options.borderColor || "rgba(148, 163, 184, 0.45)";
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, width, height, radius);
      } else {
        ctx.rect(x, y, width, height);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = options.color || "rgb(15, 23, 42)";
      lines.forEach((line, index) => {
        ctx.fillText(line, x + padding, y + padding + (11 * scale) + (index * lineHeight));
      });
      ctx.restore();
    },
  });

  Chart.register({
    id: "journalFrame",
    afterDraw(chart, args, options) {
      if (!options || options.display === false) {
        return;
      }

      const { ctx, chartArea } = chart;
      ctx.save();
      ctx.strokeStyle = options.color || "rgb(17, 24, 39)";
      ctx.lineWidth = options.width || 1.2;
      ctx.strokeRect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
      ctx.restore();
    },
  });

  window.__labplotFitLabelPluginRegistered = true;
}

function renderChartWithChartJs(payload, canvasSelector = "#plotCanvas") {
  if (!window.Chart) {
    throw new Error("图表库未加载，请检查网络后刷新页面。");
  }

  ensureChartPlugin();

  const canvas = prepareCanvasTarget(canvasSelector);
  const { width, height } = getPlotPixelSize(payload);
  canvas.width = width;
  canvas.height = height;

  if (state.chart) {
    state.chart.destroy();
  }

  const colors = getThemeColors();
  const scale = chartRenderScale(payload);
  const chartDatasets = payload.datasets.map((dataset) => scaleChartDataset(dataset, scale));
  const axisLineWidth = 1.05 * scale;
  const tickFontSize = Math.max((payload.labelFontsize - 2) * scale, 8 * scale);
  const labelFontSize = payload.labelFontsize * scale;
  const legendFontSize = payload.legendFontsize * scale;
  const xAxisMin = shouldAxisStartAtZero(payload.xMin, payload.xMax) ? 0 : undefined;
  const yAxisMin = shouldAxisStartAtZero(payload.yMin, payload.yMax) ? 0 : undefined;
  const xAxisMax = xAxisMin === 0 ? payload.xMax : undefined;
  const yAxisMax = yAxisMin === 0 ? nicePositiveAxisMax(payload.yMax) : undefined;

  state.chart = new Chart(canvas, {
    type: "scatter",
    data: {
      datasets: chartDatasets,
    },
    options: {
      responsive: false,
      animation: false,
      devicePixelRatio: 1,
      parsing: false,
      layout: {
        padding: {
          top: 18 * scale,
          right: 34 * scale,
          bottom: 24 * scale,
          left: 28 * scale,
        },
      },
      elements: {
        line: {
          borderCapStyle: "round",
          borderJoinStyle: "round",
        },
        point: {
          hitRadius: 8 * scale,
        },
      },
      plugins: {
        title: {
          display: false,
          text: payload.plotTitle,
          color: colors.text,
          align: "center",
          font: {
            size: payload.titleFontsize * scale,
            weight: "650",
          },
          padding: {
            bottom: 14 * scale,
          },
        },
        legend: {
          display: chartDatasets.length > 1,
          position: "top",
          align: "center",
          labels: {
            color: colors.text,
            usePointStyle: true,
            boxWidth: 9 * scale,
            boxHeight: 9 * scale,
            padding: 14 * scale,
            font: {
              size: legendFontSize,
              weight: "560",
            },
          },
        },
        fitLabelBox: {
          text: payload.fitText,
          backgroundColor: colors.fitLabelBg,
          borderColor: colors.fitLabelBorder,
          color: colors.fitLabelText,
          scale,
        },
        canvasBackground: {
          color: colors.surface,
        },
        journalFrame: {
          display: true,
          color: colors.axis,
          width: axisLineWidth,
        },
      },
      scales: {
        x: {
          type: "linear",
          grace: "2%",
          min: xAxisMin,
          max: xAxisMax,
          border: {
            display: true,
            color: colors.axis,
            width: axisLineWidth,
          },
          title: {
            display: true,
            text: payload.xLabel,
            color: colors.text,
            font: {
              size: labelFontSize,
              weight: "620",
            },
            padding: {
              top: 10 * scale,
            },
          },
          ticks: {
            color: colors.muted,
            padding: 7 * scale,
            maxTicksLimit: 8,
            font: {
              size: tickFontSize,
              weight: "520",
            },
          },
          grid: {
            display: true,
            drawOnChartArea: payload.showGrid,
            color: colors.line,
            tickColor: colors.axis,
            tickLength: 5 * scale,
            lineWidth: 0.65 * scale,
          },
        },
        y: {
          grace: "8%",
          min: yAxisMin,
          max: yAxisMax,
          border: {
            display: true,
            color: colors.axis,
            width: axisLineWidth,
          },
          title: {
            display: true,
            text: payload.yLabel,
            color: colors.text,
            font: {
              size: labelFontSize,
              weight: "620",
            },
            padding: {
              bottom: 10 * scale,
            },
          },
          ticks: {
            color: colors.muted,
            padding: 7 * scale,
            maxTicksLimit: 7,
            font: {
              size: tickFontSize,
              weight: "520",
            },
          },
          grid: {
            display: true,
            drawOnChartArea: payload.showGrid,
            color: colors.line,
            tickColor: colors.axis,
            tickLength: 5 * scale,
            lineWidth: 0.65 * scale,
          },
        },
      },
    },
  });

  canvas.style.width = "min(100%, 980px)";
  canvas.style.height = "auto";
}

function renderChart(payload, canvasSelector = "#plotCanvas") {
  if (window.Plot) {
    renderObservablePlot(payload, canvasSelector);
    return;
  }
  renderChartWithChartJs(payload, canvasSelector);
}
