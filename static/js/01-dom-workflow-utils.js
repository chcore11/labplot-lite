"use strict";

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
