"use strict";

const REQUIRED_DEPENDENCIES = [
  { key: "xlsx", label: "Excel 解析库", affects: "XLS / XLSX 文件和示例数据", isLoaded: () => Boolean(window.XLSX) },
  {
    key: "chart",
    label: "图表绘制库",
    affects: "图像生成和 SVG 导出",
    isLoaded: () => Boolean(window.Plotly),
  },
  { key: "zip", label: "ZIP 打包库", affects: "报告素材包导出", isLoaded: () => Boolean(window.JSZip) },
];

function disableControl(control) {
  setControlDisabled(control, true);
}

function showDependencyMessage(missingDependencies) {
  const box = qs("#dependencyMessage");
  if (!box || !missingDependencies.length) {
    return;
  }

  const missingLabels = missingDependencies.map((dependency) => dependency.label).join("、");
  const affectedAreas = missingDependencies.map((dependency) => dependency.affects).join("、");
  renderNotification(
    box,
    "error",
    `部分功能依赖未加载：${missingLabels}。请检查网络后刷新页面。受影响：${affectedAreas}。`,
    "依赖未加载",
  );
}

function checkRequiredDependencies() {
  const missingDependencies = REQUIRED_DEPENDENCIES.filter((dependency) => !dependency.isLoaded());
  const missingKeys = new Set(missingDependencies.map((dependency) => dependency.key));

  showDependencyMessage(missingDependencies);

  if (missingKeys.has("xlsx")) {
    qsa(".sample-load-button").forEach(disableControl);
  }

  if (missingKeys.has("chart")) {
    qsa("#plotSubmitButton, #simpleFileInput, #enterSimpleMode").forEach(disableControl);
  }

  if (missingKeys.has("zip")) {
    const zipLink = qs("#downloadZip");
    if (zipLink) {
      zipLink.setAttribute("aria-disabled", "true");
    }
  }

  return {
    blocksSampleLoad: missingKeys.has("xlsx"),
  };
}

async function handlePlotSubmit() {
  setPlotProgress("正在检查绘图设置...");
  const payload = buildPlotPayload();
  state.lastPlotPayload = payload;
  setPlotProgress("正在绘制图像...");
  show(qs("#resultSection"));
  setActiveStep("result");
  await renderChart(payload);
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
  scrollToElement(qs("#upload-section"));
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

function getInitialMode() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");
  return mode === "simple" || mode === "advanced" ? mode : "";
}

async function loadInitialSampleFromUrl() {
  const sampleUrl = getInitialSampleUrl();
  if (!sampleUrl) {
    return;
  }

  clearMessage();
  try {
    showMode("advanced", { skipScroll: true });
    await loadSample(sampleUrl);
    window.history.replaceState(null, "", window.location.pathname);
  } catch (error) {
    showMessage("error", error.message);
  }
}

function getFirstFileFromFileList(files) {
  if (!files || !files.length) {
    return null;
  }
  return files[0] || null;
}

function getFileFromUploaderButton(uploaderButton) {
  if (!uploaderButton) {
    return null;
  }

  const directFile =
    getFirstFileFromFileList(uploaderButton.files) ||
    getFirstFileFromFileList(uploaderButton.addedFiles);
  if (directFile) {
    return directFile;
  }

  const input =
    uploaderButton.querySelector?.("input[type='file']") ||
    uploaderButton.shadowRoot?.querySelector?.("input[type='file']");
  return getFirstFileFromFileList(input?.files);
}

function getFileFromUploadEvent(event, uploaderButton = qs("#dataFile")) {
  const detail = event?.detail || {};
  return (
    getFirstFileFromFileList(detail.addedFiles) ||
    getFirstFileFromFileList(detail.files) ||
    getFirstFileFromFileList(detail.selectedFiles) ||
    getFirstFileFromFileList(event?.target?.files) ||
    getFileFromUploaderButton(uploaderButton)
  );
}

