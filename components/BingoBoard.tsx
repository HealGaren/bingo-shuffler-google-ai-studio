
import React, { useRef, useEffect, useState } from 'react';
import { Rect, BingoSize, CellMapping } from '../types';
import { isPointInRect, getCellRect } from '../utils/imageUtils';

interface BingoBoardProps {
  image: HTMLImageElement;
  size: BingoSize;
  rect: Rect;
  mapping: CellMapping[];
  onSwap: (idxA: number, idxB: number) => void;
}

export const BingoBoard: React.FC<BingoBoardProps> = ({ image, size, rect, mapping, onSwap }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const getCanvasMousePos = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const bRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / bRect.width;
    const scaleY = canvas.height / bRect.height;
    return {
      x: (clientX - bRect.left) * scaleX,
      y: (clientY - bRect.top) * scaleY
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    const cellW = rect.width / size;
    const cellH = rect.height / size;

    mapping.forEach((m, i) => {
      if (draggedIdx === i) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(rect.x + (i % size) * cellW, rect.y + Math.floor(i / size) * cellH, cellW, cellH);
        return;
      }

      const targetX = rect.x + (i % size) * cellW;
      const targetY = rect.y + Math.floor(i / size) * cellH;
      const sourceX = rect.x + (m.originalPos % size) * cellW;
      const sourceY = rect.y + Math.floor(m.originalPos / size) * cellH;

      ctx.drawImage(image, sourceX, sourceY, cellW, cellH, targetX, targetY, cellW, cellH);
      
      if (hoverIdx === i) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 6;
        ctx.strokeRect(targetX + 3, targetY + 3, cellW - 6, cellH - 6);
      }
    });

    if (draggedIdx !== null) {
      const m = mapping[draggedIdx];
      const sourceX = rect.x + (m.originalPos % size) * cellW;
      const sourceY = rect.y + Math.floor(m.originalPos / size) * cellH;

      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.globalAlpha = 0.9;
      // Center the cell on drag point
      ctx.drawImage(image, sourceX, sourceY, cellW, cellH, dragPos.x - cellW / 2, dragPos.y - cellH / 2, cellW, cellH);
      ctx.restore();
    }
  }, [image, rect, size, mapping, draggedIdx, hoverIdx, dragPos]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getCanvasMousePos(e.clientX, e.clientY);
    for (let i = 0; i < size * size; i++) {
      const cellRect = getCellRect(rect, size, i);
      if (isPointInRect(pos.x, pos.y, cellRect)) {
        setDraggedIdx(i);
        setDragPos(pos);
        (e.target as Element).setPointerCapture(e.pointerId);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggedIdx === null) return;
    const pos = getCanvasMousePos(e.clientX, e.clientY);
    setDragPos(pos);
    
    let foundHover = null;
    for (let i = 0; i < size * size; i++) {
      const cellRect = getCellRect(rect, size, i);
      if (isPointInRect(pos.x, pos.y, cellRect)) {
        foundHover = i;
        break;
      }
    }
    setHoverIdx(foundHover);
  };

  const handlePointerUp = () => {
    if (draggedIdx !== null && hoverIdx !== null && draggedIdx !== hoverIdx) {
      onSwap(draggedIdx, hoverIdx);
    }
    setDraggedIdx(null);
    setHoverIdx(null);
  };

  return (
    <div className="relative border-4 border-white rounded-3xl overflow-hidden bg-white shadow-2xl max-w-full">
      <div className="overflow-auto max-h-[70vh] flex items-center justify-center p-4 bg-gray-100">
        <canvas
          ref={canvasRef}
          width={image.width}
          height={image.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="block mx-auto touch-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: draggedIdx !== null ? 'none' : 'auto' }}
        />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg pointer-events-none backdrop-blur-sm border border-white/20 whitespace-nowrap">
        Drag & Drop to Swap Cells
      </div>
    </div>
  );
};
