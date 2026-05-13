"use strict";

function syncRawRowsFromData() {
  state.rawRows = [
    state.columns.slice(),
    ...state.data.map((row) => state.columns.map((column) => row[column] ?? "")),
  ];
  setControlValue("#headerRow", "1");
  setControlValue("#dataStartRow", "2");
  setControlValue("#dataEndRow", "");
}

function renderPreview() {
  const header = qs("#previewHeaderRow");
  const body = qs("#previewBody");
  header.replaceChildren();
  body.replaceChildren();

  const previewRows = state.rawRows.slice(0, 15);
  const maxColumns = Math.max(0, ...previewRows.map((row) => row.length));
  header.append(
    createElement("cds-table-header-cell", { textContent: "行" }),
    ...Array.from({ length: maxColumns }, (_, index) => createElement("cds-table-header-cell", { textContent: `列 ${index + 1}` })),
  );

  previewRows.forEach((row, index) => {
    body.appendChild(createElement("cds-table-row", {
      children: [
        createElement("cds-table-cell", { textContent: `第 ${index + 1} 行` }),
        ...row.map((value) => createElement("cds-table-cell", { textContent: cellText(value) })),
      ],
    }));
  });
}

function renderColumnsBox(target, label) {
  target.replaceChildren();
  target.append(
    createElement("span", { textContent: label }),
    ...state.numericColumns.map((column) => createElement("cds-tag", {
      attributes: { size: "sm", type: "gray" },
      textContent: column,
    })),
  );
}

function getSamplePreset(fileName) {
  return SAMPLE_PRESETS[fileName] || null;
}

function columnOptionExists(column) {
  return Boolean(column && state.numericColumns.includes(column));
}

function setSelectIfExists(selector, value) {
  const select = qs(selector);
  if (!select || value === undefined || value === null) {
    return false;
  }

  const exists = getControlOptions(select).some((option) => option.value === value);
  if (!exists) {
    return false;
  }

  setControlValue(select, value);
  return true;
}

function setControlIfDefined(selector, value) {
  if (value !== undefined && value !== null) {
    setControlValue(selector, value);
  }
}

function getPresetCurves(preset) {
  if (Array.isArray(preset.curves) && preset.curves.length) {
    return preset.curves;
  }

  const yCols = preset.yCols || [preset.yCol].filter(Boolean);
  return yCols.map((yCol, yIndex) => ({
    yCol,
    color: DEFAULT_CURVE_COLORS[yIndex % DEFAULT_CURVE_COLORS.length],
    lineWidth: 1.8,
    lineStyle: "solid",
    lineShape: "linear",
    xErrorCol: "",
    yErrorCol: "",
  }));
}

function getPresetRequiredColumns(preset) {
  return [
    preset.xCol,
    ...getPresetCurves(preset).flatMap((curve) => [curve.yCol, curve.xErrorCol, curve.yErrorCol]),
  ].filter(Boolean);
}

function applySamplePreset(options = {}) {
  const preset = state.samplePreset;
  if (!preset) {
    return false;
  }

  const presetCurves = getPresetCurves(preset);
  const missingColumns = getPresetRequiredColumns(preset).filter((column) => !columnOptionExists(column));
  if (missingColumns.length) {
    if (!options.silent) {
      showMessage("error", `推荐列不可用，请检查数据范围：${missingColumns.join("、")}`);
    }
    return false;
  }

  setSelectIfExists("#xCol", preset.xCol);
  setSelectIfExists("#chartType", preset.chartType);
  setSelectIfExists("#fitType", preset.fitType);
  setSelectIfExists("#xAxisScale", preset.xAxisScale);
  setSelectIfExists("#yAxisScale", preset.yAxisScale);
  setControlValue("#plotTitle", preset.title || "");
  setControlValue("#xLabel", preset.xLabel || "");
  setControlValue("#yLabel", preset.yLabel || "");
  resetPlotAnnotationControls();
  setControlIfDefined("#xAxisMin", preset.xAxisMin);
  setControlIfDefined("#xAxisMax", preset.xAxisMax);
  setControlIfDefined("#yAxisMin", preset.yAxisMin);
  setControlIfDefined("#yAxisMax", preset.yAxisMax);
  setControlIfDefined("#xReferenceValue", preset.xReferenceValue);
  setControlIfDefined("#yReferenceValue", preset.yReferenceValue);
  setControlIfDefined("#referenceLabel", preset.referenceLabel);
  setSelectIfExists("#legendMode", preset.legendMode);
  setSelectIfExists("#dataLabelMode", preset.dataLabelMode);
  if (typeof preset.showGrid === "boolean") {
    setControlChecked("#showGrid", preset.showGrid);
  }

  renderCurveRows(presetCurves);
  updatePlotReadiness();
  if (!options.silent) {
    clearMessage();
  }
  if (options.activate !== false) {
    setActiveStep("plot", { scroll: true });
  }
  return true;
}

