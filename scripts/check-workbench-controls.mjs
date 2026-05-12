#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workbenchPath = path.join(rootDir, "workbench.html");
const html = fs.readFileSync(workbenchPath, "utf8");
const forbidden = /\<(input|select|textarea|button|details|table)\b/gi;
const failures = [];

for (const match of html.matchAll(forbidden)) {
  const index = match.index || 0;
  const line = html.slice(0, index).split(/\r?\n/).length;
  failures.push(`${path.relative(rootDir, workbenchPath)}:${line}: native <${match[1].toLowerCase()}> is not allowed in the workbench`);
}

if (failures.length) {
  console.error("Workbench UI must use Carbon Web Components for generic controls.");
  console.error("If a native control is truly required, document the exception in the same change.");
  console.error("");
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}

console.log("Workbench control ownership passed.");
