"use strict";

function escapePlotlyText(value) {
  return cellText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPlotSourceColumns(xCol, curveConfigs) {
  const columns = [xCol];
  curveConfigs.forEach((config) => {
    [config.yCol, config.yErrorCol, config.xErrorCol].forEach((column) => {
      if (column && !columns.includes(column)) {
        columns.push(column);
      }
    });
  });
  return columns;
}

function makeRowsFromPairs(xCol, config, pairs, extraFields = null) {
  return pairs.map((point, index) => {
    const row = {
      [xCol]: point.x,
      [config.yCol]: point.y,
    };
    if (config.yErrorCol) {
      row[config.yErrorCol] = point.yError ?? "";
    }
    if (config.xErrorCol) {
      row[config.xErrorCol] = point.xError ?? "";
    }
    return extraFields ? { ...row, ...extraFields(point, index) } : row;
  });
}

function hasCurveErrorBars(config) {
  return Boolean(config.xErrorCol || config.yErrorCol);
}

function getErrorBarLabel(curveConfigs) {
  const count = curveConfigs.filter(hasCurveErrorBars).length;
  if (!count) {
    return "未使用";
  }
  return `${count} 条曲线`;
}

function formatSettingNumber(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (value === 0) {
    return "0";
  }

  const absValue = Math.abs(value);
  if (absValue < 0.01 || absValue >= 10000) {
    return value.toExponential(3);
  }
  return String(Number(value.toPrecision(6)));
}

function getAxisRangeLabel(range) {
  if (!range || (range.min === null && range.max === null)) {
    return "自动";
  }
  const min = range.min === null ? "自动" : formatSettingNumber(range.min);
  const max = range.max === null ? "自动" : formatSettingNumber(range.max);
  return `${min} ~ ${max}`;
}

function getReferenceLinesLabel(referenceLines) {
  const parts = [];
  if (referenceLines?.x !== null && referenceLines?.x !== undefined) {
    parts.push(`X=${formatSettingNumber(referenceLines.x)}`);
  }
  if (referenceLines?.y !== null && referenceLines?.y !== undefined) {
    parts.push(`Y=${formatSettingNumber(referenceLines.y)}`);
  }
  return parts.length ? parts.join("，") : "未添加";
}

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
  const xAxisScale = getControlValue("#xAxisScale") || "linear";
  const yAxisScale = getControlValue("#yAxisScale") || "linear";
  const legendMode = getControlValue("#legendMode") || "auto";
  const dataLabelMode = getControlValue("#dataLabelMode") || "none";

  if (!AXIS_SCALE_TYPES[xAxisScale] || !AXIS_SCALE_TYPES[yAxisScale]) {
    throw new Error("请选择正确的坐标轴刻度。");
  }
  if (!LEGEND_MODES[legendMode]) {
    throw new Error("请选择正确的图例位置。");
  }
  if (!DATA_LABEL_MODES[dataLabelMode]) {
    throw new Error("请选择正确的数据标签。");
  }

  const axisRanges = readAxisRangeControls(xAxisScale, yAxisScale);
  const referenceLines = readReferenceControls(xAxisScale, yAxisScale);

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
  let missingPointCount = 0;
  const plotSourceColumns = getPlotSourceColumns(xCol, curveConfigs);

  if (curveConfigs.length > 1) {
    fitType = "none";

    curveConfigs.forEach((config) => {
      const plotData = getCurvePlotData(xCol, config, chartType);
      const { pairs } = plotData;
      missingPointCount += plotData.gapCount;
      if (!pairs.length) {
        return;
      }
      allPairs.push(...pairs.map((point) => ({ ...point, yCol: config.yCol })));
      datasets.push(plotData.dataset);
    });

    if (!datasets.length) {
      throw new Error("所选列没有可绘图的成对数值。");
    }

    originRows = state.data.map((row) => {
      const item = {};
      plotSourceColumns.forEach((column) => {
        item[column] = row[column];
      });
      return item;
    });
  } else {
    const config = curveConfigs[0];
    const plotData = getCurvePlotData(xCol, config, chartType);
    const { pairs } = plotData;
    missingPointCount += plotData.gapCount;
    if (!pairs.length) {
      throw new Error("所选列没有可用数值。请检查表格。");
    }

    allPairs.push(...pairs.map((point) => ({ ...point, yCol: config.yCol })));
    originRows = makeRowsFromPairs(xCol, config, pairs);

    if (fitType === "linear") {
      fitResult = linearFit(pairs);
    } else if (fitType === "quadratic") {
      fitResult = quadraticFit(pairs);
    }

    if (fitResult) {
      datasets.push({
        label: "Data",
        chartType: "scatter",
        data: pairs,
        traceData: pairs,
        showLine: false,
        pointRadius: 4.2,
        pointHoverRadius: 5.2,
        pointBorderWidth: 1.2,
        pointBorderColor: "rgb(252, 252, 249)",
        borderColor: config.color,
        backgroundColor: config.color,
        xErrorCol: config.xErrorCol,
        yErrorCol: config.yErrorCol,
      });
      datasets.push({
        label: fitType === "linear" ? "Linear Fit" : "Quadratic Fit",
        chartType: "line",
        data: fitResult.fitPoints,
        traceData: fitResult.fitPoints,
        isFitLine: true,
        showLine: true,
        pointRadius: 0,
        borderColor: "rgb(31, 41, 55)",
        backgroundColor: "rgb(31, 41, 55)",
        borderWidth: Math.max(config.lineWidth + 0.5, 2),
        borderDash: [9, 5],
        lineShape: "linear",
      });

      const fitColumn = fitType === "linear" ? "linear_fit_y" : "quadratic_fit_y";
      originRows = makeRowsFromPairs(xCol, config, pairs, (point, index) => {
        const fitted = fitResult.yPred[index];
        const residual = point.y - fitted;
        return {
          [fitColumn]: fitted,
          residual,
          abs_residual: Math.abs(residual),
        };
      });
    } else {
      datasets.push(plotData.dataset);
    }
  }

  const xValues = allPairs.map((point) => point.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yValues = allPairs.map((point) => point.y);
  if (xAxisScale === "log" && xValues.some((value) => value <= 0)) {
    throw new Error("X 轴对数刻度要求所有 X 值都大于 0。");
  }
  if (yAxisScale === "log" && yValues.some((value) => value <= 0)) {
    throw new Error("Y 轴对数刻度要求所有 Y 值都大于 0。");
  }

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
    x_axis_scale: xAxisScale,
    y_axis_scale: yAxisScale,
    x_axis_scale_label: AXIS_SCALE_TYPES[xAxisScale],
    y_axis_scale_label: AXIS_SCALE_TYPES[yAxisScale],
    x_axis_range_label: getAxisRangeLabel(axisRanges.x),
    y_axis_range_label: getAxisRangeLabel(axisRanges.y),
    legend_mode: legendMode,
    legend_mode_label: LEGEND_MODES[legendMode],
    data_label_mode: dataLabelMode,
    data_label_mode_label: DATA_LABEL_MODES[dataLabelMode],
    reference_lines_label: getReferenceLinesLabel(referenceLines),
    reference_label: referenceLines.label,
    error_bar_count_label: getErrorBarLabel(curveConfigs),
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
    fit_type_label: curveConfigs.length > 1 ? MULTI_Y_FIT_LABEL : FIT_TYPES[fitType],
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
    missing_points: String(missingPointCount),
    missing_points_label: missingPointCount ? `${missingPointCount} 个缺失值` : "0",
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
    legendMode,
    dataLabelMode,
    axisRanges,
    referenceLines,
    xAxisScale,
    yAxisScale,
    chartType,
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

function getCurvePlotData(xCol, config, chartType) {
  const pairs = sortPairsByX(getPlotPairs(xCol, config.yCol, config));
  const series = getPlotSeries(xCol, config.yCol, config);
  return {
    dataset: pairs.length
      ? makeChartDataset(config.yCol, pairs, config, chartType, getTraceDataForChart(pairs, series, chartType))
      : null,
    gapCount: countPlotGaps(series),
    pairs,
  };
}

function getTraceDataForChart(pairs, series, chartType) {
  if (!shouldPreservePlotGaps(chartType)) {
    return pairs;
  }
  return sortPlotSeriesByX(series);
}

function makeChartDataset(label, pairs, config, chartType, traceData = pairs) {
  const isScatter = chartType === "scatter";
  const isLineOnly = chartType === "line";
  const isArea = chartType === "area";
  const isBar = chartType === "bar";

  return {
    label,
    chartType,
    data: pairs,
    traceData,
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
    lineShape: LINE_SHAPES[config.lineShape] ? config.lineShape : "linear",
    xErrorCol: config.xErrorCol,
    yErrorCol: config.yErrorCol,
    tension: 0,
    spanGaps: false,
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

function shouldUseZeroYBaseline(chartType) {
  return chartType === "bar" || chartType === "area";
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

function niceNegativeAxisMin(minValue) {
  if (!Number.isFinite(minValue) || minValue >= 0) {
    return undefined;
  }

  const axisMax = nicePositiveAxisMax(Math.abs(minValue));
  return Number.isFinite(axisMax) ? -axisMax : undefined;
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
    throw new Error("预览容器不存在。");
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

function shouldShowLegend(payload) {
  if (payload.legendMode === "hidden") {
    return false;
  }
  if (payload.legendMode && payload.legendMode !== "auto") {
    return true;
  }
  return payload.datasets.length > 1 && payload.dataLabelMode !== "last";
}

function getLegendLayout(payload, scale, colors) {
  const base = {
    bgcolor: "rgba(0,0,0,0)",
    font: {
      color: colors.text,
      size: payload.legendFontsize * scale,
    },
  };

  const mode = payload.legendMode === "auto" ? "top" : payload.legendMode;
  if (mode === "right") {
    return {
      ...base,
      orientation: "v",
      x: 1.02,
      xanchor: "left",
      y: 1,
      yanchor: "top",
    };
  }
  if (mode === "bottom") {
    return {
      ...base,
      orientation: "h",
      x: 0,
      xanchor: "left",
      y: -0.2,
      yanchor: "top",
    };
  }
  return {
    ...base,
    orientation: "h",
    x: 0,
    xanchor: "left",
    y: 1.12,
    yanchor: "bottom",
  };
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
  if (!shouldShowLegend(payload)) {
    return margins;
  }

  const legendMode = payload.legendMode === "auto" ? "top" : payload.legendMode;
  if (legendMode === "right") {
    margins.r += 150 * scale;
    return margins;
  }

  const legendRows = estimateLegendRows(payload.datasets, width, margins, scale, payload.legendFontsize * scale);
  if (!legendRows) {
    return margins;
  }
  if (legendMode === "bottom") {
    margins.b += (legendRows * 25 * scale) + (12 * scale);
  } else {
    margins.t += (legendRows * 25 * scale) + (10 * scale);
  }
  return margins;
}

function makePlotDomain(minValue, maxValue, options = {}) {
  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
    return undefined;
  }
  const { axisMaxValue, includeZero = false } = options;
  const range = maxValue - minValue;
  const pad = range > 0 ? range * 0.04 : Math.max(Math.abs(maxValue) * 0.04, 1);
  if (includeZero && minValue >= 0) {
    return [0, axisMaxValue || maxValue + pad];
  }
  if (includeZero && maxValue <= 0) {
    return [niceNegativeAxisMin(minValue) || minValue - pad, 0];
  }
  if (shouldAxisStartAtZero(minValue, maxValue)) {
    return [0, axisMaxValue || maxValue + pad];
  }
  return [minValue - pad, maxValue + pad];
}

function isLogScale(scaleType) {
  return scaleType === "log";
}

function getAxisRange(scaleType, minValue, maxValue, options) {
  const manualRange = options?.manualRange;
  if (manualRange && (manualRange.min !== null || manualRange.max !== null)) {
    const autoRange = isLogScale(scaleType)
      ? [minValue, maxValue]
      : (makePlotDomain(minValue, maxValue, options) || [minValue, maxValue]);
    const range = [
      manualRange.min === null ? autoRange[0] : manualRange.min,
      manualRange.max === null ? autoRange[1] : manualRange.max,
    ];
    return isLogScale(scaleType) ? range.map((value) => Math.log10(value)) : range;
  }

  return isLogScale(scaleType) ? undefined : makePlotDomain(minValue, maxValue, options);
}

function getHoverMode(payload) {
  return payload.datasets.length > 1 ? "x unified" : "closest";
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
    text: escapePlotlyText(payload.fitText).replace(/\n/g, "<br>"),
    x: 0.02,
    xanchor: "left",
    xref: "paper",
    y: 0.98,
    yanchor: "top",
    yref: "paper",
  }];
}

function getReferenceShapes(payload, colors) {
  const shapes = [];
  const referenceLines = payload.referenceLines || {};
  const line = {
    color: "rgba(75, 85, 99, 0.76)",
    dash: "dash",
    width: 1.1,
  };

  if (referenceLines.x !== null && referenceLines.x !== undefined) {
    shapes.push({
      line,
      type: "line",
      x0: referenceLines.x,
      x1: referenceLines.x,
      xref: "x",
      y0: 0,
      y1: 1,
      yref: "paper",
    });
  }

  if (referenceLines.y !== null && referenceLines.y !== undefined) {
    shapes.push({
      line: { ...line, color: "rgba(0, 114, 178, 0.72)" },
      type: "line",
      x0: 0,
      x1: 1,
      xref: "paper",
      y0: referenceLines.y,
      y1: referenceLines.y,
      yref: "y",
    });
  }

  return shapes;
}

function getReferenceAnnotations(payload, scale, colors) {
  const referenceLines = payload.referenceLines || {};
  const hasX = referenceLines.x !== null && referenceLines.x !== undefined;
  const hasY = referenceLines.y !== null && referenceLines.y !== undefined;
  const label = cellText(referenceLines.label);
  if (!label || (!hasX && !hasY)) {
    return [];
  }

  const base = {
    bgcolor: colors.fitLabelBg,
    bordercolor: colors.fitLabelBorder,
    borderpad: 5 * scale,
    borderwidth: 0.8 * scale,
    font: {
      color: colors.muted,
      size: Math.max((payload.legendFontsize - 1) * scale, 8 * scale),
    },
    showarrow: false,
  };
  const annotations = [];
  if (hasX) {
    annotations.push({
      ...base,
      text: escapePlotlyText(hasY ? `${label} X=${formatSettingNumber(referenceLines.x)}` : label),
      x: referenceLines.x,
      xanchor: "left",
      xref: "x",
      y: 0.98,
      yanchor: "top",
      yref: "paper",
    });
  }
  if (hasY) {
    annotations.push({
      ...base,
      text: escapePlotlyText(hasX ? `${label} Y=${formatSettingNumber(referenceLines.y)}` : label),
      x: 0.98,
      xanchor: "right",
      xref: "paper",
      y: referenceLines.y,
      yanchor: "bottom",
      yref: "y",
    });
  }
  return annotations;
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

function getPlotlyErrorConfig(traceData, key, color, scale) {
  if (!traceData.some((point) => Number.isFinite(point[key]) && point[key] > 0)) {
    return undefined;
  }

  return {
    array: traceData.map((point) => Number.isFinite(point[key]) && point[key] >= 0 ? point[key] : 0),
    color,
    symmetric: true,
    thickness: Math.max(1 * scale, 1),
    type: "data",
    visible: true,
    width: 3 * scale,
  };
}

function appendTextMode(mode) {
  return mode.includes("text") ? mode : `${mode}+text`;
}

function getLastVisiblePointIndex(traceData) {
  for (let index = traceData.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(traceData[index].x) && Number.isFinite(traceData[index].y)) {
      return index;
    }
  }
  return -1;
}

function applyTraceLabels(trace, dataset, payload, traceData) {
  if (payload.dataLabelMode === "none" || dataset.isFitLine) {
    return trace;
  }

  let text = [];
  if (payload.dataLabelMode === "all") {
    text = traceData.map((point) => Number.isFinite(point.y) ? formatShortNumber(point.y) : "");
  } else if (payload.dataLabelMode === "last") {
    const lastIndex = getLastVisiblePointIndex(traceData);
    text = traceData.map((_, index) => index === lastIndex ? dataset.label : "");
  }

  if (!text.some(Boolean)) {
    return trace;
  }

  trace.text = text.map(escapePlotlyText);
  trace.textposition = trace.type === "bar" ? "outside" : (payload.dataLabelMode === "last" ? "middle right" : "top center");
  trace.cliponaxis = false;
  if (trace.type === "scatter") {
    trace.mode = appendTextMode(trace.mode);
  }
  return trace;
}

function makePlotlyTraces(payload, scale, colors) {
  return payload.datasets.map((dataset) => {
    const stroke = dataset.borderColor || colors.axis;
    const fill = dataset.backgroundColor || stroke;
    const traceLabel = escapePlotlyText(dataset.label || "Series");
    const xLabel = escapePlotlyText(payload.xLabel);
    const traceData = dataset.traceData || dataset.data;

    if (dataset.chartType === "bar") {
      const trace = {
        error_x: getPlotlyErrorConfig(traceData, "xError", stroke, scale),
        error_y: getPlotlyErrorConfig(traceData, "yError", stroke, scale),
        hovertemplate: `${xLabel}: %{x}<br>${traceLabel}: %{y}<extra></extra>`,
        marker: {
          color: fill,
          line: { color: stroke, width: Math.max((dataset.borderWidth || 1) * 0.4, 0.5) },
        },
        name: traceLabel,
        type: "bar",
        x: traceData.map((point) => point.x),
        y: traceData.map((point) => point.y),
      };
      return applyTraceLabels(trace, dataset, payload, traceData);
    }

    const trace = {
      connectgaps: false,
      error_x: getPlotlyErrorConfig(traceData, "xError", stroke, scale),
      error_y: getPlotlyErrorConfig(traceData, "yError", stroke, scale),
      fill: dataset.chartType === "area" && !isLogScale(payload.yAxisScale) ? "tozeroy" : undefined,
      fillcolor: dataset.chartType === "area" && !isLogScale(payload.yAxisScale) ? plotlyFillColor(fill) : undefined,
      hovertemplate: `${xLabel}: %{x}<br>${traceLabel}: %{y}<extra></extra>`,
      line: {
        color: stroke,
        dash: plotlyDashStyle(dataset),
        shape: dataset.lineShape || "linear",
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
      name: traceLabel,
      type: "scatter",
      x: traceData.map((point) => point.x),
      y: traceData.map((point) => point.y),
    };
    return applyTraceLabels(trace, dataset, payload, traceData);
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
    await ensureExternalLibrary("plotly");
  }

  const target = getPlotTarget(selector);
  clearRenderedPlot(target);

  const outputSize = getPlotPixelSize(payload);
  const previewSize = getPlotPreviewSize(target, payload);
  const colors = getThemeColors();
  const scale = 1;
  const margin = getPlotlyMargins(payload, previewSize.width, scale);
  const forceYZeroBaseline = shouldUseZeroYBaseline(payload.chartType);
  const yAxisMax = !isLogScale(payload.yAxisScale)
    && payload.yMax >= 0
    && (forceYZeroBaseline || shouldAxisStartAtZero(payload.yMin, payload.yMax))
    ? nicePositiveAxisMax(payload.yMax)
    : undefined;

  const graphDiv = document.createElement("div");
  graphDiv.className = "plotly-export-surface";
  graphDiv.setAttribute("aria-label", `${payload.plotTitle || "X-Y 图"}，${payload.xLabel} 对 ${payload.yLabel}`);
  graphDiv.setAttribute("role", "img");
  target.appendChild(graphDiv);
  target._labPlotGraphDiv = graphDiv;
  setPlotPreviewSize(target, graphDiv, previewSize, outputSize);

  const layout = {
    annotations: [
      ...getFitAnnotation(payload, scale, colors),
      ...getReferenceAnnotations(payload, scale, colors),
    ],
    autosize: false,
    font: {
      color: colors.text,
      family: "-apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Arial, sans-serif",
      size: Math.max((payload.labelFontsize - 2) * scale, 8 * scale),
    },
    dragmode: "zoom",
    height: previewSize.height,
    hoverlabel: {
      bgcolor: colors.surface,
      bordercolor: colors.line,
      font: { color: colors.text },
    },
    hovermode: getHoverMode(payload),
    legend: getLegendLayout(payload, scale, colors),
    margin,
    paper_bgcolor: colors.surface,
    plot_bgcolor: colors.surface,
    shapes: getReferenceShapes(payload, colors),
    showlegend: shouldShowLegend(payload),
    width: previewSize.width,
    xaxis: {
      automargin: true,
      exponentformat: "power",
      gridcolor: colors.line,
      linecolor: colors.axis,
      linewidth: 1.05 * scale,
      mirror: true,
      range: getAxisRange(payload.xAxisScale, payload.xMin, payload.xMax, {
        manualRange: payload.axisRanges.x,
      }),
      showgrid: payload.showGrid,
      showline: true,
      showspikes: true,
      spikecolor: colors.line,
      spikedash: "solid",
      spikemode: "across",
      spikesnap: "cursor",
      spikethickness: 1 * scale,
      ticks: "outside",
      tickfont: { size: Math.max((payload.labelFontsize - 3) * scale, 7 * scale) },
      title: {
        automargin: true,
        font: { color: colors.text, size: payload.labelFontsize * scale },
        standoff: 12 * scale,
        text: escapePlotlyText(payload.xLabel),
      },
      type: payload.xAxisScale,
      zeroline: false,
    },
    yaxis: {
      automargin: true,
      exponentformat: "power",
      gridcolor: colors.line,
      linecolor: colors.axis,
      linewidth: 1.05 * scale,
      mirror: true,
      range: getAxisRange(payload.yAxisScale, payload.yMin, payload.yMax, {
        axisMaxValue: yAxisMax,
        includeZero: forceYZeroBaseline,
        manualRange: payload.axisRanges.y,
      }),
      showgrid: payload.showGrid,
      showline: true,
      showspikes: true,
      spikecolor: colors.line,
      spikedash: "solid",
      spikemode: "across",
      spikesnap: "cursor",
      spikethickness: 1 * scale,
      ticks: "outside",
      tickfont: { size: Math.max((payload.labelFontsize - 3) * scale, 7 * scale) },
      title: {
        automargin: true,
        font: { color: colors.text, size: payload.labelFontsize * scale },
        standoff: 12 * scale,
        text: escapePlotlyText(payload.yLabel),
      },
      type: payload.yAxisScale,
      zeroline: forceYZeroBaseline && !isLogScale(payload.yAxisScale),
    },
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    doubleClick: "reset+autosize",
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
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
