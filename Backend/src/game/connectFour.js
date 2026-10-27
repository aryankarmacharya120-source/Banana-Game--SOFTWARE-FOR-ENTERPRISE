/**
 * Pure Connect Four rules engine (no I/O) so it is trivially unit-testable.
 * Board is an array of ROWS arrays; row 0 is the TOP. Cells: null | 'red' | 'yellow'.
 */
export const ROWS = 6;
export const COLS = 7;

export const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

/** Drops a disc. Returns { row } or { error }. Does not mutate on error. */
export function dropDisc(board, col, color) {
  if (!Number.isInteger(col) || col < 0 || col >= COLS) return { error: 'Invalid column' };
  for (let row = ROWS - 1; row >= 0; row--) {
    if (!board[row][col]) {
      board[row][col] = color;
      return { row };
    }
  }
  return { error: 'Column is full' };
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/** Returns the winning cells [[r,c]...] for the disc at (row,col), or null. */
export function findWin(board, row, col) {
  const color = board[row][col];
  if (!color) return null;
  for (const [dr, dc] of DIRECTIONS) {
    const cells = [[row, col]];
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === color) {
        cells.push([r, c]);
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (cells.length >= 4) return cells;
  }
  return null;
}

export const isDraw = (board) => board[0].every(Boolean);