function renderStaticOptions() {
  setOptions(qs("#calcTemplate"), objectEntriesToOptions(CALC_TEMPLATES));
  setOptions(qs("#chartType"), objectEntriesToOptions(CHART_TYPES), "line_marker");
  setOptions(qs("#fitType"), objectEntriesToOptions(FIT_TYPES), "none");
  setOptions(qs("#metricMode"), objectEntriesToOptions(METRIC_MODES), "basic");
  setOptions(qs("#xAxisScale"), objectEntriesToOptions(AXIS_SCALE_TYPES), "linear");
  setOptions(qs("#yAxisScale"), objectEntriesToOptions(AXIS_SCALE_TYPES), "linear");
  setOptions(qs("#legendMode"), objectEntriesToOptions(LEGEND_MODES), "auto");
  setOptions(qs("#dataLabelMode"), objectEntriesToOptions(DATA_LABEL_MODES), "none");

  const metricBox = qs("#metricBox");
  metricBox.replaceChildren();
  Object.entries(AVAILABLE_METRICS).forEach(([value, label]) => {
    const input = createElement("cds-checkbox", {
      attributes: {
        checked: BASIC_METRICS.includes(value),
        "label-text": label,
        name: "selectedMetrics",
        value,
      },
    });
    metricBox.appendChild(input);
  });
}

function createSelectField(labelText, name, options, selectedValue, settings = {}) {
  const id = `${name}-${randomId()}`;
  const select = createElement("cds-select", {
    attributes: { id, name, required: settings.required !== false },
  });
  setOptions(select, options, selectedValue);
  return createLabeledControl(labelText, select);
}

function createInputField(labelText, name, value) {
  const id = `${name}-${randomId()}`;
  const input = createElement("cds-number-input", {
    attributes: {
      id,
      label: labelText,
      min: "0.1",
      name,
      required: true,
      step: "0.1",
      value,
    },
  });
  return input;
}

function createCurveRow(config, index) {
  const row = createElement("div", { className: "curve-row" });

  const yOptions = state.numericColumns.map((column) => ({ value: column, label: column }));
  const optionalColumnOptions = getOptionalNumericColumnOptions();
  const colorOptions = objectEntriesToOptions(CURVE_COLORS);
  const styleOptions = objectEntriesToOptions(LINE_STYLES);
  const shapeOptions = objectEntriesToOptions(LINE_SHAPES);

  const button = createButton("移除", "curve-remove-button");
  button.disabled = index === 0 && qs("#curveConfigBox").children.length === 0;
  row.append(
    createElement("div", {
      className: "curve-fields",
      children: [
        createSelectField("Y 列", "curveYCols", yOptions, config.yCol),
        createSelectField("颜色", "curveColors", colorOptions, config.color),
        createInputField("线宽", "curveWidths", config.lineWidth),
        createSelectField("线型", "curveStyles", styleOptions, config.lineStyle),
        createSelectField("连接", "curveLineShapes", shapeOptions, config.lineShape || "linear"),
        createSelectField("Y 误差", "curveYErrorCols", optionalColumnOptions, config.yErrorCol || "", { required: false }),
        createSelectField("X 误差", "curveXErrorCols", optionalColumnOptions, config.xErrorCol || "", { required: false }),
      ],
    }),
    createElement("div", {
      className: "curve-actions",
      children: [button],
    }),
  );

  return row;
}

