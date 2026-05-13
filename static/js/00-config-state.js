"use strict";

const CHART_TYPES = {
  line: "折线图",
  scatter: "散点图",
  line_marker: "散点 + 连线",
  area: "面积图",
  bar: "柱状图",
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

const AXIS_SCALE_TYPES = {
  linear: "线性",
  log: "对数",
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

const LINE_SHAPES = {
  linear: "直线连接",
  spline: "平滑曲线",
  hv: "阶梯线",
};

const LEGEND_MODES = {
  auto: "自动",
  top: "顶部",
  right: "右侧",
  bottom: "底部",
  hidden: "隐藏",
};

const DATA_LABEL_MODES = {
  none: "不显示",
  last: "末端标签",
  all: "全部点值",
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
const MULTI_Y_FIT_LABEL = "多曲线不拟合";
const MULTI_Y_FIT_NOTICE = "多曲线暂不拟合。需要拟合时保留一条曲线。";

const DATA_LIMITS = {
  maxCells: 200000,
  maxColumns: 80,
  maxFileBytes: 5 * 1024 * 1024,
  maxPasteChars: 1000000,
  maxRows: 5000,
};

const EXTERNAL_LIBRARIES = {
  xlsx: {
    label: "Excel 解析库",
    src: "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
    integrity: "sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw",
    isLoaded: () => Boolean(window.XLSX),
  },
  plotly: {
    label: "图表绘制库",
    src: "https://cdn.plot.ly/plotly-basic-3.4.0.min.js",
    integrity: "sha384-I/jFvZCE5jIjNC2uiuudU21nFNmrIU7uZDcPSsgoWUQhGPzhnIP1pM/fL9Ee7UTZ",
    isLoaded: () => Boolean(window.Plotly),
  },
  jszip: {
    label: "ZIP 打包库",
    src: "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
    integrity: "sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG",
    isLoaded: () => Boolean(window.JSZip),
  },
};

const CARBON_COMPONENT_INTEGRITY = {
  accordion: "sha384-xxLGyTg2CeGlFLyBAsGXNRm1aLUE+HSe/D+03h62gsQbiPYFxiMLpHM5i5zWGY/X",
  checkbox: "sha384-7El13wYwJWnC7HzszQTPBWHAQHF3aTxdd6g8HTMlL353GATj/ae7+Do7RyDIEN1s",
  "data-table": "sha384-/oXdCYZB+XjtcRpbz9UPniEsH/kMwnCon6xljbksIAh3KABt+6sLoJLr1R0eC7WX",
  "inline-loading": "sha384-ChklNAnnmqMI+jLKYNEH/dPLn/EJIqO6iz30h0tX6h9IjCL7BscNN4t5nq1nKtBb",
  "number-input": "sha384-pL9IAIhJqILbaluoVxc+j5OUM+LoGHgienL2/7WIY+TLmYZtiYRIlSxwl0edeYlL",
  "progress-indicator": "sha384-tSROjx/jQQ9krWgZHpo1HfSL1ph/S5KUb5bk8IuGAIxF6ICpMjiUx04FUZUH9wxx",
  select: "sha384-R4vQ8L7MHK1lC4zeWAvI6xDAmJUSvxMtScjhSCS8lzdTeYKcsoO8vsFuwDmDIGpB",
  tag: "sha384-NpoJHdjFIu4oAsxDDC3EvmV30fMvu1K6SqC6bD051jBHokJ6Cy1thSy1kOoZtvQO",
  "text-input": "sha384-bZvVjrEqPMt5rITX2akoxM+C8ypv/bnWsk+uHdxwxwYUBri9sKWGAldHDZ8QVzXq",
  textarea: "sha384-O9iqxR6PuTaWXO40/vmScHnc42P09VXvS2l6u4XtxYmXFJcTpatsBP47YJzStXQz",
  tile: "sha384-tgV2oAv8cQFbNSopF2nerc5kd/VhSxSJNAELnA8koOE1pnnM0AdALjMr+bRXTuUr",
};

const CARBON_ADVANCED_COMPONENTS = [
  "accordion",
  "checkbox",
  "data-table",
  "inline-loading",
  "number-input",
  "progress-indicator",
  "select",
  "tag",
  "text-input",
  "textarea",
  "tile",
].map((name) => ({
  integrity: CARBON_COMPONENT_INTEGRITY[name],
  src: `https://1.www.s81c.com/common/carbon/web-components/version/v2.17.0/${name}.min.js`,
  tag: `cds-${name === "data-table" ? "table" : name}`,
}));

const SAMPLE_FILES = new Set([
  "sample_01_temp_c_to_k.xlsx",
  "sample_02_voltage_scale.xlsx",
  "sample_03_abs_error.xlsx",
  "sample_04_invalid_log.xlsx",
  "temperature_time.csv",
  "voltage_current.csv",
  "concentration_absorbance.csv",
  "cooling_curve.csv",
  "free_fall_fit.csv",
]);

const SAMPLE_PRESETS = {
  "sample_01_temp_c_to_k.xlsx": {
    xCol: "wavelength_nm",
    curves: [
      { yCol: "sample_low_a_u", color: "#0072B2", lineWidth: 2.2, lineStyle: "solid", lineShape: "spline" },
      { yCol: "sample_high_a_u", color: "#D55E00", lineWidth: 2.4, lineStyle: "solid", lineShape: "spline" },
      { yCol: "reference_a_u", color: "#4B5563", lineWidth: 1.9, lineStyle: "dashed", lineShape: "spline" },
    ],
    chartType: "line_marker",
    dataLabelMode: "last",
    fitType: "none",
    legendMode: "hidden",
    referenceLabel: "Emission peak",
    showGrid: false,
    title: "Fluorescence emission spectra",
    xAxisMax: 580,
    xAxisMin: 440,
    xLabel: "Wavelength (nm)",
    xReferenceValue: 540,
    yAxisMax: 1.3,
    yAxisMin: 0,
    yLabel: "Intensity (a.u.)",
  },
  "sample_02_voltage_scale.xlsx": {
    xCol: "time_min",
    curves: [
      { yCol: "control_pct", color: "#4B5563", lineWidth: 1.8, lineStyle: "solid", lineShape: "linear" },
      { yCol: "low_dose_pct", color: "#0072B2", lineWidth: 2, lineStyle: "solid", lineShape: "linear" },
      { yCol: "high_dose_pct", color: "#D55E00", lineWidth: 2.1, lineStyle: "dashed", lineShape: "linear" },
      { yCol: "pulse_recovery_pct", color: "#009E73", lineWidth: 2.1, lineStyle: "dashdot", lineShape: "hv" },
    ],
    chartType: "line_marker",
    fitType: "none",
    legendMode: "right",
    referenceLabel: "Pulse",
    showGrid: false,
    title: "Reaction kinetics under different conditions",
    xAxisMax: 90,
    xAxisMin: 0,
    xLabel: "Time (min)",
    xReferenceValue: 45,
    yAxisMax: 105,
    yAxisMin: 0,
    yLabel: "Normalized response (%)",
  },
  "sample_03_abs_error.xlsx": {
    xCol: "concentration_um",
    curves: [
      { yCol: "absorbance_mean", color: "#0072B2", lineWidth: 1.8, lineStyle: "solid", lineShape: "linear", yErrorCol: "absorbance_sd" },
    ],
    chartType: "scatter",
    fitType: "linear",
    legendMode: "top",
    referenceLabel: "Midpoint",
    showGrid: false,
    title: "Analytical calibration curve",
    xAxisMax: 20,
    xAxisMin: 0,
    xLabel: "Concentration (uM)",
    xReferenceValue: 10,
    yAxisMax: 1.3,
    yAxisMin: 0,
    yLabel: "Absorbance (a.u.)",
    yReferenceValue: 0.6,
  },
  "sample_04_invalid_log.xlsx": {
    xCol: "raman_shift_cm",
    curves: [
      { yCol: "pristine_a_u", color: "#0072B2", lineWidth: 1.8, lineStyle: "solid", lineShape: "spline" },
      { yCol: "annealed_a_u", color: "#E69F00", lineWidth: 1.8, lineStyle: "dashed", lineShape: "spline" },
      { yCol: "doped_a_u", color: "#D55E00", lineWidth: 2.2, lineStyle: "solid", lineShape: "spline" },
    ],
    chartType: "line_marker",
    fitType: "none",
    legendMode: "right",
    referenceLabel: "D peak",
    showGrid: false,
    title: "Raman spectra comparison",
    xAxisMax: 1800,
    xAxisMin: 900,
    xLabel: "Raman shift (cm^-1)",
    xReferenceValue: 1350,
    yAxisMax: 1.6,
    yAxisMin: 0.1,
    yAxisScale: "log",
    yLabel: "Intensity (a.u.)",
    yReferenceValue: 1,
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
  pendingUploadFile: null,
  columns: [],
  data: [],
  numericColumns: [],
  lastPlotPayload: null,
  simplePlotPayload: null,
  isPlotGenerating: false,
  activeStep: "upload",
  objectUrls: [],
  pendingZipPackage: null,
  libraryPromises: {},
  samplePreset: null,
  simpleFileSignature: "",
};

const WORKFLOW_STEPS = ["upload", "range", "calc", "plot", "result"];

const WORKFLOW_PANELS = {
  upload: "step-upload",
  range: "previewSection",
  calc: "previewSection",
  plot: "plotSection",
  result: "resultSection",
};

const EMPTY_RESULT_STATE = {
  title: "等待生成",
  meta: "待生成",
  curves: "待生成",
};

const PLOT_PENDING_VALUES = {
  points: "待选择",
  fit: "待选择",
  exportSize: "待生成",
};
