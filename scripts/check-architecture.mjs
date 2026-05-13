#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignoredDirs = new Set([
  ".git",
  ".agents",
  ".impeccable",
  ".venv",
  "__pycache__",
  "node_modules",
  "_site",
]);
const scannedExtensions = new Set([".html", ".js", ".css"]);
const failures = [];

function toRepoPath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function listFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        files.push(...listFiles(path.join(dir, entry.name)));
      }
      return;
    }

    if (entry.isFile() && scannedExtensions.has(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  });

  return files;
}

function addFailure(filePath, line, message) {
  failures.push(`${toRepoPath(filePath)}:${line}: ${message}`);
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

const files = listFiles(rootDir);

const bannedLibraries = [
  {
    pattern: /\bchart(?:\.min)?\.js\b|cdn\.jsdelivr\.net\/npm\/chart\.js|unpkg\.com\/chart\.js/gi,
    message: "Chart.js adds a parallel chart engine; use Plotly for scientific charts.",
  },
  {
    pattern: /\bd3(?:\.min)?\.js\b|d3js\.org|cdn\.jsdelivr\.net\/npm\/d3|unpkg\.com\/d3/gi,
    message: "D3 adds a parallel chart engine; use Plotly for scientific charts.",
  },
  {
    pattern: /echarts(?:\.min)?\.js|cdn\.jsdelivr\.net\/npm\/echarts|unpkg\.com\/echarts/gi,
    message: "ECharts adds a parallel chart engine; use Plotly for scientific charts.",
  },
];

const allowedPlotlyCallFiles = new Set([
  "static/js/06-plot-build-render.js",
  "static/js/07-downloads-result.js",
]);

const allowedCanvasFiles = new Set([
  "static/js/07-downloads-result.js",
]);

files.forEach((filePath) => {
  const repoPath = toRepoPath(filePath);
  const source = fs.readFileSync(filePath, "utf8");

  bannedLibraries.forEach(({ pattern, message }) => {
    for (const match of source.matchAll(pattern)) {
      addFailure(filePath, lineNumber(source, match.index || 0), message);
    }
  });

  for (const match of source.matchAll(/\bPlotly\./g)) {
    if (!allowedPlotlyCallFiles.has(repoPath)) {
      addFailure(filePath, lineNumber(source, match.index || 0), "Direct Plotly calls belong in plot build/render or export modules.");
    }
  }

  const canvasPatterns = [
    /document\.createElement\(["']canvas["']\)/g,
    /\.getContext\(["']2d["']\)/g,
    /\<canvas\b/gi,
  ];

  canvasPatterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      if (!allowedCanvasFiles.has(repoPath)) {
        addFailure(filePath, lineNumber(source, match.index || 0), "Custom canvas drawing is not part of the LabPlot chart architecture.");
      }
    }
  });

  if (repoPath === "workbench.html") {
    for (const match of source.matchAll(/\<svg\b/gi)) {
      addFailure(filePath, lineNumber(source, match.index || 0), "Workbench chart UI must render through Plotly, not inline SVG.");
    }

    for (const match of source.matchAll(/https:\/\/cdn\.jsdelivr\.net\/npm\/([^"'\s>]+)/g)) {
      const packageSpec = match[1];
      if (!packageSpec.includes("@")) {
        addFailure(filePath, lineNumber(source, match.index || 0), "CDN dependencies must be pinned to an explicit version.");
      }
    }

    for (const match of source.matchAll(/https:\/\/1\.www\.s81c\.com\/common\/carbon\/web-components\/version\/([^/"'\s>]+)/g)) {
      if (!/^v\d+\.\d+\.\d+$/.test(match[1])) {
        addFailure(filePath, lineNumber(source, match.index || 0), "Carbon Web Components must be pinned to an explicit version.");
      }
    }
  }

  if (repoPath === "index.html" || repoPath === "workbench.html") {
    if (!source.includes("Content-Security-Policy")) {
      addFailure(filePath, 1, "Static pages must declare a Content-Security-Policy meta tag.");
    }

    for (const match of source.matchAll(/<script[^>]+src=["']https:\/\/[^"']+["'][^>]*>/gi)) {
      const tag = match[0];
      if (!/\bintegrity=["'][^"']+["']/.test(tag) || !/\bcrossorigin=["']anonymous["']/.test(tag)) {
        addFailure(filePath, lineNumber(source, match.index || 0), "External scripts must use SRI and crossorigin=\"anonymous\".");
      }
    }
  }
});

if (failures.length) {
  console.error("Architecture guardrails failed.");
  console.error("");
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

console.log("Architecture guardrails passed.");
