"use strict";

function calcRSquared(yTrue, yPred) {
  const mean = yTrue.reduce((sum, value) => sum + value, 0) / yTrue.length;
  const ssRes = yTrue.reduce((sum, value, index) => sum + ((value - yPred[index]) ** 2), 0);
  const ssTot = yTrue.reduce((sum, value) => sum + ((value - mean) ** 2), 0);

  if (ssTot === 0) {
    return ssRes === 0 ? 1 : 0;
  }

  return 1 - (ssRes / ssTot);
}

function calcAllFitMetrics(yTrue, yPred) {
  const residual = yTrue.map((value, index) => value - yPred[index]);
  const absResidual = residual.map(Math.abs);
  const mse = residual.reduce((sum, value) => sum + (value ** 2), 0) / residual.length;
  const rmse = Math.sqrt(mse);
  const mae = absResidual.reduce((sum, value) => sum + value, 0) / absResidual.length;
  const maxAbsError = Math.max(...absResidual);
  const residualMean = residual.reduce((sum, value) => sum + value, 0) / residual.length;
  const residualStd = residual.length >= 2
    ? Math.sqrt(residual.reduce((sum, value) => sum + ((value - residualMean) ** 2), 0) / (residual.length - 1))
    : 0;

  return {
    r2: calcRSquared(yTrue, yPred),
    mse,
    rmse,
    mae,
    max_abs_error: maxAbsError,
    residual_mean: residualMean,
    residual_std: residualStd,
  };
}

function describeFitQuality(metrics) {
  if (!metrics || !Number.isFinite(metrics.r2)) {
    return "";
  }
  if (metrics.r2 >= 0.99) {
    return "拟合度很高，请仍结合实验原理判断。";
  }
  if (metrics.r2 >= 0.95) {
    return "拟合度较高，建议同时查看残差和实验原理。";
  }
  if (metrics.r2 >= 0.85) {
    return "拟合度一般，建议检查模型选择或异常点。";
  }
  return "拟合度偏低，建议先查看散点分布。";
}

function formatLinearEquation(a, b) {
  return b >= 0
    ? `y = ${a.toFixed(4)}x + ${b.toFixed(4)}`
    : `y = ${a.toFixed(4)}x - ${Math.abs(b).toFixed(4)}`;
}

function formatQuadraticEquation(a, b, c) {
  let equation = `y = ${a.toFixed(4)}x²`;
  equation += b >= 0 ? ` + ${b.toFixed(4)}x` : ` - ${Math.abs(b).toFixed(4)}x`;
  equation += c >= 0 ? ` + ${c.toFixed(4)}` : ` - ${Math.abs(c).toFixed(4)}`;
  return equation;
}

function linspace(min, max, count) {
  if (count <= 1) {
    return [min];
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => min + (step * index));
}

function linearFit(pairs) {
  if (pairs.length < 2) {
    throw new Error("一次线性拟合至少需要 2 个有效数据点。");
  }

  const uniqueX = new Set(pairs.map((point) => point.x));
  if (uniqueX.size < 2) {
    throw new Error("X 轴数据至少需要两个不同的数值，才能进行一次线性拟合。");
  }

  const n = pairs.length;
  const sumX = pairs.reduce((sum, point) => sum + point.x, 0);
  const sumY = pairs.reduce((sum, point) => sum + point.y, 0);
  const sumXY = pairs.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sumX2 = pairs.reduce((sum, point) => sum + (point.x ** 2), 0);
  const denominator = (n * sumX2) - (sumX ** 2);
  const a = ((n * sumXY) - (sumX * sumY)) / denominator;
  const b = (sumY - (a * sumX)) / n;
  const yPred = pairs.map((point) => (a * point.x) + b);
  const xFit = linspace(Math.min(...pairs.map((point) => point.x)), Math.max(...pairs.map((point) => point.x)), 200);

  return {
    type: "linear",
    a,
    b,
    c: null,
    yPred,
    allMetrics: calcAllFitMetrics(pairs.map((point) => point.y), yPred),
    fitPoints: xFit.map((x) => ({ x, y: (a * x) + b })),
    equation: formatLinearEquation(a, b),
  };
}

function solveLinearSystem(matrix, vector) {
  const size = vector.length;
  const augmented = matrix.map((row, index) => row.concat(vector[index]));

  for (let pivot = 0; pivot < size; pivot += 1) {
    let maxRow = pivot;
    for (let row = pivot + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][pivot]) > Math.abs(augmented[maxRow][pivot])) {
        maxRow = row;
      }
    }

    if (Math.abs(augmented[maxRow][pivot]) < 1e-12) {
      throw new Error("二次拟合失败：数据矩阵不可逆，请检查 X 轴数据。");
    }

    [augmented[pivot], augmented[maxRow]] = [augmented[maxRow], augmented[pivot]];

    const pivotValue = augmented[pivot][pivot];
    for (let col = pivot; col <= size; col += 1) {
      augmented[pivot][col] /= pivotValue;
    }

    for (let row = 0; row < size; row += 1) {
      if (row === pivot) {
        continue;
      }
      const factor = augmented[row][pivot];
      for (let col = pivot; col <= size; col += 1) {
        augmented[row][col] -= factor * augmented[pivot][col];
      }
    }
  }

  return augmented.map((row) => row[size]);
}

function quadraticFit(pairs) {
  if (pairs.length < 3) {
    throw new Error("二次拟合至少需要 3 个有效数据点。");
  }

  const uniqueX = new Set(pairs.map((point) => point.x));
  if (uniqueX.size < 3) {
    throw new Error("X 轴数据至少需要三个不同的数值，才能进行二次拟合。");
  }

  const n = pairs.length;
  const sx = pairs.reduce((sum, point) => sum + point.x, 0);
  const sx2 = pairs.reduce((sum, point) => sum + (point.x ** 2), 0);
  const sx3 = pairs.reduce((sum, point) => sum + (point.x ** 3), 0);
  const sx4 = pairs.reduce((sum, point) => sum + (point.x ** 4), 0);
  const sy = pairs.reduce((sum, point) => sum + point.y, 0);
  const sxy = pairs.reduce((sum, point) => sum + (point.x * point.y), 0);
  const sx2y = pairs.reduce((sum, point) => sum + ((point.x ** 2) * point.y), 0);

  const [a, b, c] = solveLinearSystem(
    [
      [sx4, sx3, sx2],
      [sx3, sx2, sx],
      [sx2, sx, n],
    ],
    [sx2y, sxy, sy],
  );

  const yPred = pairs.map((point) => (a * (point.x ** 2)) + (b * point.x) + c);
  const xFit = linspace(Math.min(...pairs.map((point) => point.x)), Math.max(...pairs.map((point) => point.x)), 300);

  return {
    type: "quadratic",
    a,
    b,
    c,
    yPred,
    allMetrics: calcAllFitMetrics(pairs.map((point) => point.y), yPred),
    fitPoints: xFit.map((x) => ({ x, y: (a * (x ** 2)) + (b * x) + c })),
    equation: formatQuadraticEquation(a, b, c),
  };
}

function autoTitle(title, xLabel, yLabel) {
  const cleaned = cellText(title);
  if (!cleaned || cleaned.toLowerCase() === "x-y curve") {
    return `${yLabel} vs ${xLabel}`;
  }
  return cleaned;
}

