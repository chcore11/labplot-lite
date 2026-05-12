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
  pendingUploadFile: null,
  columns: [],
  data: [],
  numericColumns: [],
  lastPlotPayload: null,
  simplePlotPayload: null,
  isPlotGenerating: false,
  activeStep: "upload",
  objectUrls: [],
  sampleGuide: null,
};

const WORKFLOW_STEPS = ["upload", "range", "calc", "plot", "result"];

const WORKFLOW_PANELS = {
  upload: "step-upload",
  range: "previewSection",
  calc: "previewSection",
  plot: "plotSection",
  result: "resultSection",
};

const WORKFLOW_STATUS = {
  upload: "等待导入数据",
  range: "检查与描述数据",
  calc: "可选加工数据",
  plot: "编辑可视化",
  result: "导出报告素材",
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
