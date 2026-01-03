
import { Rect, BingoSize } from '../types';

export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const getCellRect = (gridRect: Rect, size: BingoSize, index: number): Rect => {
  const cellWidth = gridRect.width / size;
  const cellHeight = gridRect.height / size;
  const row = Math.floor(index / size);
  const col = index % size;
  
  return {
    x: gridRect.x + col * cellWidth,
    y: gridRect.y + row * cellHeight,
    width: cellWidth,
    height: cellHeight
  };
};

export const isPointInRect = (px: number, py: number, rect: Rect): boolean => {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
};

export const shuffleArray = <T,>(array: T[]): T[] => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};
