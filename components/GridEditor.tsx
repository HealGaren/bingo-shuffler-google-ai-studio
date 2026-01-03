
import React, { useRef, useEffect, useState } from 'react';
import { Rect, BingoSize } from '../types';

interface GridEditorProps {
  image: HTMLImageElement;
  size: BingoSize;
  rect: Rect;
  onRectChange: (rect: Rect) => void;
}

export const GridEditor: React.FC<GridEditorProps> = ({ image, size, rect, onRectChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'resize-br' | 'pinch' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [activePointers, setActivePointers] = useState<Map<number, { x: number, y: number }>>(new Map());
  const [initialPinchDist, setInitialPinchDist] = useState<number | null>(null);
  const [initialRectSize, setInitialRectSize] = useState<{ w: number, h: number } | null>(null);

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

  const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Darken outer area
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.fill('evenodd');

    // Draw Grid
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    const cellW = rect.width / size;
    const cellH = rect.height / size;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < size; i++) {
      ctx.moveTo(rect.x + i * cellW, rect.y);
      ctx.lineTo(rect.x + i * cellW, rect.y + rect.height);
      ctx.moveTo(rect.x, rect.y + i * cellH);
      ctx.lineTo(rect.x + rect.width, rect.y + i * cellH);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Resize Handle (bottom right)
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(rect.x + rect.width, rect.y + rect.height, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [image, rect, size]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getCanvasMousePos(e.clientX, e.clientY);
    // Explicitly typed new Map constructor to avoid type inference issues with values()
    const newPointers = new Map<number, { x: number, y: number }>(activePointers);
    newPointers.set(e.pointerId, pos);
    setActivePointers(newPointers);

    if (newPointers.size === 1) {
      const isNearHandle = Math.abs(pos.x - (rect.x + rect.width)) < 30 && Math.abs(pos.y - (rect.y + rect.height)) < 30;
      if (isNearHandle) {
        setDragMode('resize-br');
      } else if (pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height) {
        setDragMode('move');
      } else {
        // Only start new selection if user isn't just trying to scroll
        // On mobile, we might want to ignore single taps outside the rect to allow scrolling
        return; 
      }
      setStartPos(pos);
      setIsDragging(true);
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (newPointers.size === 2) {
      // Pinch to zoom initialization
      setDragMode('pinch');
      const pts = Array.from(newPointers.values());
      // Explicit check to ensure we have two points for getDistance
      if (pts.length >= 2) {
        setInitialPinchDist(getDistance(pts[0], pts[1]));
        setInitialRectSize({ w: rect.width, h: rect.height });
        setIsDragging(true);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const pos = getCanvasMousePos(e.clientX, e.clientY);
    // Explicitly typed new Map constructor to avoid type inference issues with values()
    const newPointers = new Map<number, { x: number, y: number }>(activePointers);
    if (!newPointers.has(e.pointerId)) return;
    newPointers.set(e.pointerId, pos);
    setActivePointers(newPointers);

    if (!isDragging) return;

    if (dragMode === 'move' && newPointers.size === 1) {
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;
      onRectChange({ ...rect, x: rect.x + dx, y: rect.y + dy });
      setStartPos(pos);
    } else if (dragMode === 'resize-br' && newPointers.size === 1) {
      const dx = pos.x - startPos.x;
      const dy = pos.y - startPos.y;
      onRectChange({ ...rect, width: Math.max(40, rect.width + dx), height: Math.max(40, rect.height + dy) });
      setStartPos(pos);
    } else if (dragMode === 'pinch' && newPointers.size === 2 && initialPinchDist && initialRectSize) {
      const pts = Array.from(newPointers.values());
      // Explicit check to ensure we have two points for getDistance
      if (pts.length >= 2) {
        const currentDist = getDistance(pts[0], pts[1]);
        const scale = currentDist / initialPinchDist;
        
        const newWidth = Math.max(40, initialRectSize.w * scale);
        const newHeight = Math.max(40, initialRectSize.h * scale);
        
        // Scale from center of rect
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        
        onRectChange({
          x: centerX - newWidth / 2,
          y: centerY - newHeight / 2,
          width: newWidth,
          height: newHeight
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Explicitly typed new Map constructor to avoid type inference issues with values()
    const newPointers = new Map<number, { x: number, y: number }>(activePointers);
    newPointers.delete(e.pointerId);
    setActivePointers(newPointers);

    if (newPointers.size === 0) {
      setIsDragging(false);
      setDragMode(null);
      setInitialPinchDist(null);
      setInitialRectSize(null);
    } else if (newPointers.size === 1) {
      // If we dropped one finger, we stop pinching but might not immediately switch back to move
      setDragMode(null);
    }
  };

  return (
    <div className="relative border-4 border-white rounded-3xl overflow-hidden bg-gray-300 shadow-2xl max-w-full">
      <div className="overflow-auto max-h-[70vh] flex items-center justify-center p-4 bg-gray-800">
        <canvas
          ref={canvasRef}
          width={image.width}
          height={image.height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="shadow-2xl cursor-move touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="absolute top-4 left-4 bg-indigo-600/90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg pointer-events-none backdrop-blur-sm border border-white/20">
        Adjust Grid Area (Move / Resize / Pinch Zoom)
      </div>
    </div>
  );
};