function getOptionalNumericColumnOptions() {
  return [
    { value: "", label: "不使用" },
    ...state.numericColumns.map((column) => ({ value: column, label: column })),
  ];
}

function getDefaultCurveConfigs() {
  const firstY = state.numericColumns[1] || state.numericColumns[0] || "";
  return [{
    yCol: firstY,
    color: DEFAULT_CURVE_COLORS[0],
    lineWidth: 1.8,
    lineStyle: "solid",
    lineShape: "linear",
    xErrorCol: "",
    yErrorCol: "",
  }];
}

function renderCurveRows(configs = getDefaultCurveConfigs()) {
  const box = qs("#curveConfigBox");
  box.replaceChildren();
  configs.forEach((config, index) => box.appendChild(createCurveRow(config, index)));
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = qsa("#curveConfigBox .curve-row");
  rows.forEach((row) => {
    const button = row.querySelector(".curve-remove-button");
    if (button) {
      button.disabled = rows.length <= 1;
    }
  });
}

function getCurveConfigsFromForm() {
  const rows = qsa("#curveConfigBox .curve-row");
  const configs = rows.map((row, index) => {
    const yCol = getControlValue(row.querySelector('[name="curveYCols"]'));
    const color = getControlValue(row.querySelector('[name="curveColors"]')) || DEFAULT_CURVE_COLORS[index % DEFAULT_CURVE_COLORS.length];
    const lineWidth = parsePositiveFloat(
      getControlValue(row.querySelector('[name="curveWidths"]')),
      1.8,
      "线条粗细",
      0.1,
    );
    const lineStyleValue = getControlValue(row.querySelector('[name="curveStyles"]')) || "solid";
    const lineShapeValue = getControlValue(row.querySelector('[name="curveLineShapes"]')) || "linear";
    const lineStyle = LINE_STYLES[lineStyleValue] ? lineStyleValue : "solid";
    const lineShape = LINE_SHAPES[lineShapeValue] ? lineShapeValue : "linear";
    const yErrorCol = getControlValue(row.querySelector('[name="curveYErrorCols"]'));
    const xErrorCol = getControlValue(row.querySelector('[name="curveXErrorCols"]'));

    return { yCol, color, lineWidth, lineStyle, lineShape, xErrorCol, yErrorCol };
  }).filter((config) => config.yCol);

  if (!configs.length) {
    throw new Error("请选择至少一条曲线。");
  }

  return configs;
}

function resetPlotAnnotationControls() {
  setControlValue("#xAxisMin", "");
  setControlValue("#xAxisMax", "");
  setControlValue("#yAxisMin", "");
  setControlValue("#yAxisMax", "");
  setControlValue("#xReferenceValue", "");
  setControlValue("#yReferenceValue", "");
  setControlValue("#referenceLabel", "");
  setControlValue("#legendMode", "auto");
  setControlValue("#dataLabelMode", "none");
}

function renderDataControls() {
  renderColumnsBox(qs("#numericColumnsBox"), "数值列：");
  renderColumnsBox(qs("#plotColumnsBox"), "数值列：");

  const numericOptions = state.numericColumns.map((column) => ({ value: column, label: column }));
  setOptions(qs("#firstCol"), numericOptions);
  setOptions(qs("#secondCol"), numericOptions, state.numericColumns[1] || state.numericColumns[0]);
  setOptions(qs("#xCol"), numericOptions, state.numericColumns[0]);
  renderCurveRows(getDefaultCurveConfigs());
  updatePlotReadiness();

  if (state.numericColumns.length >= 2) {
    show(qs("#calcSection"));
    show(qs("#plotSection"));
  } else {
    hide(qs("#calcSection"));
    hide(qs("#plotSection"));
    showMessage("error", `至少需要两列数值数据。当前数值列：${state.numericColumns.join("、") || "无"}`);
  }

  updateWorkflowNav();
}

