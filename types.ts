
export type BingoSize = 3 | 4 | 5;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridConfig {
  size: BingoSize;
  rect: Rect;
}

export interface CellMapping {
  currentPos: number; // 0 to (size*size - 1)
  originalPos: number; // 0 to (size*size - 1)
}
