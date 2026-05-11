"use strict";

const CHART_TYPES = {
  line: "折线图",
  scatter: "散点图",
  line_marker: "散点 + 连线",
};

const CALC_TEMPLATES = {
  multiply: "两列相乘 A × B",
  divide: "两列相除 A ÷ B",
  add: "两列相加 A + B",
  subtract: "两列相减 A - B",
  square: "某列平方 A²",
  add_const: "某列加常数 A + k",
  subtract_const: "某列减常数 A - k",
  multiply_const: "某列乘常数 A × k",
  divide_const: "某列除常数 A ÷ k",
  sqrt: "平方根 sqrt(A)",
  log10: "常用对数 log10(A)",
  ln: "自然对数 ln(A)",
  abs: "绝对值 abs(A)",
};

const FIT_TYPES = {
  none: "不拟合",
  linear: "一次线性拟合 y = ax + b",
  quadratic: "二次拟合 y = ax² + bx + c",
};

const LINE_STYLES = {
  solid: "实线",
  dashed: "虚线",
  dotted: "点线",
  dashdot: "点划线",
};

const LINE_DASHES = {
  solid: [],
  dashed: [8, 5],
  dotted: [2, 4],
  dashdot: [8, 4, 2, 4],
};

const CURVE_COLORS = {
  "#0072B2": "论文蓝",
  "#D55E00": "朱红",
  "#009E73": "蓝绿",
  "#CC79A7": "紫红",
  "#E69F00": "琥珀",
  "#56B4E9": "天蓝",
  "#4B5563": "石墨灰",
};

const DEFAULT_CURVE_COLORS = Object.keys(CURVE_COLORS);

const METRIC_MODES = {
  basic: "基础指标（推荐）",
  custom: "自定义选择",
};

const AVAILABLE_METRICS = {
  r2: "R²",
  rmse: "RMSE",
  mae: "MAE",
  max_abs_error: "最大绝对误差",
  mse: "MSE",
  residual_mean: "残差均值",
  residual_std: "残差标准差",
};

const BASIC_METRICS = ["r2", "rmse", "mae", "max_abs_error"];
const MULTI_Y_FIT_NOTICE = "多曲线模式下暂不进行拟合，如需拟合请只保留一条曲线。";
const SAMPLE_FILES = new Set([
  "sample_01_temp_c_to_k.xlsx",
  "sample_02_voltage_scale.xlsx",
  "sample_03_abs_error.xlsx",
  "sample_04_invalid_log.xlsx",
]);

const SAMPLE_GUIDES = {
  "sample_01_temp_c_to_k.xlsx": {
    title: "荧光发射光谱对比",
    goal: "练习多曲线光谱绘图。三条发射曲线带有不同峰位和峰强，更接近论文里的 spectroscopy panel。",
    steps: [
      "确认 wavelength_nm 和三组强度列已识别。",
      "使用推荐绘图填入三条 emission curve。",
      "保留白底、黑色坐标框和清晰图例，检查峰形是否可读。",
      "导出 PNG 和 ZIP，用作报告中的光谱对比图。",
    ],
    plotActions: [{
      label: "直接填入光谱叠图",
      xCol: "wavelength_nm",
      yCols: ["sample_low_a_u", "sample_high_a_u", "reference_a_u"],
      chartType: "line_marker",
      fitType: "none",
      showGrid: false,
      title: "Fluorescence emission spectra",
      xLabel: "Wavelength (nm)",
      yLabel: "Intensity (a.u.)",
    }],
  },
  "sample_02_voltage_scale.xlsx": {
    title: "反应动力学多曲线",
    goal: "练习多组时间序列绘图。曲线包含不同衰减速率和恢复峰，适合测试图例、曲线配色和导出观感。",
    steps: [
      "确认 time_min 是 X 轴，四组 response 都是数值列。",
      "使用推荐绘图生成多曲线动力学图。",
      "对比 control、low dose、high dose 和 pulse recovery 的趋势。",
      "导出图像，检查图例和曲线间距是否清楚。",
    ],
    plotActions: [{
      label: "直接填入动力学图",
      xCol: "time_min",
      yCols: ["control_pct", "low_dose_pct", "high_dose_pct", "pulse_recovery_pct"],
      chartType: "line_marker",
      fitType: "none",
      showGrid: false,
      title: "Reaction kinetics under different conditions",
      xLabel: "Time (min)",
      yLabel: "Normalized response (%)",
    }],
  },
  "sample_03_abs_error.xlsx": {
    title: "标准曲线与残差",
    goal: "练习一次线性拟合和残差检查。这个示例更像实验报告或论文补充材料里的 calibration curve。",
    steps: [
      "确认 concentration_um 和 absorbance_mean 已识别。",
      "使用标准曲线按钮，选择一次线性拟合。",
      "生成图像后重点查看拟合方程、R²、RMSE 和 MAE。",
      "也可以切换到残差图，检查点是否系统性偏离。",
    ],
    plotActions: [
      {
        label: "直接填入标准曲线",
        xCol: "concentration_um",
        yCols: ["absorbance_mean"],
        chartType: "scatter",
        fitType: "linear",
        showGrid: false,
        title: "Analytical calibration curve",
        xLabel: "Concentration (uM)",
        yLabel: "Absorbance (a.u.)",
      },
      {
        label: "直接填入残差图",
        xCol: "concentration_um",
        yCols: ["residual_a_u"],
        chartType: "line_marker",
        fitType: "none",
        showGrid: false,
        title: "Calibration residuals",
        xLabel: "Concentration (uM)",
        yLabel: "Residual (a.u.)",
      },
    ],
  },
  "sample_04_invalid_log.xlsx": {
    title: "拉曼谱峰对比",
    goal: "练习多峰谱图和多样品叠图。D/G 峰变化明显，适合验证期刊风格线条、图例和导出清晰度。",
    steps: [
      "确认 raman_shift_cm 和三组 intensity 列已识别。",
      "使用推荐绘图填入 pristine、annealed 和 doped 三条谱线。",
      "观察 D 峰和 G 峰的相对强度变化。",
      "导出白底 PNG，检查谱峰和图例是否适合报告使用。",
    ],
    plotActions: [{
      label: "直接填入拉曼谱图",
      xCol: "raman_shift_cm",
      yCols: ["pristine_a_u", "annealed_a_u", "doped_a_u"],
      chartType: "line_marker",
      fitType: "none",
      showGrid: false,
      title: "Raman spectra comparison",
      xLabel: "Raman shift (cm^-1)",
      yLabel: "Intensity (a.u.)",
    }],
  },
};

