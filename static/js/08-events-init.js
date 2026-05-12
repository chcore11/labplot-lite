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
    qsa(
      "#pasteForm [type='submit'], #uploadForm [type='submit'], .sample-load-button, #plotSubmitButton",
    ).forEach(disableControl);
  }

  if (missingKeys.has("zip")) {
    const zipLink = qs("#downloadZip");
    if (zipLink) {
      zipLink.setAttribute("aria-disabled", "true");
    }
  }

  return {
    blocksSampleLoad: missingKeys.has("xlsx") || missingKeys.has("chart"),
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
  async function refreshRenderedResult() {
    try {
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

  qs("#dataFile")?.addEventListener("cds-file-uploader-button-changed", (event) => {
    const file = event.detail?.addedFiles?.[0] || null;
    state.pendingUploadFile = file;
    setText("#selectedFileHint", file ? `已选择：${file.name}` : "尚未选择文件。");
  });

  qs("#uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage();

    try {
      const file = state.pendingUploadFile;
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
  setupEvents();
  const dependencyStatus = checkRequiredDependencies();
  updateWorkflowNav();
  if (!dependencyStatus.blocksSampleLoad) {
    await loadInitialSampleFromUrl();
  }
});
