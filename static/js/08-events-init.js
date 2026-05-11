"use strict";

const REQUIRED_DEPENDENCIES = [
  { key: "xlsx", label: "Excel 解析库", affects: "XLS / XLSX 文件和示例数据", isLoaded: () => Boolean(window.XLSX) },
  { key: "chart", label: "图表绘制库", affects: "图像生成", isLoaded: () => Boolean(window.Chart) },
  { key: "zip", label: "ZIP 打包库", affects: "报告素材包导出", isLoaded: () => Boolean(window.JSZip) },
];

function disableControl(control) {
  if (!control) {
    return;
  }

  if ("disabled" in control) {
    control.disabled = true;
  } else {
    control.setAttribute("tabindex", "-1");
  }
  control.setAttribute("aria-disabled", "true");
}

function showDependencyMessage(missingDependencies) {
  const box = qs("#dependencyMessage");
  if (!box || !missingDependencies.length) {
    return;
  }

  const missingLabels = missingDependencies.map((dependency) => dependency.label).join("、");
  const affectedAreas = missingDependencies.map((dependency) => dependency.affects).join("、");
  box.textContent = `部分功能依赖未加载：${missingLabels}。请检查网络后刷新页面。受影响：${affectedAreas}。`;
  box.className = "message error";
  show(box);
}

function checkRequiredDependencies() {
  const missingDependencies = REQUIRED_DEPENDENCIES.filter((dependency) => !dependency.isLoaded());
  const missingKeys = new Set(missingDependencies.map((dependency) => dependency.key));

  showDependencyMessage(missingDependencies);

  if (missingKeys.has("xlsx")) {
    qsa(".sample-load-button").forEach(disableControl);
  }

  if (missingKeys.has("chart")) {
    qsa(
      ".workbench-page .nav-cta, #enterSimpleMode, #enterAdvancedMode, #simpleChooseFile, #uploadForm button[type='submit'], .sample-load-button, #plotSubmitButton",
    ).forEach(disableControl);
  }

  if (missingKeys.has("zip")) {
    const zipLink = qs("#downloadZip");
    if (zipLink) {
      zipLink.setAttribute("aria-disabled", "true");
    }
  }

  return {
    blocksModeEntry: missingKeys.has("chart"),
    blocksSampleLoad: missingKeys.has("xlsx") || missingKeys.has("chart"),
  };
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
    showMode("advanced", { skipAnim: true });
    await loadSample(sampleUrl);
    window.history.replaceState(null, "", window.location.pathname);
  } catch (error) {
    showMessage("error", error.message);
  }
}