const HEADER_KEYWORDS = [
  "时间", "温度", "电压", "电流", "功率", "电阻", "浓度", "吸光度",
  "位移", "速度", "压力", "转速", "频率",
  "time", "temp", "temperature", "voltage", "current", "power",
  "resistance", "concentration", "absorbance", "displacement",
  "speed", "pressure", "rpm", "frequency",
];

const state = {
  fileName: "",
  rawRows: [],
  columns: [],
  data: [],
  numericColumns: [],
  chart: null,
  lastPlotPayload: null,
  isPlotGenerating: false,
  activeStep: "upload",
  objectUrls: [],
  sampleGuide: null,
};

const WORKFLOW_STEPS = ["upload", "range", "calc", "plot", "result"];

const WORKFLOW_PANELS = {
  upload: "step-upload",
  range: "previewSection",
  calc: "calcSection",
  plot: "plotSection",
  result: "resultSection",
};

const WORKFLOW_STATUS = {
  upload: "等待导入数据",
  range: "检查表头和数据范围",
  calc: "可以生成计算列，也可以跳过",
  plot: "选择坐标轴、曲线和拟合方式",
  result: "结果已生成，可检查并下载",
};

const WORKFLOW_ACTION_LABELS = {
  upload: "开始导入",
  range: "继续识别范围",
  calc: "继续数据加工",
  plot: "继续配置图像",
  result: "查看下载结果",
};

const EMPTY_RESULT_STATE = {
  title: "等待生成图像",
  meta: "待生成",
  curves: "待生成",
};

const PLOT_PENDING_VALUES = {
  points: "待选择",
  fit: "待选择",
  exportSize: "待生成",
};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function show(element) {
  element.classList.remove("is-hidden");
}

function hide(element) {
  element.classList.add("is-hidden");
}

function setText(selector, text) {
  const element = qs(selector);
  if (element) {
    element.textContent = text;
  }
}

function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  const {
    attributes = {},
    children = [],
    className = "",
    dataset = {},
    textContent,
  } = options;

  if (className) {
    element.className = className;
  }

  if (textContent !== undefined) {
    element.textContent = textContent;
  }

  Object.entries(attributes).forEach(([name, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }

    if (name in element) {
      element[name] = value;
    } else {
      element.setAttribute(name, value === true ? "" : String(value));
    }
  });

  Object.entries(dataset).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      element.dataset[name] = String(value);
    }
  });

  element.append(...children);
  return element;
}

function createButton(label, className, dataset = {}, attributes = {}) {
  return createElement("button", {
    attributes: { type: "button", ...attributes },
    className,
    dataset,
    textContent: label,
  });
}

function createLabeledControl(labelText, control) {
  return createElement("div", {
    children: [
      createElement("label", {
        attributes: { htmlFor: control.id },
        textContent: labelText,
      }),
      control,
    ],
  });
}

function createValueItem(label, value, className = "") {
  return createElement("div", {
    className,
    children: [
      createElement("span", { textContent: label }),
      createElement("strong", { textContent: value }),
    ],
  });
}

function getWorkflowPanel(step) {
  const id = WORKFLOW_PANELS[step];
  return id ? qs(`#${id}`) : null;
}

function isWorkflowStepAvailable(step) {
  if (step === "upload") {
    return true;
  }

  const panel = getWorkflowPanel(step);
  return Boolean(panel && !panel.classList.contains("is-hidden"));
}

function getLastAvailableWorkflowStep() {
  for (let index = WORKFLOW_STEPS.length - 1; index >= 0; index -= 1) {
    const step = WORKFLOW_STEPS[index];
    if (isWorkflowStepAvailable(step)) {
      return step;
    }
  }

  return "upload";
}

