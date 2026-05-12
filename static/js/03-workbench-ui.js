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

function getSampleGuide(fileName) {
  return SAMPLE_GUIDES[fileName] || null;
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

function renderSampleGuide() {
  const box = qs("#sampleGuideBox");
  if (!box) {
    return;
  }

  const guide = state.sampleGuide;
  if (!guide) {
    hide(box);
    return;
  }

  qs("#sampleGuideKicker").textContent = "已载入示例，下一步";
  qs("#sampleGuideTitle").textContent = guide.title;
  qs("#sampleGuideGoal").textContent = guide.goal;

  const steps = qs("#sampleGuideSteps");
  steps.replaceChildren();
  steps.append(...guide.steps.map((step) => createElement("li", { textContent: step })));

  const actions = qs("#sampleGuideActions");
  actions.replaceChildren();

  (guide.calcActions || []).forEach((action, index) => {
    actions.appendChild(createButton(action.label, "carbon-tertiary", {
      sampleAction: "calc",
      sampleActionIndex: index,
    }));
  });

  (guide.plotActions || []).forEach((action, index) => {
    actions.appendChild(createButton(action.label, index === 0 ? "carbon-primary" : "carbon-tertiary", {
      sampleAction: "plot",
      sampleActionIndex: index,
    }));
  });

  show(box);
}

function applySampleCalcAction(index) {
  const guide = state.sampleGuide;
  const action = guide?.calcActions?.[index];
  if (!action) {
    return;
  }

  if (!columnOptionExists(action.firstCol)) {
    showMessage("error", `示例列不存在：${action.firstCol}`);
    return;
  }

  setSelectIfExists("#calcTemplate", action.template);
  setSelectIfExists("#firstCol", action.firstCol);
  if (action.secondCol) {
    if (!setSelectIfExists("#secondCol", action.secondCol)) {
      showMessage("error", `示例列不存在：${action.secondCol}`);
      return;
    }
  }
  setControlValue("#constantK", action.constantK || "");
  setControlValue("#newColName", action.newColName || "");

  clearMessage();
  setActiveStep("calc", { scroll: true });
}

function applySamplePlotAction(index = 0) {
  const action = state.sampleGuide?.plotActions?.[index];
  if (!action) {
    return;
  }

  const yCols = action.yCols || [action.yCol];
  if (!columnOptionExists(action.xCol) || yCols.some((column) => !columnOptionExists(column))) {
    showMessage("error", "推荐绘图列不存在，请重新确认数据范围。");
    return;
  }

  setSelectIfExists("#xCol", action.xCol);
  setSelectIfExists("#chartType", action.chartType);
  setSelectIfExists("#fitType", action.fitType);
  setControlValue("#plotTitle", action.title || "");
  setControlValue("#xLabel", action.xLabel || "");
  setControlValue("#yLabel", action.yLabel || "");
  if (typeof action.showGrid === "boolean") {
    setControlChecked("#showGrid", action.showGrid);
  }

  renderCurveRows(yCols.map((yCol, yIndex) => ({
    yCol,
    color: DEFAULT_CURVE_COLORS[yIndex % DEFAULT_CURVE_COLORS.length],
    lineWidth: 1.8,
    lineStyle: "solid",
  })));
  updatePlotReadiness();
  clearMessage();
  setActiveStep("plot", { scroll: true });
}

function renderStaticOptions() {
  setOptions(qs("#calcTemplate"), objectEntriesToOptions(CALC_TEMPLATES));
  setOptions(qs("#chartType"), objectEntriesToOptions(CHART_TYPES), "line_marker");
  setOptions(qs("#fitType"), objectEntriesToOptions(FIT_TYPES), "none");
  setOptions(qs("#metricMode"), objectEntriesToOptions(METRIC_MODES), "basic");

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

function createSelectField(labelText, name, options, selectedValue) {
  const id = `${name}-${randomId()}`;
  const select = createElement("cds-select", {
    attributes: { id, name, required: true },
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
  const colorOptions = objectEntriesToOptions(CURVE_COLORS);
  const styleOptions = objectEntriesToOptions(LINE_STYLES);

  row.append(
    createSelectField("Y 轴数据列", "curveYCols", yOptions, config.yCol),
    createSelectField("线条颜色", "curveColors", colorOptions, config.color),
    createInputField("线条粗细", "curveWidths", config.lineWidth),
    createSelectField("线型", "curveStyles", styleOptions, config.lineStyle),
  );

  const button = createButton("删除", "curve-remove-button");
  button.disabled = index === 0 && qs("#curveConfigBox").children.length === 0;
  row.appendChild(button);

  return row;
}

function getDefaultCurveConfigs() {
  const firstY = state.numericColumns[1] || state.numericColumns[0] || "";
  return [{
    yCol: firstY,
    color: DEFAULT_CURVE_COLORS[0],
    lineWidth: 1.8,
    lineStyle: "solid",
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
    const lineStyle = getControlValue(row.querySelector('[name="curveStyles"]')) || "solid";

    return { yCol, color, lineWidth, lineStyle };
  }).filter((config) => config.yCol);

  if (!configs.length) {
    throw new Error("请选择至少一条曲线。");
  }

  return configs;
}

function renderDataControls() {
  renderColumnsBox(qs("#numericColumnsBox"), "当前可用数值列：");
  renderColumnsBox(qs("#plotColumnsBox"), "当前识别到的数值列：");

  const numericOptions = state.numericColumns.map((column) => ({ value: column, label: column }));
  setOptions(qs("#firstCol"), numericOptions);
  setOptions(qs("#secondCol"), numericOptions, state.numericColumns[1] || state.numericColumns[0]);
  setOptions(qs("#xCol"), numericOptions, state.numericColumns[0]);
  renderCurveRows(getDefaultCurveConfigs());
  renderSampleGuide();
  updatePlotReadiness();

  if (state.numericColumns.length >= 2) {
    show(qs("#calcSection"));
    show(qs("#plotSection"));
  } else {
    hide(qs("#calcSection"));
    hide(qs("#plotSection"));
    showMessage("error", `至少需要两列数值数据才能绘图。当前可用数值列：${state.numericColumns.join("、") || "无"}`);
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
  state.sampleGuide = null;

  ["#previewSection", "#calcSection", "#plotSection", "#resultSection", "#sampleGuideBox"].forEach((selector) => {
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
  qs("#headerGuessMessage").textContent = "";
  qs("#previewHeaderRow").replaceChildren(createElement("cds-table-header-cell", { textContent: "行" }));
  qs("#previewBody").replaceChildren();
  qs("#numericColumnsBox").replaceChildren();
  qs("#plotColumnsBox").replaceChildren();
  qs("#curveConfigBox").replaceChildren();
  qs("#summaryRows").replaceChildren();
  qs("#statsGrid").replaceChildren();
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
  showMessage("success", "已清空当前数据。可以重新上传文件，或载入一份示例数据。");
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
  hide(qs("#resultSection"));
  if (showSuccess) {
    showMessage("success", "已按新的表头和数据范围重新读取。");
    if (state.numericColumns.length >= 2) {
      setActiveStep("plot", { scroll: true });
    }
  }

  updateWorkflowNav();
}

function setDataset(rows, fileName) {
  state.fileName = fileName;
  state.sampleGuide = getSampleGuide(fileName);
  state.rawRows = rows.map((row) => Array.isArray(row) ? row.map(cellText) : []);

  if (!state.rawRows.length) {
    throw new Error("文件中没有可读取的数据。");
  }

  const guess = guessHeaderAndDataRows(state.rawRows);
  qs("#currentFileName").textContent = fileName;
  qs("#headerGuessMessage").textContent = guess.message;
  setControlValue("#headerRow", String(guess.headerRow));
  setControlValue("#dataStartRow", String(guess.dataStartRow));
  setControlValue("#dataEndRow", "");

  renderPreview();
  show(qs("#previewSection"));
  reloadDataFromRange(false);
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
    throw new Error(`新列名已经存在：${newColName}。请换一个名字。`);
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
      throw new Error("常数 k 不能为 0，否则会出现除以 0。");
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
    throw new Error("计算结果没有可用数值，请检查所选列或常数。");
  }
  if (result.some((value) => value === Infinity || value === -Infinity)) {
    throw new Error("计算结果出现无穷大，可能存在除以 0、log 非法输入或数值过大。");
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