function setupTheme() {
  async function refreshRenderedResult() {
    try {
      const simpleMode = qs("#simpleMode");
      if (
        state.simplePlotPayload &&
        simpleMode &&
        !simpleMode.classList.contains("is-hidden") &&
        !qs("#simpleResult").classList.contains("is-hidden")
      ) {
        renderChart(state.simplePlotPayload, "#simplePlotCanvas");
        await renderSimpleDownloads(state.simplePlotPayload);
        return;
      }

      if (!state.lastPlotPayload || qs("#resultSection").classList.contains("is-hidden")) {
        return;
      }

      renderChart(state.lastPlotPayload);
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

function loadInitialModeFromUrl() {
  const mode = getInitialMode();
  if (mode) {
    showMode(mode, { skipAnim: true });
    window.history.replaceState(null, "", window.location.pathname);
  }
}

function showMode(mode, opts = {}) {
  const landing = qs("#modeLanding");
  const simple = qs("#simpleMode");
  const advanced = qs("#advancedMode");
  const sections = { landing, simple, advanced };
  const target = sections[mode];

  const visible = Object.values(sections).find((section) => section && !section.classList.contains("is-hidden"));

  const showImmediate = (element) => {
    Object.values(sections).forEach((section) => {
      if (section) {
        section.classList.toggle("is-hidden", section !== element);
      }
    });
    element.classList.remove("mode-enter", "mode-exit");
  };

  const animateIn = (element) => {
    element.classList.remove("is-hidden", "mode-exit");
    void element.offsetWidth;
    element.classList.add("mode-enter");
    element.addEventListener("animationend", () => element.classList.remove("mode-enter"), { once: true });
  };

  const scrollToModeTarget = () => {
    if (mode === "advanced") {
      const targetStep = state.rawRows.length ? state.activeStep : "upload";
      setActiveStep(targetStep, { scroll: false });
      scrollToElement(qs("#upload-section") || advanced);
    } else if (mode === "simple") {
      scrollToElement(simple || document.body);
    } else {
      scrollToElement(landing || document.body);
    }
  };

  if (opts.skipAnim || prefersReducedMotion() || !visible || visible === target) {
    if (target) {
      showImmediate(target);
    }
    scrollToModeTarget();
    return;
  }

  if (visible !== target) {
    visible.classList.add("mode-exit");
    visible.addEventListener("animationend", () => {
      visible.classList.add("is-hidden");
      visible.classList.remove("mode-exit");
      if (target) {
        animateIn(target);
      }
      scrollToModeTarget();
    }, { once: true });
  }
}

function setSimpleMessage(type, text) {
  const box = qs("#simpleMessage");
  if (!box) {
    return;
  }

  box.textContent = text;
  box.className = `message ${type}`;
  show(box);
}

function clearSimpleMessage() {
  const box = qs("#simpleMessage");
  if (!box) {
    return;
  }

  box.textContent = "";
  box.className = "message is-hidden";
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
  qs("#headerRow").value = String(guess.headerRow);
  qs("#dataStartRow").value = String(guess.dataStartRow);
  qs("#dataEndRow").value = "";

  const loaded = loadDataFromRawRows(guess.headerRow, guess.dataStartRow, null);
  state.columns = loaded.columns;
  state.data = loaded.data;
  state.numericColumns = loaded.numericColumns;
  state.activeStep = "range";

  renderPreview();
  renderDataControls();
  show(qs("#previewSection"));
  updateWorkflowNav();

  return guess;
}

async function handleSimpleFile(file) {
  clearSimpleMessage();

  if (!file) {
    throw new Error("请先选择 CSV / Excel 文件。");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("建议单个文件不超过 5MB。");
  }

  setSimpleMessage("success", "正在读取文件并识别绘图列...");
  const rows = await parseFile(file);
  const headerGuess = loadSimpleRows(rows, file.name);
  const { xCol, yCol } = chooseSimpleXYColumns();
  setSelectIfExists("#xCol", xCol);
  setSelectIfExists("#chartType", "line_marker");
  setSelectIfExists("#fitType", "none");
  renderCurveRows([{
    yCol,
    color: DEFAULT_CURVE_COLORS[0],
    lineWidth: 1.8,
    lineStyle: "solid",
  }]);
  updatePlotReadiness();

  const payload = buildSimplePlotPayload({ xCol, yCol, headerGuess });

  state.simplePlotPayload = payload;
  state.lastPlotPayload = payload;
  renderChart(payload, "#simplePlotCanvas");
  await renderSimpleDownloads(payload);

  qs("#simpleXCol").textContent = xCol;
  qs("#simpleYCol").textContent = yCol;
  qs("#simplePointCount").textContent = `${payload.stats.points} 点`;
  show(qs("#simpleResult"));
  setSimpleMessage("success", `已自动生成基础图：${file.name}`);
}

function setupModeEvents() {
  const simpleInput = qs("#simpleFileInput");
  const dropzone = qs("#simpleDropzone");

  qs("#enterSimpleMode").addEventListener("click", () => {
    showMode("simple");
  });

  qs("#enterAdvancedMode").addEventListener("click", () => {
    showMode("advanced");
  });

  const navImport = qs('.nav-cta[href="#upload-section"]');
  if (navImport) {
    navImport.addEventListener("click", (event) => {
      event.preventDefault();
      showMode("advanced");
    });
  }

  qsa("#simpleToAdvanced, #simpleToAdvancedTop").forEach((button) => {
    button.addEventListener("click", () => {
      showMode("advanced");
      if (state.rawRows.length) {
        showMessage("success", "已进入功能模式。可继续手动确认数据范围和绘图配置。");
      }
    });
  });

  qs("#simpleChooseFile").addEventListener("click", () => {
    simpleInput.click();
  });

  simpleInput.addEventListener("change", async () => {
    try {
      await handleSimpleFile(simpleInput.files[0]);
    } catch (error) {
      setSimpleMessage("error", error.message);
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    });
  });

  dropzone.addEventListener("drop", async (event) => {
    try {
      await handleSimpleFile(event.dataTransfer.files[0]);
    } catch (error) {
      setSimpleMessage("error", error.message);
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
  setupModeEvents();
  setupEvents();
  const dependencyStatus = checkRequiredDependencies();
  updateWorkflowNav();
  if (!dependencyStatus.blocksSampleLoad) {
    await loadInitialSampleFromUrl();
  }
  if (!getInitialSampleUrl() && !dependencyStatus.blocksModeEntry) {
    loadInitialModeFromUrl();
  }
});