function syncPendingUploadFile(file) {
  state.pendingUploadFile = file || null;
  setText("#selectedFileHint", file ? `已选择：${file.name}` : "尚未选择文件。");
}

function showMode(mode, options = {}) {
  const sections = {
    landing: qs("#modeLanding"),
    simple: qs("#simpleMode"),
    advanced: qs("#advancedMode"),
  };
  const target = sections[mode] || sections.landing;

  Object.values(sections).forEach((section) => {
    if (section) {
      section.classList.toggle("is-hidden", section !== target);
    }
  });

  if (mode === "advanced") {
    updateWorkflowNav();
  }

  if (!options.skipScroll) {
    scrollToElement(target);
  }
}

function loadInitialModeFromUrl() {
  const mode = getInitialMode();
  if (!mode) {
    return;
  }

  showMode(mode, { skipScroll: true });
  window.history.replaceState(null, "", window.location.pathname);
}

function setSimpleMessage(type, text) {
  renderNotification(qs("#simpleMessage"), type, text, "简易模式");
}

function clearSimpleMessage() {
  clearNotification(qs("#simpleMessage"));
}

function isLikelyXColumn(column) {
  const text = cellText(column).toLowerCase();
  const compact = text.replace(/[\s_-]+/g, "");
  return (
    text.includes("time") ||
    text.includes("时间") ||
    compact === "t" ||
    compact === "x" ||
    compact.startsWith("t") ||
    compact.startsWith("x")
  );
}

function chooseSimpleXYColumns() {
  if (state.numericColumns.length < 2) {
    throw new Error("无法自动识别 X/Y，请进入功能模式手动选择。");
  }

  const xCol = state.numericColumns.find(isLikelyXColumn) || state.numericColumns[0];
  const yCol = state.numericColumns.find((column) => column !== xCol);
  if (!yCol) {
    throw new Error("无法自动识别 X/Y，请进入功能模式手动选择。");
  }

  return { xCol, yCol };
}

function loadSimpleRows(rows, fileName) {
  state.fileName = fileName;
  state.sampleGuide = null;
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
  state.activeStep = "range";
  updateWorkflowNav();

  return guess;
}

async function handleSimpleFile(file) {
  clearSimpleMessage();

  if (!window.Plotly) {
    throw new Error("图表绘制库未加载，暂时不能生成简易模式图像。请检查网络后刷新页面。");
  }
  if (!file) {
    throw new Error("请先选择 CSV / Excel 文件。");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("建议单个文件不超过 5MB。");
  }

  setSimpleMessage("info", "正在读取文件并识别绘图列...");
  const rows = await parseFile(file);
  loadSimpleRows(rows, file.name);
  const { xCol, yCol } = chooseSimpleXYColumns();

  setSelectIfExists("#xCol", xCol);
  setSelectIfExists("#chartType", "line_marker");
  setSelectIfExists("#fitType", "none");
  setSelectIfExists("#metricMode", "basic");
  setControlValue("#plotTitle", "");
  setControlValue("#xLabel", xCol);
  setControlValue("#yLabel", yCol);
  setControlValue("#figWidth", "7");
  setControlValue("#figHeight", "4.6");
  setControlValue("#figDpi", "300");
  setControlValue("#titleFontsize", "15");
  setControlValue("#labelFontsize", "13");
  setControlValue("#legendFontsize", "11");
  setControlChecked("#showGrid", false);
  renderCurveRows([{
    yCol,
    color: DEFAULT_CURVE_COLORS[0],
    lineWidth: 1.8,
    lineStyle: "solid",
  }]);
  updatePlotReadiness();

  const payload = buildPlotPayload();
  state.simplePlotPayload = payload;
  state.lastPlotPayload = payload;
  await renderChart(payload, "#simplePlotCanvas");
  await renderSimpleDownloads(payload);

  setText("#simpleXCol", xCol);
  setText("#simpleYCol", yCol);
  setText("#simplePointCount", `${payload.stats.points} 点`);
  show(qs("#simpleResult"));
  setSimpleMessage("success", `已自动生成基础图：${file.name}`);
}