function resetWorkflow() {
  revokeDownloadUrls();

  state.fileName = "";
  state.rawRows = [];
  state.columns = [];
  state.data = [];
  state.numericColumns = [];
  state.pendingUploadFile = null;
  state.lastPlotPayload = null;
  state.simplePlotPayload = null;
  state.isPlotGenerating = false;
  state.activeStep = "upload";
  state.samplePreset = null;

  ["#previewSection", "#calcSection", "#plotSection", "#resultSection"].forEach((selector) => {
    hide(qs(selector));
  });

  qs("#uploadForm").reset();
  qs("#rangeForm").reset();
  qs("#calcForm").reset();
  qs("#plotForm").reset();
  setControlValue("#pasteData", "");
  setControlValue("#headerRow", "1");
  setControlValue("#dataStartRow", "2");
  setControlValue("#dataEndRow", "");
  setText("#selectedFileHint", "尚未选择文件。");
  qs("#currentFileName").textContent = "";
  renderContextNotification(qs("#headerGuessBox"), "info", "", "识别结果");
  qs("#previewHeaderRow").replaceChildren(createElement("cds-table-header-cell", { textContent: "行" }));
  qs("#previewBody").replaceChildren();
  qs("#numericColumnsBox").replaceChildren();
  qs("#plotColumnsBox").replaceChildren();
  qs("#curveConfigBox").replaceChildren();
  qs("#summaryBody").replaceChildren();
  qs("#statsBody").replaceChildren();
  resetResultFigure();
  hide(qs("#simpleResult"));
  clearNotification(qs("#simpleMessage"));
  setText("#simpleXCol", "待识别");
  setText("#simpleYCol", "待识别");
  setText("#simplePointCount", "待生成");
  clearDownloadLink("#simpleDownloadPng");

  qsa(".download-panel [href]").forEach((link) => {
    link.removeAttribute("download");
    link.href = "#";
    link.setAttribute("href", "#");
  });

  renderStaticOptions();
  clearMessage();
  showMessage("success", "已清空。可重新上传或载入示例。");
  updateWorkflowNav();
  setActiveStep("upload", { scroll: true });
}

function reloadDataFromRange(showSuccess = false) {
  const headerRow = parsePositiveInt(getControlValue("#headerRow"), 1);
  const dataStartRow = parsePositiveInt(getControlValue("#dataStartRow"), headerRow + 1);
  const dataEndRow = parsePositiveInt(getControlValue("#dataEndRow"), null);

  const loaded = loadDataFromRawRows(headerRow, dataStartRow, dataEndRow);
  state.columns = loaded.columns;
  state.data = loaded.data;
  state.numericColumns = loaded.numericColumns;

  renderDataControls();
  if (showSuccess && state.samplePreset) {
    applySamplePreset({ activate: false, silent: true });
  }
  hide(qs("#resultSection"));
  if (showSuccess) {
    if (state.numericColumns.length >= 2) {
      clearMessage();
      setActiveStep("plot", { scroll: true });
    } else {
      showMessage("success", "已更新表头和数据范围。");
    }
  }

  updateWorkflowNav();
}

function setDataset(rows, fileName) {
  state.fileName = fileName;
  state.samplePreset = getSamplePreset(fileName);
  state.rawRows = rows.map((row) => Array.isArray(row) ? row.map(cellText) : []);

  if (!state.rawRows.length) {
    throw new Error("文件中没有可读取的数据。");
  }

  const guess = guessHeaderAndDataRows(state.rawRows);
  qs("#currentFileName").textContent = fileName;
  renderContextNotification(qs("#headerGuessBox"), "info", guess.message, "识别结果");
  setControlValue("#headerRow", String(guess.headerRow));
  setControlValue("#dataStartRow", String(guess.dataStartRow));
  setControlValue("#dataEndRow", "");

  renderPreview();
  show(qs("#previewSection"));
  reloadDataFromRange(false);
  if (state.samplePreset) {
    applySamplePreset({ activate: false, silent: true });
  }
  setActiveStep("range", { scroll: true });
}

