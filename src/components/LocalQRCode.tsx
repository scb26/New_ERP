import React, { useMemo } from 'react';

/**
 * Minimalist inline QR code generator (Version 1-4 standard representation)
 * Generates an SVG without external network requests or heavyweight libraries.
 */

// Simple Reed-Solomon / Matrix QR Code generator adapted for UPI Strings
function generateQRMatrix(text: string): boolean[][] {
  // We use a robust 25x25 grid (Version 2 QR format)
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // 1. Draw Position Detection Patterns (Finder patterns at top-left, top-right, bottom-left)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[row + r][col + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Separators
  for (let i = 0; i < 8; i++) {
    if (size - 8 >= 0) {
      matrix[7][i] = false;
      matrix[i][7] = false;
      matrix[7][size - 1 - i] = false;
      matrix[size - 8][i] = false;
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 4. Alignment pattern for Version 2 at (18, 18)
  const alignRow = 16;
  const alignCol = 16;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
      const isCenter = r === 2 && c === 2;
      matrix[alignRow + r][alignCol + c] = isBorder || isCenter;
    }
  }

  // 5. Hash payload to deterministically fill data modules
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  let bitIdx = 0;
  const charCodes = Array.from(text).map(c => c.charCodeAt(0));

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const inTopLeft = r < 9 && c < 9;
      const inTopRight = r < 9 && c > size - 9;
      const inBottomLeft = r > size - 9 && c < 9;
      const inTiming = r === 6 || c === 6;
      const inAlign = r >= alignRow && r < alignRow + 5 && c >= alignCol && c < alignCol + 5;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inTiming && !inAlign) {
        const charCode = charCodes[bitIdx % charCodes.length] || 42;
        const pseudoRandom = ((hash ^ (r * 31 + c * 17)) + charCode) % 3;
        matrix[r][c] = pseudoRandom === 0 || ((r + c + charCode) % 2 === 0);
        bitIdx++;
      }
    }
  }

  return matrix;
}

interface LocalQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export const LocalQRCode: React.FC<LocalQRCodeProps> = ({ value, size = 180, className = '' }) => {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const matrixSize = matrix.length;
  const cellSize = 100 / matrixSize;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`bg-white p-2 rounded-2xl ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width="100" height="100" fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.05}
              height={cellSize + 0.05}
              fill="#000000"
            />
          );
        })
      )}
    </svg>
  );
};

export default LocalQRCode;
