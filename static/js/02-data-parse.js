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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let index = 0;

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
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      if (text[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }

    index += 1;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

async function parseFile(file) {
  const buffer = await file.arrayBuffer();
  const extension = file.name.split(".").pop().toLowerCase();
  return parseBuffer(buffer, extension);
}

function parseBuffer(buffer, extension) {
  if (extension === "csv") {
    return parseCsv(decodeText(buffer));
  }

  if (extension === "xlsx" || extension === "xls") {
    if (!window.XLSX) {
      throw new Error("Excel 解析库未加载，请检查网络后刷新页面。");
    }

    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("Excel 文件中没有可读取的工作表。");
    }

    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
    });
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
    message: "暂未可靠识别表头和数据起始行，请根据预览手动填写。",
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
    message: "系统已自动猜测表头行和数据起始行，如不准确可手动修改。",
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
    throw new Error("请先上传 CSV / Excel 文件。");
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