function getNumericSeries(column, label) {
  if (!column) {
    throw new Error(`请选择${label}。`);
  }
  if (!state.columns.includes(column)) {
    throw new Error(`找不到${label}：${column}`);
  }

  const values = state.data.map((row) => toNumber(row[column]));
  if (!values.some(Number.isFinite)) {
    throw new Error(`${label}没有可用数值：${column}`);
  }
  return values;
}

function calculateColumn() {
  const newColName = cellText(getControlValue("#newColName"));
  const calcTemplate = getControlValue("#calcTemplate");
  const firstCol = getControlValue("#firstCol");
  const secondCol = getControlValue("#secondCol");
  const constantKText = getControlValue("#constantK");

  if (!newColName) {
    throw new Error("请输入新列名。");
  }
  if (state.columns.includes(newColName)) {
    throw new Error(`新列名已存在：${newColName}。`);
  }
  if (!CALC_TEMPLATES[calcTemplate]) {
    throw new Error("请选择正确的计算类型。");
  }

  const a = getNumericSeries(firstCol, "第一列 A");
  let b = null;
  let k = null;

  if (["multiply", "divide", "add", "subtract"].includes(calcTemplate)) {
    b = getNumericSeries(secondCol, "第二列 B");
  }

  if (["add_const", "subtract_const", "multiply_const", "divide_const"].includes(calcTemplate)) {
    k = Number(cellText(constantKText));
    if (!Number.isFinite(k)) {
      throw new Error(`常数 k 必须是数字：${cellText(constantKText)}`);
    }
    if (calcTemplate === "divide_const" && k === 0) {
      throw new Error("常数 k 不能为 0。");
    }
  }

  if (calcTemplate === "sqrt" && a.some((value) => Number.isFinite(value) && value < 0)) {
    throw new Error("sqrt(A) 要求 A 不能包含负数。");
  }
  if (["log10", "ln"].includes(calcTemplate) && a.some((value) => Number.isFinite(value) && value <= 0)) {
    throw new Error(`${calcTemplate === "log10" ? "log10(A)" : "ln(A)"} 要求 A 必须全部大于 0。`);
  }

  const result = a.map((value, index) => {
    if (!Number.isFinite(value)) {
      return Number.NaN;
    }

    if (calcTemplate === "multiply") return value * b[index];
    if (calcTemplate === "divide") return value / b[index];
    if (calcTemplate === "add") return value + b[index];
    if (calcTemplate === "subtract") return value - b[index];
    if (calcTemplate === "square") return value ** 2;
    if (calcTemplate === "add_const") return value + k;
    if (calcTemplate === "subtract_const") return value - k;
    if (calcTemplate === "multiply_const") return value * k;
    if (calcTemplate === "divide_const") return value / k;
    if (calcTemplate === "sqrt") return Math.sqrt(value);
    if (calcTemplate === "log10") return Math.log10(value);
    if (calcTemplate === "ln") return Math.log(value);
    if (calcTemplate === "abs") return Math.abs(value);
    return Number.NaN;
  });

  if (!result.some(Number.isFinite)) {
    throw new Error("计算结果没有可用数值。请检查列或常数。");
  }
  if (result.some((value) => value === Infinity || value === -Infinity)) {
    throw new Error("计算结果包含无穷大。请检查除以 0、log 输入或数值范围。");
  }

  state.columns.push(newColName);
  state.data.forEach((row, index) => {
    row[newColName] = Number.isFinite(result[index]) ? result[index] : "";
  });
  state.numericColumns = state.columns.filter((column) => state.data.some((row) => Number.isFinite(toNumber(row[column]))));
  syncRawRowsFromData();
  renderPreview();
  renderDataControls();

  setControlValue("#newColName", "");
  showMessage("success", `已生成新列：${newColName}`);
  setActiveStep("plot", { scroll: true });
}
