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

function prefersReducedMotion() {
  return Boolean(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
}

function scrollToElement(element, options = {}) {
  if (!element) {
    return;
  }

  const behavior = prefersReducedMotion() ? "auto" : (options.behavior || "smooth");
  element.scrollIntoView({ behavior, block: options.block || "start" });
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

    const shouldReflectAttribute = element.tagName.includes("-");
    if (name in element) {
      element[name] = value;
    }
    if (!(name in element) || shouldReflectAttribute) {
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
  return createElement("cds-button", {
    attributes: {
      kind: getCarbonButtonKind(className),
      size: getCarbonButtonSize(className),
      type: "button",
      ...attributes,
    },
    className,
    dataset,
    textContent: label,
  });
}

function getCarbonButtonKind(className = "") {
  if (className.includes("carbon-primary")) return "primary";
  if (className.includes("carbon-tertiary")) return "tertiary";
  if (className.includes("curve-remove-button")) return "danger-tertiary";
  return "ghost";
}

function getCarbonButtonSize(className = "") {
  return className.includes("curve-remove-button") ? "md" : "sm";
}

function createLabeledControl(labelText, control) {
  if (control?.tagName?.includes("-")) {
    if (control.tagName.toLowerCase() === "cds-select") {
      control.setAttribute("label-text", labelText);
    } else if (!control.hasAttribute("label")) {
      control.setAttribute("label", labelText);
    }
    return control;
  }

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

function getControl(target) {
  return typeof target === "string" ? qs(target) : target;
}

function getControlValue(target) {
  const control = getControl(target);
  if (!control) {
    return "";
  }
  return "value" in control ? control.value : (control.getAttribute("value") || "");
}

function setControlValue(target, value) {
  const control = getControl(target);
  if (!control) {
    return;
  }

  const stringValue = value === null || value === undefined ? "" : String(value);
  if ("value" in control) {
    control.value = stringValue;
  }
  control.setAttribute("value", stringValue);
}

function getControlChecked(target) {
  const control = getControl(target);
  return Boolean(control && ("checked" in control ? control.checked : control.hasAttribute("checked")));
}

function setControlChecked(target, checked) {
  const control = getControl(target);
  if (!control) {
    return;
  }

  if ("checked" in control) {
    control.checked = Boolean(checked);
  }
  control.toggleAttribute("checked", Boolean(checked));
}

function setControlDisabled(target, disabled) {
  const control = getControl(target);
  if (!control) {
    return;
  }

  if ("disabled" in control) {
    control.disabled = Boolean(disabled);
  } else {
    if (disabled) {
      control.setAttribute("tabindex", "-1");
    } else {
      control.removeAttribute("tabindex");
    }
  }
  control.toggleAttribute("disabled", Boolean(disabled));
  control.setAttribute("aria-disabled", String(Boolean(disabled)));
}

function getControlOptions(control) {
  return Array.from(control?.querySelectorAll("option, cds-select-item") || []);
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

  syncWorkflowNavLayout();

  if (!isWorkflowStepAvailable(state.activeStep)) {
    state.activeStep = getLastAvailableWorkflowStep();
  }

  const activePanelId = WORKFLOW_PANELS[state.activeStep];
  WORKFLOW_STEPS.forEach((step) => {
    const panel = getWorkflowPanel(step);
    if (panel) {
      panel.classList.toggle("is-active", WORKFLOW_PANELS[step] === activePanelId && isWorkflowStepAvailable(state.activeStep));
    }
  });

  const activeIndex = WORKFLOW_STEPS.indexOf(state.activeStep);
  const activeNavStep = state.activeStep === "calc" ? "range" : state.activeStep;
  qsa(".step-nav [data-step-target]").forEach((navItem) => {
    const step = navItem.dataset.stepTarget;
    const stepIndex = WORKFLOW_STEPS.indexOf(step);
    const available = isWorkflowStepAvailable(step);
    const isActive = step === activeNavStep;

    navItem.disabled = !available;
    navItem.classList.toggle("is-active", isActive);
    navItem.classList.toggle("is-complete", !isActive && available && stepIndex >= 0 && stepIndex < activeIndex);
    navItem.setAttribute("state", isActive ? "current" : (available && stepIndex >= 0 && stepIndex < activeIndex ? "complete" : "incomplete"));

    if (isActive) {
      navItem.setAttribute("aria-current", "step");
    } else {
      navItem.removeAttribute("aria-current");
    }
  });

  const status = qs("#workflowStatusText");
  if (status) {
    status.textContent = WORKFLOW_STATUS[state.activeStep] || WORKFLOW_STATUS.upload;
  }

  updateWorkflowActions();
}

function syncWorkflowNavLayout() {
  const nav = qs(".step-nav");
  if (!nav || !window.matchMedia) {
    return;
  }

  const vertical = window.matchMedia("(max-width: 640px)").matches;
  nav.vertical = vertical;
  nav.toggleAttribute("vertical", vertical);
  qsa(".step-nav cds-progress-step").forEach((step) => {
    step.vertical = vertical;
    step.toggleAttribute("vertical", vertical);
  });
}

function updateWorkflowActions() {
  const resetButton = qs("#resetWorkflowButton");

  if (resetButton) {
    const canReset = Boolean(state.rawRows.length || state.lastPlotPayload);
    resetButton.disabled = !canReset;
    resetButton.classList.toggle("is-hidden", !canReset);
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
    scrollToElement(panel || qs("#upload-section"));
  }
}

function showMessage(type, text) {
  const box = qs("#statusMessage");
  renderNotification(box, type, text);
}

function clearMessage() {
  const box = qs("#statusMessage");
  clearNotification(box);
}

function renderNotification(box, type, text, title = "状态") {
  if (!box) {
    return;
  }

  const kind = type === "error" ? "error" : type === "warning" ? "warning" : type === "success" ? "success" : "info";
  box.kind = kind;
  box.title = title;
  box.subtitle = text;
  box.setAttribute("kind", kind);
  box.setAttribute("title", title);
  box.setAttribute("subtitle", text);
  box.setAttribute("open", "");
  box.className = `message ${type}`;
  show(box);
}

function clearNotification(box) {
  if (!box) {
    return;
  }

  box.subtitle = "";
  box.removeAttribute("subtitle");
  box.removeAttribute("open");
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

  const effectiveSelectedValue = selectedValue ?? entries[0]?.value ?? "";
  entries.forEach((entry) => {
    const isCarbonSelect = select.tagName.toLowerCase() === "cds-select";
    select.appendChild(createElement(isCarbonSelect ? "cds-select-item" : "option", {
      attributes: {
        label: isCarbonSelect ? entry.label : undefined,
        selected: entry.value === effectiveSelectedValue,
        value: entry.value,
      },
      textContent: entry.label,
    }));
  });

  if (effectiveSelectedValue) {
    setControlValue(select, effectiveSelectedValue);
  }
}

function objectEntriesToOptions(object) {
  return Object.entries(object).map(([value, label]) => ({ value, label }));
}