function setupModeEvents() {
  qsa("[data-mode-choice]").forEach((entry) => {
    entry.addEventListener("click", (event) => {
      event.preventDefault();
      if (entry.disabled || entry.getAttribute("aria-disabled") === "true") {
        return;
      }
      showMode(entry.dataset.modeChoice);
    });
  });

  qsa("#simpleToAdvanced, #simpleToAdvancedTop").forEach((button) => {
    button.addEventListener("click", () => {
      showMode("advanced");
      if (state.rawRows.length) {
        showMessage("success", "已进入功能模式。可继续手动确认数据范围和绘图配置。");
      }
    });
  });

  const simpleFileButton = qs("#simpleFileInput");
  const handleSimpleFileChange = async (event) => {
    try {
      await handleSimpleFile(getFileFromUploadEvent(event, simpleFileButton));
    } catch (error) {
      setSimpleMessage("error", error.message);
    }
  };

  simpleFileButton?.addEventListener("cds-file-uploader-button-changed", handleSimpleFileChange);
  simpleFileButton?.addEventListener("change", handleSimpleFileChange);
}

function setupTheme() {
  async function refreshRenderedResult() {
    try {
      if (
        state.simplePlotPayload &&
        qs("#simpleMode") &&
        !qs("#simpleMode").classList.contains("is-hidden") &&
        !qs("#simpleResult").classList.contains("is-hidden")
      ) {
        await renderChart(state.simplePlotPayload, "#simplePlotCanvas");
        await renderSimpleDownloads(state.simplePlotPayload);
        return;
      }

      if (!state.lastPlotPayload || qs("#resultSection").classList.contains("is-hidden")) {
        return;
      }

      await renderChart(state.lastPlotPayload);
      await renderDownloads(state.lastPlotPayload);
    } catch (error) {
      showMessage("error", error.message);
    }
  }

  window.LabPlotTheme.init({
    onApply: () => {
      window.requestAnimationFrame(() => {
        refreshRenderedResult();
      });
    },
  });
}

function setupEvents() {
  qsa("form cds-button[type='submit']").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (!button.disabled) {
        button.closest("form")?.requestSubmit();
      }
    });
  });

  qs("#pasteForm").addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessage();

    try {
      const rows = parsePastedTable(getControlValue("#pasteData"));
      setDataset(rows, "pasted-data.csv");
      showMessage("success", "已读取粘贴数据。请检查表头和数据范围。");
    } catch (error) {
      showMessage("error", error.message);
    }
  });

  const uploadForm = qs("#uploadForm");
  const dataFileButton = qs("#dataFile");
  const handleUploadFileChange = (event) => {
    syncPendingUploadFile(getFileFromUploadEvent(event, dataFileButton));
  };
  dataFileButton?.addEventListener("cds-file-uploader-button-changed", handleUploadFileChange);
  dataFileButton?.addEventListener("change", handleUploadFileChange);
  uploadForm.addEventListener("cds-file-uploader-button-changed", handleUploadFileChange);
  uploadForm.addEventListener("change", handleUploadFileChange);

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    try {
      const file = state.pendingUploadFile || getFileFromUploaderButton(dataFileButton);
      syncPendingUploadFile(file);
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

  if (window.matchMedia) {
    const mobileWorkflow = window.matchMedia("(max-width: 640px)");
    if (mobileWorkflow.addEventListener) {
      mobileWorkflow.addEventListener("change", updateWorkflowNav);
    } else if (mobileWorkflow.addListener) {
      mobileWorkflow.addListener(updateWorkflowNav);
    }
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
  setupModeEvents();
  setupEvents();
  const dependencyStatus = checkRequiredDependencies();
  updateWorkflowNav();
  if (!dependencyStatus.blocksSampleLoad) {
    await loadInitialSampleFromUrl();
  }
  if (!getInitialSampleUrl()) {
    loadInitialModeFromUrl();
  }
});
