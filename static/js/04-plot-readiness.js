"use strict";

function normalizeSelectedMetrics() {
  const mode = getControlValue("#metricMode");
  if (mode === "basic") {
    return BASIC_METRICS.slice();
  }

  const selected = qsa('[name="selectedMetrics"]')
    .filter(getControlChecked)
    .map((input) => getControlValue(input));
  return selected.length ? selected : BASIC_METRICS.slice();
}

function getPlotPairs(xCol, yCol) {
  return state.data
    .map((row) => ({
      x: toNumber(row[xCol]),
      y: toNumber(row[yCol]),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function sortPairsByX(pairs) {
  return pairs.slice().sort((a, b) => {
    if (a.x === b.x) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });
}

function getSelectedCurveSummary() {
  return qsa("#curveConfigBox .curve-row")
    .map((row) => {
      return getControlValue(row.querySelector('[name="curveYCols"]'));
    })
    .filter(Boolean);
}

function readOutputSize() {
  const figWidth = parsePositiveFloat(getControlValue("#figWidth"), 7, "图片宽度", 3, 20);
  const figHeight = parsePositiveFloat(getControlValue("#figHeight"), 4.6, "图片高度", 2, 16);
  const figDpi = Math.round(parsePositiveFloat(getControlValue("#figDpi"), 300, "图片 DPI", 72, 600));
  return {
    width: Math.round(figWidth * figDpi),
    height: Math.round(figHeight * figDpi),
  };
}

function getPendingReadiness(status, hint, overrides = {}) {
  return {
    level: "neutral",
    canGenerate: false,
    status,
    hint,
    ...PLOT_PENDING_VALUES,
    ...overrides,
  };
}

function inspectPlotReadiness() {
  if (!state.data.length || !state.numericColumns.length) {
    return getPendingReadiness("等待数据", "上传或载入示例数据后再生成图像。");
  }

  const xCol = getControlValue("#xCol");
  const yCols = getSelectedCurveSummary();
  const fitType = getControlValue("#fitType");

  if (!xCol || !yCols.length) {
    return getPendingReadiness("等待选择绘图列", "选择 X 轴和至少一条 Y 轴曲线。");
  }

  if (yCols.includes(xCol)) {
    return getPendingReadiness("列选择有冲突", "X 轴和 Y 轴不能使用同一列。", {
      level: "danger",
      fit: "不可用",
    });
  }

  let outputSize;
  try {
    outputSize = readOutputSize();
  } catch (error) {
    return getPendingReadiness("导出尺寸需要检查", error.message, {
      level: "danger",
      fit: "待检查",
    });
  }

  const curveInfos = yCols.map((yCol) => {
    const pairs = getPlotPairs(xCol, yCol);
    const uniqueX = new Set(pairs.map((point) => point.x));
    return { yCol, pairs, uniqueX };
  });
  const validCounts = curveInfos.map((info) => info.pairs.length);
  const minPoints = Math.min(...validCounts);
  const pointLabel = yCols.length > 1
    ? `${validCounts.join(" / ")} 点`
    : `${minPoints} 点`;

  if (minPoints <= 0) {
    return {
      level: "danger",
      canGenerate: false,
      status: "没有可绘制数据",
      hint: "所选 X/Y 列中没有成对的数值数据。",
      points: pointLabel,
      fit: "不可用",
      exportSize: `${outputSize.width} × ${outputSize.height}px`,
    };
  }

  if (yCols.length > 1) {
    return {
      level: "warning",
      canGenerate: true,
      status: "多曲线绘图就绪",
      hint: "多曲线模式会生成图像，但暂不输出拟合结果。",
      points: pointLabel,
      fit: "多曲线不拟合",
      exportSize: `${outputSize.width} × ${outputSize.height}px`,
    };
  }

  const onlyCurve = curveInfos[0];
  let fitLabel = FIT_TYPES[fitType] || "待选择";
  let level = "ready";
  let hint = "数据点和导出设置已通过检查。";
  let canGenerate = true;

  if (fitType === "linear" && (onlyCurve.pairs.length < 2 || onlyCurve.uniqueX.size < 2)) {
    level = "danger";
    canGenerate = false;
    fitLabel = "一次拟合不可用";
    hint = "一次拟合至少需要 2 个不同的 X 值。";
  } else if (fitType === "quadratic" && (onlyCurve.pairs.length < 3 || onlyCurve.uniqueX.size < 3)) {
    level = "danger";
    canGenerate = false;
    fitLabel = "二次拟合不可用";
    hint = "二次拟合至少需要 3 个不同的 X 值。";
  } else if (fitType === "none") {
    fitLabel = "不拟合，只绘图";
  }

  return {
    level,
    canGenerate,
    status: canGenerate ? "可以生成" : "暂不能生成",
    hint,
    points: pointLabel,
    fit: fitLabel,
    exportSize: `${outputSize.width} × ${outputSize.height}px`,
  };
}

function syncFitAvailability() {
  const fitSelect = qs("#fitType");
  if (!fitSelect) {
    return;
  }

  const isMultiCurve = getSelectedCurveSummary().length > 1;
  setControlDisabled(fitSelect, isMultiCurve);
  if (isMultiCurve) {
    setControlValue(fitSelect, "none");
  }
}

function syncMetricBoxVisibility() {
  const metricBox = qs(".metric-box");
  const metricMode = qs("#metricMode");
  if (!metricBox || !metricMode) {
    return;
  }

  const isCustom = getControlValue(metricMode) === "custom";
  metricBox.classList.toggle("is-hidden", !isCustom);
  metricBox.setAttribute("aria-hidden", String(!isCustom));
}

function updatePlotReadiness() {
  const box = qs("#plotReadinessBox");
  const submitButton = qs("#plotSubmitButton");
  if (!box || !submitButton) {
    return;
  }

  syncFitAvailability();
  syncMetricBoxVisibility();

  const info = inspectPlotReadiness();
  box.className = `plot-readiness ${info.level}`;
  qs("#plotReadyStatus").textContent = info.status;
  qs("#plotReadyHint").textContent = info.hint;
  qs("#plotReadyPoints").textContent = info.points;
  qs("#plotReadyFit").textContent = info.fit;
  qs("#plotReadyExport").textContent = info.exportSize;

  submitButton.disabled = state.isPlotGenerating || !info.canGenerate;
  return info;
}

function setPlotProgress(text, visible = true) {
  const progress = qs("#plotProgress");
  const progressText = qs("#plotProgressText");
  if (!progress || !progressText) {
    return;
  }

  progressText.textContent = text;
  progress.classList.toggle("is-hidden", !visible);
}

function setPlotGenerating(isGenerating, text = "正在生成") {
  state.isPlotGenerating = isGenerating;
  const submitButton = qs("#plotSubmitButton");
  const plotForm = qs("#plotForm");
  if (plotForm) {
    plotForm.setAttribute("aria-busy", String(isGenerating));
  }
  if (submitButton) {
    submitButton.textContent = isGenerating ? "生成中..." : "生成图像与拟合结果";
  }
  setPlotProgress(text, isGenerating);
  updatePlotReadiness();
}