function updateWorkflowNav() {
  if (!getWorkflowPanel("upload")) {
    return;
  }

  if (!isWorkflowStepAvailable(state.activeStep)) {
    state.activeStep = getLastAvailableWorkflowStep();
  }

  WORKFLOW_STEPS.forEach((step) => {
    const panel = getWorkflowPanel(step);
    if (panel) {
      panel.classList.toggle("is-active", step === state.activeStep && isWorkflowStepAvailable(step));
    }
  });

  const activeIndex = WORKFLOW_STEPS.indexOf(state.activeStep);
  qsa(".step-nav-item[data-step-target]").forEach((button) => {
    const step = button.dataset.stepTarget;
    const stepIndex = WORKFLOW_STEPS.indexOf(step);
    const available = isWorkflowStepAvailable(step);

    button.disabled = !available;
    button.classList.toggle("is-active", step === state.activeStep);
    button.classList.toggle("is-complete", available && stepIndex >= 0 && stepIndex < activeIndex);

    if (step === state.activeStep) {
      button.setAttribute("aria-current", "step");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  const status = qs("#workflowStatusText");
  if (status) {
    status.textContent = WORKFLOW_STATUS[state.activeStep] || WORKFLOW_STATUS.upload;
  }

  updateWorkflowActions();
}

function updateWorkflowActions() {
  const resumeButton = qs("#resumeWorkflowButton");
  const resetButton = qs("#resetWorkflowButton");

  if (resumeButton) {
    resumeButton.textContent = WORKFLOW_ACTION_LABELS[state.activeStep] || WORKFLOW_ACTION_LABELS.upload;
  }

  if (resetButton) {
    resetButton.disabled = !state.rawRows.length && !state.lastPlotPayload;
  }
}

function resetResultFigure() {
  setText("#resultFigureTitle", EMPTY_RESULT_STATE.title);
  setText("#resultFigureMeta", EMPTY_RESULT_STATE.meta);
  setText("#resultFigureCurves", EMPTY_RESULT_STATE.curves);
}

function setActiveStep(step, options = {}) {
  if (!WORKFLOW_PANELS[step] || !isWorkflowStepAvailable(step)) {
    return;
  }

  state.activeStep = step;
  updateWorkflowNav();

  if (options.scroll) {
    const panel = getWorkflowPanel(step);
    (panel || qs("#upload-section")).scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function showMessage(type, text) {
  const box = qs("#statusMessage");
  box.textContent = text;
  box.className = `message ${type}`;
  show(box);
}

function clearMessage() {
  const box = qs("#statusMessage");
  box.textContent = "";
  box.className = "message is-hidden";
}

function cellText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function isNumericLike(value) {
  const text = cellText(value);
  if (!text) {
    return false;
  }
  return Number.isFinite(toNumber(text));
}

function toNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  let text = cellText(value);
  if (!text) {
    return Number.NaN;
  }

  text = text
    .replace(/\u2212/g, "-")
    .replace(/，/g, ",")
    .replace(/,/g, "");

  const number = Number(text);
  return Number.isFinite(number) ? number : Number.NaN;
}

function formatNumber(value, digits = 6) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return value.toFixed(digits);
}

function formatShortNumber(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return value.toFixed(2);
}

function parsePositiveInt(value, fallback = null) {
  const text = cellText(value);
  if (!text) {
    return fallback;
  }

  const number = Number(text);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`请输入有效的正整数：${text}`);
  }

  return number;
}

function parsePositiveFloat(value, fallback, label, minValue, maxValue = null) {
  const text = cellText(value);
  if (!text) {
    return fallback;
  }

  const number = Number(text);
  if (!Number.isFinite(number)) {
    throw new Error(`${label}必须是数字：${text}`);
  }
  if (number < minValue) {
    throw new Error(`${label}不能小于 ${minValue}。`);
  }
  if (maxValue !== null && number > maxValue) {
    throw new Error(`${label}不能大于 ${maxValue}。`);
  }

  return number;
}

function safeFilenamePart(text) {
  const cleaned = cellText(text)
    .replace(/[^\w\u4e00-\u9fff]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "column";
}

function randomId() {
  const values = new Uint32Array(2);
  window.crypto.getRandomValues(values);
  return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join("").slice(0, 8);
}

function setOptions(select, entries, selectedValue = null) {
  select.replaceChildren();

  entries.forEach((entry) => {
    select.appendChild(createElement("option", {
      attributes: {
        selected: entry.value === selectedValue,
        value: entry.value,
      },
      textContent: entry.label,
    }));
  });
}

function objectEntriesToOptions(object) {
  return Object.entries(object).map(([value, label]) => ({ value, label }));
}

function decodeText(buffer) {
  const encodings = ["utf-8", "gb18030", "gbk"];

  for (const encoding of encodings) {
    try {
      return new TextDecoder(encoding, { fatal: true }).decode(buffer);
    } catch (error) {
      // Try the next encoding.
    }
  }

  return new TextDecoder("utf-8").decode(buffer);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let index = 0;

  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  while (index < text.length) {
    const char = text[index];

    if (inQuotes) {
      if (char === "\"") {
        if (text[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      if (text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }

    index += 1;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

async function parseFile(file) {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop().toLowerCase();
  return parseBuffer(buffer, extension);
}

function parseBuffer(buffer, extension) {
  if (extension === "csv") {
    return parseCsv(decodeText(buffer));
  }

  if (extension === "xlsx" || extension === "xls") {
    if (!window.XLSX) {
      throw new Error("Excel 解析库未加载，请检查网络后刷新页面。");
    }

    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Excel 文件中没有可读取的工作表。");
    }

    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
  }

  throw new Error("目前只支持 CSV、XLS、XLSX 文件。");
}

function analyzeRawRow(row) {
  const values = row.map(cellText);
  const nonEmptyValues = values.filter(Boolean);
  const nonEmptyCount = nonEmptyValues.length;
  const numericCount = nonEmptyValues.filter(isNumericLike).length;
  const textCount = nonEmptyCount - numericCount;
  const rowText = nonEmptyValues.join(" ").toLowerCase();
  const keywordCount = HEADER_KEYWORDS.filter((keyword) => rowText.includes(keyword.toLowerCase())).length;

  return {
    nonEmptyCount,
    numericCount,
    textCount,
    keywordCount,
    numericRatio: nonEmptyCount ? numericCount / nonEmptyCount : 0,
  };
}

function guessHeaderAndDataRows(rows) {
  const fallback = {
    success: false,
    headerRow: 1,
    dataStartRow: 2,
    message: "暂未可靠识别表头和数据起始行，请根据预览手动填写。",
  };

  const analyses = rows.slice(0, 100).map(analyzeRawRow);
  let best = null;

  analyses.forEach((headerInfo, headerIndex) => {
    const headerNonEmpty = headerInfo.nonEmptyCount;
    if (
      headerNonEmpty < 2 ||
      headerInfo.textCount < 1 ||
      headerInfo.numericRatio >= 0.7
    ) {
      return;
    }

    const maxDataIndex = Math.min(headerIndex + 31, analyses.length);
    for (let dataIndex = headerIndex + 1; dataIndex < maxDataIndex; dataIndex += 1) {
      const dataInfo = analyses[dataIndex];
      const dataNonEmpty = dataInfo.nonEmptyCount;
      if (
        dataNonEmpty < 2 ||
        dataInfo.numericCount < 2 ||
        dataInfo.numericRatio < 0.5
      ) {
        continue;
      }

      const distance = dataIndex - headerIndex;
      const columnGap = Math.abs(headerNonEmpty - dataNonEmpty);
      let score = 0;
      score += headerInfo.keywordCount * 5;
      score += headerInfo.textCount * 1.5;
      score += dataInfo.numericRatio * 8;
      score += Math.max(0, 4 - columnGap);
      score -= distance * 0.08;

      if (!best || score > best.score) {
        best = {
          score,
          headerRow: headerIndex + 1,
          dataStartRow: dataIndex + 1,
        };
      }
      break;
    }
  });

  if (!best || best.score < 7) {
    return fallback;
  }

  return {
    success: true,
    headerRow: best.headerRow,
    dataStartRow: best.dataStartRow,
    message: "系统已自动猜测表头行和数据起始行，如不准确可手动修改。",
  };
}

function makeUniqueColumns(row) {
  const seen = new Map();

  return row.map((value, index) => {
    let name = cellText(value);
    if (!name || name.toLowerCase().startsWith("unnamed")) {
      name = `Column_${index + 1}`;
    }

    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}_${count + 1}`;
  });
}

function loadDataFromRawRows(headerRow, dataStartRow, dataEndRow) {
  if (!state.rawRows.length) {
    throw new Error("请先上传 CSV / Excel 文件。");
  }

  if (dataStartRow <= headerRow) {
    throw new Error("数据起始行必须在表头行之后。");
  }

  if (dataEndRow !== null && dataEndRow < dataStartRow) {
    throw new Error("数据结束行不能早于数据起始行。");
  }

  const headerIndex = headerRow - 1;
  const header = state.rawRows[headerIndex];
  if (!header) {
    throw new Error("找不到表头行，请检查行号。");
  }

  let columns = makeUniqueColumns(header);
  const startIndex = dataStartRow - 1;
  const endIndex = dataEndRow === null ? state.rawRows.length : dataEndRow;
  const sourceRows = state.rawRows.slice(startIndex, endIndex);

  let data = sourceRows.map((row) => {
    const item = {};
    columns.forEach((column, index) => {
      item[column] = cellText(row[index]);
    });
    return item;
  });

  data = data.filter((row) => columns.some((column) => cellText(row[column]) !== ""));
  if (!data.length) {
    throw new Error("数据范围内没有可读取的数据。");
  }

  columns = columns.filter((column) => data.some((row) => cellText(row[column]) !== ""));
  data = data.map((row) => {
    const item = {};
    columns.forEach((column) => {
      item[column] = row[column];
    });
    return item;
  });

  const numericColumns = columns.filter((column) => data.some((row) => Number.isFinite(toNumber(row[column]))));

  return { columns, data, numericColumns };
}

function syncRawRowsFromData() {
  state.rawRows = [
    state.columns.slice(),
    ...state.data.map((row) => state.columns.map((column) => row[column] ?? "")),
  ];
  qs("#headerRow").value = "1";
  qs("#dataStartRow").value = "2";
  qs("#dataEndRow").value = "";
}

function renderPreview() {
  const body = qs("#previewBody");
  body.replaceChildren();

  const previewRows = state.rawRows.slice(0, 15);
  previewRows.forEach((row, index) => {
    body.appendChild(createElement("tr", {
      children: [
        createElement("th", { textContent: `第 ${index + 1} 行` }),
        ...row.map((value) => createElement("td", { textContent: cellText(value) })),
      ],
    }));
  });
}

function renderColumnsBox(target, label) {
  target.replaceChildren();
  target.append(
    createElement("span", { textContent: label }),
    ...state.numericColumns.map((column) => createElement("code", { textContent: column })),
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

  const exists = Array.from(select.options).some((option) => option.value === value);
  if (!exists) {
    return false;
  }

  select.value = value;
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
    actions.appendChild(createButton(action.label, "btn btn-secondary", {
      sampleAction: "calc",
      sampleActionIndex: index,
    }));
  });

  (guide.plotActions || []).forEach((action, index) => {
    actions.appendChild(createButton(action.label, index === 0 ? "btn btn-primary" : "btn btn-secondary", {
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
  qs("#constantK").value = action.constantK || "";
  qs("#newColName").value = action.newColName || "";

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
  qs("#plotTitle").value = action.title || "";
  qs("#xLabel").value = action.xLabel || "";
  qs("#yLabel").value = action.yLabel || "";
  if (typeof action.showGrid === "boolean") {
    qs("#showGrid").checked = action.showGrid;
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
    const input = createElement("input", {
      attributes: {
        checked: BASIC_METRICS.includes(value),
        name: "selectedMetrics",
        type: "checkbox",
        value,
      },
    });
    const wrapper = createElement("label", {
      className: "checkbox-row",
      children: [input, label],
    });
    metricBox.appendChild(wrapper);
  });
}

function createSelectField(labelText, name, options, selectedValue) {
  const id = `${name}-${randomId()}`;
  const select = createElement("select", {
    attributes: { id, name, required: true },
  });
  setOptions(select, options, selectedValue);
  return createLabeledControl(labelText, select);
}

function createInputField(labelText, name, value) {
  const id = `${name}-${randomId()}`;
  const input = createElement("input", {
    attributes: {
      id,
      min: "0.1",
      name,
      required: true,
      step: "0.1",
      type: "number",
      value,
    },
  });
  return createLabeledControl(labelText, input);
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
    const yCol = row.querySelector('select[name="curveYCols"]').value;
    const color = row.querySelector('select[name="curveColors"]').value || DEFAULT_CURVE_COLORS[index % DEFAULT_CURVE_COLORS.length];
    const lineWidth = parsePositiveFloat(
      row.querySelector('input[name="curveWidths"]').value,
      1.8,
      "线条粗细",
      0.1,
    );
    const lineStyle = row.querySelector('select[name="curveStyles"]').value || "solid";

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

  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }

  state.fileName = "";
  state.rawRows = [];
  state.columns = [];
  state.data = [];
  state.numericColumns = [];
  state.lastPlotPayload = null;
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
  qs("#currentFileName").textContent = "";
  qs("#headerGuessMessage").textContent = "";
  qs("#previewBody").replaceChildren();
  qs("#numericColumnsBox").replaceChildren();
  qs("#plotColumnsBox").replaceChildren();
  qs("#curveConfigBox").replaceChildren();
  qs("#summaryRows").replaceChildren();
  qs("#statsGrid").replaceChildren();
  resetResultFigure();

  qsa(".download-panel a").forEach((link) => {
    link.removeAttribute("download");
    link.href = "#";
  });

  renderStaticOptions();
  clearMessage();
  showMessage("success", "已清空当前数据。可以重新上传文件，或载入一份示例数据。");
  updateWorkflowNav();
  setActiveStep("upload", { scroll: true });
}

function reloadDataFromRange(showSuccess = false) {
  const headerRow = parsePositiveInt(qs("#headerRow").value, 1);
  const dataStartRow = parsePositiveInt(qs("#dataStartRow").value, headerRow + 1);
  const dataEndRow = parsePositiveInt(qs("#dataEndRow").value, null);

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
  qs("#headerRow").value = String(guess.headerRow);
  qs("#dataStartRow").value = String(guess.dataStartRow);
  qs("#dataEndRow").value = "";

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
  const newColName = cellText(qs("#newColName").value);
  const calcTemplate = qs("#calcTemplate").value;
  const firstCol = qs("#firstCol").value;
  const secondCol = qs("#secondCol").value;
  const constantKText = qs("#constantK").value;

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

  qs("#newColName").value = "";
  showMessage("success", `已生成新列：${newColName}`);
  setActiveStep("plot", { scroll: true });
}

function normalizeSelectedMetrics() {
  const mode = qs("#metricMode").value;
  if (mode === "basic") {
    return BASIC_METRICS.slice();
  }

  const selected = qsa('input[name="selectedMetrics"]:checked').map((input) => input.value);
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
      const ySelect = row.querySelector('select[name="curveYCols"]');
      return ySelect ? ySelect.value : "";
    })
    .filter(Boolean);
}

function readOutputSize() {
  const figWidth = parsePositiveFloat(qs("#figWidth").value, 7, "图片宽度", 3, 20);
  const figHeight = parsePositiveFloat(qs("#figHeight").value, 4.6, "图片高度", 2, 16);
  const figDpi = Math.round(parsePositiveFloat(qs("#figDpi").value, 300, "图片 DPI", 72, 600));
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

  const xCol = qs("#xCol").value;
  const yCols = getSelectedCurveSummary();
  const fitType = qs("#fitType").value;

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
  fitSelect.disabled = isMultiCurve;
  if (isMultiCurve) {
    fitSelect.value = "none";
  }
}

function syncMetricBoxVisibility() {
  const metricBox = qs(".metric-box");
  const metricMode = qs("#metricMode");
  if (!metricBox || !metricMode) {
    return;
  }

  const isCustom = metricMode.value === "custom";
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

function calcRSquared(yTrue, yPred) {
  const mean = yTrue.reduce((sum, value) => sum + value, 0) / yTrue.length;
  const ssRes = yTrue.reduce((sum, value, index) => sum + ((value - yPred[index]) ** 2), 0);
  const ssTot = yTrue.reduce((sum, value) => sum + ((value - mean) ** 2), 0);

  if (ssTot === 0) {
    return ssRes === 0 ? 1 : 0;
  }

  return 1 - (ssRes / ssTot);
}

function calcAllFitMetrics(yTrue, yPred) {
  const residual = yTrue.map((value, index) => value - yPred[index]);
  const absResidual = residual.map(Math.abs);
  const mse = residual.reduce((sum, value) => sum + (value ** 2), 0) / residual.length;
  const rmse = Math.sqrt(mse);
  const mae = absResidual.reduce((sum, value) => sum + value, 0) / absResidual.length;
  const maxAbsError = Math.max(...absResidual);
  const residualMean = residual.reduce((sum, value) => sum + value, 0) / residual.length;
  const residualStd = residual.length >= 2
    ? Math.sqrt(residual.reduce((sum, value) => sum + ((value - residualMean) ** 2), 0) / (residual.length - 1))
    : 0;

  return {
    r2: calcRSquared(yTrue, yPred),
    mse,
    rmse,
    mae,
    max_abs_error: maxAbsError,
    residual_mean: residualMean,
    residual_std: residualStd,
  };
}

function describeFitQuality(metrics) {
  if (!metrics || !Number.isFinite(metrics.r2)) {
    return "";
  }
  if (metrics.r2 >= 0.99) {
    return "拟合度很高，请仍结合实验原理判断。";
  }
  if (metrics.r2 >= 0.95) {
    return "拟合度较高，建议同时查看残差和实验原理。";
  }
  if (metrics.r2 >= 0.85) {
    return "拟合度一般，建议检查模型选择或异常点。";
  }
  return "拟合度偏低，建议先查看散点分布。";
}

function formatLinearEquation(a, b) {
  return b >= 0
    ? `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`
    : `y = ${a.toFixed(4)}x - ${Math.abs(b).toFixed(4)}`;
}

function formatQuadraticEquation(a, b, c) {
  let equation = `y = ${a.toFixed(4)}x²`;
  equation += b >= 0 ? ` + ${b.toFixed(4)}x` : ` - ${Math.abs(b).toFixed(4)}x`;
  equation += c >= 0 ? ` + ${c.toFixed(4)}` : ` - ${Math.abs(c).toFixed(4)}`;
  return equation;
}

function linspace(min, max, count) {
  if (count <= 1) {
    return [min];
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + (step * index));
}

function linearFit(pairs) {
  if (pairs.length < 2) {
    throw new Error("一次线性拟合至少需要 2 个有效数据点。");
  }

  const uniqueX = new Set(pairs.map((point) => point.x));
  if (uniqueX.size < 2) {
    throw new Error("X 轴数据至少需要两个不同的数值，才能进行一次线性拟合。");
  }

  const n = pairs.length;
  const sumX = pairs.reduce((sum, point) => sum + point.x, 0);
  const sumY = pairs.reduce((sum, point) => sum + point.y, 0);
  const sumXY = pairs.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sumX2 = pairs.reduce((sum, point) => sum + (point.x ** 2), 0);
  const denominator = (n * sumX2) - (sumX ** 2);
  const a = ((n * sumXY) - (sumX * sumY)) / denominator;
  const b = (sumY - (a * sumX)) / n;
  const yPred = pairs.map((point) => (a * point.x) + b);
  const xFit = linspace(Math.min(...pairs.map((point) => point.x)), Math.max(...pairs.map((point) => point.x)), 200);

  return {
    type: "linear",
    a,
    b,
    c: null,
    yPred,
    allMetrics: calcAllFitMetrics(pairs.map((point) => point.y), yPred),
    fitPoints: xFit.map((x) => ({ x, y: (a * x) + b })),
    equation: formatLinearEquation(a, b),
  };
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => row.concat(vector[index]));

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) {
        maxRow = row;
      }
    }

    if (Math.abs(augmented[maxRow][pivot]) < 1e-12) {
      throw new Error("二次拟合失败：数据矩阵不可逆，请检查 X 轴数据。");
    }

    [augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]];

    const pivotValue = augmented[pivot][pivot];
    for (let col = pivot; col <= size; col += 1) {
      augmented[pivot][col] /= pivotValue;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) {
        continue;
      }
      const factor = augmented[row][pivot];
      for (let col = pivot; col <= size; col += 1) {
        augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

function quadraticFit(pairs) {
  if (pairs.length < 3) {
    throw new Error("二次拟合至少需要 3 个有效数据点。");
  }

  const uniqueX = new Set(pairs.map((point) => point.x));
  if (uniqueX.size < 3) {
    throw new Error("X 轴数据至少需要三个不同的数值，才能进行二次拟合。");
  }

  const n = pairs.length;
  const sx = pairs.reduce((sum, point) => sum + point.x, 0);
  const sx2 = pairs.reduce((sum, point) => sum + (point.x ** 2), 0);
  const sx3 = pairs.reduce((sum, point) => sum + (point.x ** 3), 0);
  const sx4 = pairs.reduce((sum, point) => sum + (point.x ** 4), 0);
  const sy = pairs.reduce((sum, point) => sum + point.y, 0);
  const sxy = pairs.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sx2y = pairs.reduce((sum, point) => sum + ((point.x ** 2) * point.y), 0);

  const [a, b, c] = solveLinearSystem(
    [
      [sx4, sx3, sx2],
      [sx3, sx2, sx],
      [sx2, sx, n],
    ],
    [sx2y, sxy, sy],
  );

  const yPred = pairs.map((point) => (a * (point.x ** 2)) + (b * point.x) + c);
  const xFit = linspace(Math.min(...pairs.map((point) => point.x)), Math.max(...pairs.map((point) => point.x)), 300);

  return {
    type: "quadratic",
    a,
    b,
    c,
    yPred,
    allMetrics: calcAllFitMetrics(pairs.map((point) => point.y), yPred),
    fitPoints: xFit.map((x) => ({ x, y: (a * (x ** 2)) + (b * x) + c })),
    equation: formatQuadraticEquation(a, b, c),
  };
}

function autoTitle(title, xLabel, yLabel) {
  const cleaned = cellText(title);
  if (!cleaned || cleaned.toLowerCase() === "x-y curve") {
    return `${yLabel} vs ${xLabel}`;
  }
  return cleaned;
}

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
      originCsv: `${prefix}_origin_${jobId}.csv`,
      fullCsv: `${prefix}_full_data_${jobId}.csv`,
      fitReport: `${prefix}_fit_report_${jobId}.txt`,
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

function renderChart(payload) {
  if (!window.Chart) {
    throw new Error("图表库未加载，请检查网络后刷新页面。");
  }

  ensureChartPlugin();

  const canvas = qs("#plotCanvas");
  const width = Math.round(payload.figWidth * payload.figDpi);
  const height = Math.round(payload.figHeight * payload.figDpi);
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

function escapeCsvValue(value) {
  const text = value === null || value === undefined ? "" : String(value);
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
}

function setDownloadLink(selector, blob, filename) {
  const link = qs(selector);
  const url = URL.createObjectURL(blob);
  state.objectUrls.push(url);
  link.href = url;
  link.download = filename;
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

async function renderDownloads(payload) {
  if (!window.JSZip) {
    throw new Error("ZIP 打包库未加载，请检查网络后刷新页面。");
  }

  revokeDownloadUrls();

  const pngBlob = await canvasToBlob(qs("#plotCanvas"));
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

  const zip = new JSZip();
  zip.file(payload.filenames.png, pngBlob);
  zip.file(payload.filenames.originCsv, originCsvBlob);
  zip.file(payload.filenames.fullCsv, fullCsvBlob);
  zip.file(payload.filenames.fitReport, fitReportBlob);
  const zipBlob = await zip.generateAsync({ type: "blob" });

  setDownloadLink("#downloadPng", pngBlob, payload.filenames.png);
  setDownloadLink("#downloadOriginCsv", originCsvBlob, payload.filenames.originCsv);
  setDownloadLink("#downloadFullCsv", fullCsvBlob, payload.filenames.fullCsv);
  setDownloadLink("#downloadFitReport", fitReportBlob, payload.filenames.fitReport);
  setDownloadLink("#downloadZip", zipBlob, payload.filenames.zip);
}

function addSummaryRow(container, label, value, large = false) {
  container.appendChild(createValueItem(label, value, large ? "summary-row large" : "summary-row"));
}

function addStat(container, label, value) {
  container.appendChild(createValueItem(label, value));
}

function renderResult(payload) {
  const stats = payload.stats;
  qs("#resultFigureTitle").textContent = payload.plotTitle || "未命名图像";
  qs("#resultFigureMeta").textContent = `${stats.fig_width} × ${stats.fig_height} in / ${stats.fig_dpi} DPI`;
  qs("#resultFigureCurves").textContent = `${stats.curve_count} 条曲线`;

  const summary = qs("#summaryRows");
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

  const statsGrid = qs("#statsGrid");
  statsGrid.replaceChildren();
  addStat(statsGrid, "X 轴显示名称", stats.x_label);
  addStat(statsGrid, "Y 轴显示名称", stats.y_label);
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

async function handlePlotSubmit() {
  setPlotProgress("正在检查绘图设置...");
  const payload = buildPlotPayload();
  state.lastPlotPayload = payload;
  setPlotProgress("正在绘制图像...");
  renderChart(payload);
  setPlotProgress("正在生成下载文件...");
  await renderDownloads(payload);
  setPlotProgress("正在整理结果摘要...");
  renderResult(payload);
  showMessage("success", "已生成图像、CSV、拟合报告和 ZIP 素材包。");
  setActiveStep("result", { scroll: true });
}

async function loadSample(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("示例文件加载失败，请确认正在通过本地服务器或 GitHub Pages 访问页面。");
  }

  const buffer = await response.arrayBuffer();
  const fileName = url.split("/").pop();
  const extension = fileName.split(".").pop().toLowerCase();
  const rows = parseBuffer(buffer, extension);
  setDataset(rows, fileName);
  qs("#upload-section").scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage("success", `已加载示例数据：${fileName}`);
}

function getInitialSampleUrl() {
  const params = new URLSearchParams(window.location.search);
  const requestedSample = params.get("sample");
  if (!requestedSample) {
    return "";
  }

  const fileName = requestedSample.split(/[\\/]/).pop();
  if (!SAMPLE_FILES.has(fileName)) {
    return "";
  }

  return `./samples/${fileName}`;
}

async function loadInitialSampleFromUrl() {
  const sampleUrl = getInitialSampleUrl();
  if (!sampleUrl) {
    return;
  }

  clearMessage();
  try {
    await loadSample(sampleUrl);
    window.history.replaceState(null, "", window.location.pathname);
  } catch (error) {
    showMessage("error", error.message);
  }
}

function setupTheme() {
  const root = document.documentElement;
  const select = qs("#themeSelect");
  const storageKey = "labplot-theme";

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  async function refreshRenderedResult() {
    if (!state.lastPlotPayload || qs("#resultSection").classList.contains("is-hidden")) {
      return;
    }

    try {
      renderChart(state.lastPlotPayload);
      await renderDownloads(state.lastPlotPayload);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  function applyTheme(mode) {
    const finalMode = mode === "system" ? getSystemTheme() : mode;
    root.setAttribute("data-theme", finalMode);
    root.setAttribute("data-theme-mode", mode);
    localStorage.setItem(storageKey, mode);

    qsa(".brand-logo").forEach((logo) => {
      const lightSrc = logo.getAttribute("data-light");
      const darkSrc = logo.getAttribute("data-dark");
      logo.src = finalMode === "dark" ? darkSrc : lightSrc;
    });

    if (select) {
      select.value = mode;
    }

    window.requestAnimationFrame(() => {
      refreshRenderedResult();
    });
  }

  const saved = localStorage.getItem(storageKey) || "dark";
  applyTheme(saved);

  select.addEventListener("change", () => applyTheme(select.value));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const currentMode = localStorage.getItem(storageKey) || "system";
    if (currentMode === "system") {
      applyTheme("system");
    }
  });
}

function setupEvents() {
  qs("#uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    try {
      const file = qs("#dataFile").files[0];
      if (!file) {
        throw new Error("请先上传 CSV / Excel 文件。");
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("建议单个文件不超过 5MB。");
      }

      const rows = await parseFile(file);
      setDataset(rows, file.name);
      showMessage("success", `已读取文件：${file.name}`);
    } catch (error) {
      showMessage("error", error.message);
    }
  });

  qs("#rangeForm").addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    try {
      reloadDataFromRange(true);
    } catch (error) {
      showMessage("error", error.message);
    }
  });

  qs("#calcForm").addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    try {
      calculateColumn();
    } catch (error) {
      showMessage("error", error.message);
    }
  });

  qs("#plotForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    try {
      setPlotGenerating(true, "正在检查绘图设置...");
      await handlePlotSubmit();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setPlotGenerating(false);
      setPlotProgress("生成完成", false);
    }
  });

  qs("#plotForm").addEventListener("input", updatePlotReadiness);
  qs("#plotForm").addEventListener("change", updatePlotReadiness);

  qs("#addCurveButton").addEventListener("click", () => {
    const rows = qsa("#curveConfigBox .curve-row");
    const nextIndex = rows.length;
    const yCol = state.numericColumns[Math.min(nextIndex + 1, state.numericColumns.length - 1)] || state.numericColumns[0];
    const config = {
      yCol,
      color: DEFAULT_CURVE_COLORS[nextIndex % DEFAULT_CURVE_COLORS.length],
      lineWidth: 1.8,
      lineStyle: "solid",
    };
    qs("#curveConfigBox").appendChild(createCurveRow(config, nextIndex));
    updateRemoveButtons();
    updatePlotReadiness();
  });

  qs("#curveConfigBox").addEventListener("click", (event) => {
    const button = event.target.closest(".curve-remove-button");
    if (!button) {
      return;
    }

    const rows = qsa("#curveConfigBox .curve-row");
    if (rows.length <= 1) {
      updateRemoveButtons();
      return;
    }

    button.closest(".curve-row").remove();
    updateRemoveButtons();
    updatePlotReadiness();
  });

  qsa("[data-step-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const step = button.dataset.stepTarget;
      if (WORKFLOW_PANELS[step]) {
        setActiveStep(step, { scroll: true });
      }
    });
  });

  const resumeButton = qs("#resumeWorkflowButton");
  if (resumeButton) {
    resumeButton.addEventListener("click", () => {
      setActiveStep(state.activeStep, { scroll: true });
    });
  }

  const resetButton = qs("#resetWorkflowButton");
  if (resetButton) {
    resetButton.addEventListener("click", resetWorkflow);
  }

  qs("#sampleGuideActions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-sample-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.sampleAction;
    if (action === "calc") {
      applySampleCalcAction(Number(button.dataset.sampleActionIndex || 0));
    } else if (action === "plot") {
      applySamplePlotAction(Number(button.dataset.sampleActionIndex || 0));
    }
  });

  qsa(".sample-load-button").forEach((button) => {
    button.addEventListener("click", async () => {
      clearMessage();
      try {
        await loadSample(button.dataset.sample);
      } catch (error) {
        showMessage("error", error.message);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderStaticOptions();
  setupTheme();
  setupEvents();
  updateWorkflowNav();
  await loadInitialSampleFromUrl();
});
