"use strict";

function decodeText(buffer) {
  const encodings = ["utf-8", "gb18030", "gbk"];

  for (const encoding of encodings) {
    try {
      return new TextDecoder(encoding, { fatal: true }).decode(buffer);
    } catch (error) {
      // Try the next encoding.
    }
  }

  return new TextDecoder("utf-8").decode(buffer);
}

function assertTableSize(rows, label = "数据") {
  let maxColumns = 0;
  let cellCount = 0;

  rows.forEach((row) => {
    maxColumns = Math.max(maxColumns, row.length);
    cellCount += row.length;
  });

  if (rows.length > DATA_LIMITS.maxRows) {
    throw new Error(`${label}超过 ${DATA_LIMITS.maxRows} 行，请先精简数据范围。`);
  }
  if (maxColumns > DATA_LIMITS.maxColumns) {
    throw new Error(`${label}超过 ${DATA_LIMITS.maxColumns} 列，请先删除无关列。`);
  }
  if (cellCount > DATA_LIMITS.maxCells) {
    throw new Error(`${label}超过 ${DATA_LIMITS.maxCells} 个单元格，请先精简表格。`);
  }

  return rows;
}

function assertSheetRange(ref, sheetName) {
  if (!ref || !window.XLSX?.utils?.decode_range) {
    return;
  }

  const range = XLSX.utils.decode_range(ref);
  const rows = range.e.r - range.s.r + 1;
  const columns = range.e.c - range.s.c + 1;
  const cells = rows * columns;

  if (
    rows > DATA_LIMITS.maxRows ||
    columns > DATA_LIMITS.maxColumns ||
    cells > DATA_LIMITS.maxCells
  ) {
    throw new Error(
      `工作表「${sheetName}」过大（${rows} 行 × ${columns} 列），请先精简到 ${DATA_LIMITS.maxRows} 行、${DATA_LIMITS.maxColumns} 列以内。`,
    );
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let index = 0;
  let cellCount = 0;

  function pushRow(nextRow) {
    if (nextRow.length > DATA_LIMITS.maxColumns) {
      throw new Error(`CSV 超过 ${DATA_LIMITS.maxColumns} 列，请先删除无关列。`);
    }
    if (rows.length >= DATA_LIMITS.maxRows) {
      throw new Error(`CSV 超过 ${DATA_LIMITS.maxRows} 行，请先精简数据范围。`);
    }
    cellCount += nextRow.length;
    if (cellCount > DATA_LIMITS.maxCells) {
      throw new Error(`CSV 超过 ${DATA_LIMITS.maxCells} 个单元格，请先精简表格。`);
    }
    rows.push(nextRow);
  }

  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  while (index < text.length) {
    const char = text[index];

    if (inQuotes) {
      if (char === "\"") {
        if (text[index + 1] === "\"") {
          field += "\"";
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      pushRow(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      if (text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      pushRow(row);
      row = [];
      field = "";
    } else {
      field += char;
    }

    index += 1;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    pushRow(row);
  }

  return rows;
}

function parsePastedTable(text) {
  const source = cellText(text);
  if (!source) {
    throw new Error("请先粘贴表格数据。");
  }
  if (source.length > DATA_LIMITS.maxPasteChars) {
    throw new Error(`粘贴内容超过 ${DATA_LIMITS.maxPasteChars} 个字符，请改用文件上传或先精简数据。`);
  }

  if (source.includes("\t")) {
    return assertTableSize(source
      .split(/\r?\n/)
      .filter((line) => cellText(line))
      .map((line) => line.split("\t").map(cellText)), "粘贴数据");
  }

  return assertTableSize(parseCsv(source), "粘贴数据");
}

async function parseFile(file) {
  if (file.size > DATA_LIMITS.maxFileBytes) {
    throw new Error(`文件超过 ${Math.round(DATA_LIMITS.maxFileBytes / 1024 / 1024)}MB，请先精简。`);
  }

  const extension = file.name.split(".").pop().toLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    await ensureExternalLibrary("xlsx");
  }

  const buffer = await file.arrayBuffer();
  return parseBuffer(buffer, extension);
}

function parseBuffer(buffer, extension) {
  if (extension === "csv") {
    return assertTableSize(parseCsv(decodeText(buffer)), "CSV");
  }

  if (extension === "xlsx" || extension === "xls") {
    if (!window.XLSX) {
      throw new Error("Excel 解析库未加载，请稍后重试。");
    }

    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Excel 文件中没有可读取的工作表。");
    }

    const sheet = workbook.Sheets[firstSheetName];
    assertSheetRange(sheet["!ref"], firstSheetName);
    return assertTableSize(XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    }), "Excel 工作表");
  }

  throw new Error("目前只支持 CSV、XLS、XLSX 文件。");
}

function analyzeRawRow(row) {
  const values = row.map(cellText);
  const nonEmptyValues = values.filter(Boolean);
  const nonEmptyCount = nonEmptyValues.length;
  const numericCount = nonEmptyValues.filter(isNumericLike).length;
  const textCount = nonEmptyCount - numericCount;
  const rowText = nonEmptyValues.join(" ").toLowerCase();
  const keywordCount = HEADER_KEYWORDS.filter((keyword) => rowText.includes(keyword.toLowerCase())).length;

  return {
    nonEmptyCount,
    numericCount,
    textCount,
    keywordCount,
    numericRatio: nonEmptyCount ? numericCount / nonEmptyCount : 0,
  };
}

function guessHeaderAndDataRows(rows) {
  const fallback = {
    success: false,
    headerRow: 1,
    dataStartRow: 2,
    message: "未识别出表头和数据起始行，请按预览填写。",
  };

  const analyses = rows.slice(0, 100).map(analyzeRawRow);
  let best = null;

  analyses.forEach((headerInfo, headerIndex) => {
    const headerNonEmpty = headerInfo.nonEmptyCount;
    if (
      headerNonEmpty < 2 ||
      headerInfo.textCount < 1 ||
      headerInfo.numericRatio >= 0.7
    ) {
      return;
    }

    const maxDataIndex = Math.min(headerIndex + 31, analyses.length);
    for (let dataIndex = headerIndex + 1; dataIndex < maxDataIndex; dataIndex += 1) {
      const dataInfo = analyses[dataIndex];
      const dataNonEmpty = dataInfo.nonEmptyCount;
      if (
        dataNonEmpty < 2 ||
        dataInfo.numericCount < 2 ||
        dataInfo.numericRatio < 0.5
      ) {
        continue;
      }

      const distance = dataIndex - headerIndex;
      const columnGap = Math.abs(headerNonEmpty - dataNonEmpty);
      let score = 0;
      score += headerInfo.keywordCount * 5;
      score += headerInfo.textCount * 1.5;
      score += dataInfo.numericRatio * 8;
      score += Math.max(0, 4 - columnGap);
      score -= distance * 0.08;

      if (!best || score > best.score) {
        best = {
          score,
          headerRow: headerIndex + 1,
          dataStartRow: dataIndex + 1,
        };
      }
      break;
    }
  });

  if (!best || best.score < 7) {
    return fallback;
  }

  return {
    success: true,
    headerRow: best.headerRow,
    dataStartRow: best.dataStartRow,
    message: "已识别表头行和数据起始行。必要时可修改。",
  };
}

function makeUniqueColumns(row) {
  const seen = new Map();

  return row.map((value, index) => {
    let name = cellText(value);
    if (!name || name.toLowerCase().startsWith("unnamed")) {
      name = `Column_${index + 1}`;
    }

    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name}_${count + 1}`;
  });
}

function loadDataFromRawRows(headerRow, dataStartRow, dataEndRow) {
  if (!state.rawRows.length) {
    throw new Error("请先选择 CSV / Excel 文件。");
  }

  if (dataStartRow <= headerRow) {
    throw new Error("数据起始行必须在表头行之后。");
  }

  if (dataEndRow !== null && dataEndRow < dataStartRow) {
    throw new Error("数据结束行不能早于数据起始行。");
  }

  const headerIndex = headerRow - 1;
  const header = state.rawRows[headerIndex];
  if (!header) {
    throw new Error("找不到表头行，请检查行号。");
  }

  let columns = makeUniqueColumns(header);
  const startIndex = dataStartRow - 1;
  const endIndex = dataEndRow === null ? state.rawRows.length : dataEndRow;
  const sourceRows = state.rawRows.slice(startIndex, endIndex);

  let data = sourceRows.map((row) => {
    const item = {};
    columns.forEach((column, index) => {
      item[column] = cellText(row[index]);
    });
    return item;
  });

  data = data.filter((row) => columns.some((column) => cellText(row[column]) !== ""));
  if (!data.length) {
    throw new Error("数据范围内没有可读取的数据。");
  }

  columns = columns.filter((column) => data.some((row) => cellText(row[column]) !== ""));
  data = data.map((row) => {
    const item = {};
    columns.forEach((column) => {
      item[column] = row[column];
    });
    return item;
  });

  const numericColumns = columns.filter((column) => data.some((row) => Number.isFinite(toNumber(row[column]))));

  return { columns, data, numericColumns };
}
