"use strict";

async function handlePlotSubmit() {
  setPlotProgress("检查绘图设置...");
  await nextFrame();

  const payload = buildPlotPayload();
  state.lastPlotPayload = payload;
  clearResultDownloadLinks();
  setPlotProgress(window.Plotly ? "绘制图表..." : "加载绘图库...");
  show(qs("#resultSection"));
  setActiveStep("result");
  await nextFrame();
  await renderChart(payload);

  setPlotProgress("整理摘要...");
  renderResult(payload);
  setActiveStep("result", { scroll: true });
  showMessage("success", "图表已生成。准备下载文件。");
  await nextFrame();

  setPlotProgress("准备下载文件...");
  await renderDownloads(payload);
  showMessage("success", "图表、CSV 和 TXT 已就绪。ZIP 点击后打包。");
}

async function loadSample(url) {
  showMessage("info", "加载示例...");
  await nextFrame();

  const fileName = url.split("/").pop();
  const extension = fileName.split(".").pop().toLowerCase();
  const parserReady = fileNeedsSpreadsheetLibrary(fileName)
    ? ensureExternalLibrary("xlsx")
    : Promise.resolve();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("示例文件加载失败。请通过本地服务器或 GitHub Pages 访问。");
  }

  const buffer = await response.arrayBuffer();
  await parserReady;
  const rows = parseBuffer(buffer, extension);
  setDataset(rows, fileName);
  scrollToElement(qs("#upload-section"));
  showMessage("success", `已载入示例：${fileName}`);
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
  if (!sampleUrl || getInitialMode() === "simple") {
    return false;
  }

  clearMessage();
  try {
    await showMode("advanced", { skipScroll: true });
    await loadSample(sampleUrl);
    window.history.replaceState(null, "", window.location.pathname);
    return true;
  } catch (error) {
    showMessage("error", error.message);
    return true;
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
  setText("#selectedFileHint", file ? `已选：${file.name}` : "尚未选择文件。");
}

function getFileSignature(file) {
  return file ? `${file.name}:${file.size}:${file.lastModified}` : "";
}

async function showMode(mode, options = {}) {
  const sections = {
    simple: qs("#simpleMode"),
    advanced: qs("#advancedMode"),
  };
  const targetMode = mode === "advanced" ? "advanced" : "simple";
  const target = sections[targetMode];

  if (targetMode === "advanced") {
    await ensureAdvancedCarbonComponents();
  }

  Object.values(sections).forEach((section) => {
    if (section) {
      section.classList.toggle("is-hidden", section !== target);
    }
  });

  if (targetMode === "advanced") {
    updateWorkflowNav();
  }

  if (!options.skipScroll) {
    scrollToElement(target);
  }
}

async function loadInitialModeFromUrl() {
  const mode = getInitialMode();

  await showMode(mode || "simple", { skipScroll: true });
  if (mode) {
    window.history.replaceState(null, "", window.location.pathname);
  }
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
    throw new Error("未识别出 X/Y。请在功能模式选择。");
  }

  const xCol = state.numericColumns.find(isLikelyXColumn) || state.numericColumns[0];
  const yCol = state.numericColumns.find((column) => column !== xCol);
  if (!yCol) {
    throw new Error("未识别出 X/Y。请在功能模式选择。");
  }

  return { xCol, yCol };
}

function loadSimpleRows(rows, fileName) {
  state.fileName = fileName;
  state.samplePreset = null;
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
  state.activeStep = "range";
  updateWorkflowNav();

  return guess;
}

async function renderSimplePlotFromColumns(xCol, yCol, successMessage = "", options = {}) {
  const plotReady = options.plotReady || ensureExternalLibrary("plotly");

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
  resetPlotAnnotationControls();
  setControlChecked("#showGrid", false);
  renderCurveRows([{
    yCol,
    color: DEFAULT_CURVE_COLORS[0],
    lineWidth: 1.8,
    lineStyle: "solid",
    lineShape: "linear",
    xErrorCol: "",
    yErrorCol: "",
  }]);
  updatePlotReadiness();

  const payload = buildPlotPayload();
  state.simplePlotPayload = payload;
  state.lastPlotPayload = payload;
  clearSimpleDownloadLinks();
  setSimpleMessage("info", "绘制图表...");
  await plotReady;
  await renderChart(payload, "#simplePlotCanvas");
  await renderSimpleDownloads(payload);

  setText("#simpleXCol", xCol);
  setText("#simpleYCol", yCol);
  setText("#simplePointCount", `${payload.stats.points} 点`);
  show(qs("#simpleResult"));

  if (successMessage) {
    setSimpleMessage("success", successMessage);
  }
}

async function handleSimpleFile(file) {
  clearSimpleMessage();

  if (!file) {
    throw new Error("请先选择 CSV / Excel 文件。");
  }

  setSimpleMessage("info", "准备解析与绘图...");
  const parserReady = fileNeedsSpreadsheetLibrary(file.name)
    ? ensureExternalLibrary("xlsx")
    : Promise.resolve();
  const plotReady = ensureExternalLibrary("plotly");
  await nextFrame();
  await parserReady;

  setSimpleMessage("info", "读取文件，识别列...");
  const rows = await parseFile(file);
  loadSimpleRows(rows, file.name);
  const { xCol, yCol } = chooseSimpleXYColumns();

  await renderSimplePlotFromColumns(xCol, yCol, `已生成基础图：${file.name}`, { plotReady });
}

function setupModeEvents() {
  qsa("#simpleToAdvanced, #simpleToAdvancedTop").forEach((button) => {
    button.addEventListener("click", async () => {
      await showMode("advanced");
      if (state.rawRows.length) {
        showMessage("success", "已打开功能模式。可继续调整范围和图表。");
      }
    });
  });

  const simpleFileButton = qs("#simpleFileInput");
  const handleSimpleFileChange = async (event) => {
    const file = getFileFromUploadEvent(event, simpleFileButton);
    const signature = getFileSignature(file);
    if (signature && signature === state.simpleFileSignature) {
      return;
    }
    state.simpleFileSignature = signature;
    try {
      await handleSimpleFile(file);
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
      showMessage("success", "已读取粘贴数据。请检查表头和范围。");
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
        throw new Error("请先选择 CSV / Excel 文件。");
      }

      showMessage("info", fileNeedsSpreadsheetLibrary(file.name) ? "加载 Excel 解析库并读取文件..." : "读取 CSV...");
      await nextFrame();
      const rows = await parseFile(file);
      setDataset(rows, file.name);
      showMessage("success", `已读取：${file.name}`);
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
      setPlotGenerating(true, "检查绘图设置...");
      await handlePlotSubmit();
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setPlotGenerating(false);
      setPlotProgress("完成", false);
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
      lineShape: "linear",
      xErrorCol: "",
      yErrorCol: "",
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

  qs("#downloadZip")?.addEventListener("click", async (event) => {
    const link = event.currentTarget;
    if (link.getAttribute("download")) {
      return;
    }

    event.preventDefault();
    try {
      showMessage("info", window.JSZip ? "打包 ZIP..." : "加载 ZIP 打包库...");
      const zip = await generateZipDownload();
      triggerDownload(zip.url, zip.filename);
      showMessage("success", "ZIP 已生成，开始下载。");
    } catch (error) {
      showMessage("error", error.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  renderStaticOptions();
  setupTheme();
  setupModeEvents();
  setupEvents();
  updateWorkflowNav();

  if (!(await loadInitialSampleFromUrl())) {
    await loadInitialModeFromUrl();
  }
});
