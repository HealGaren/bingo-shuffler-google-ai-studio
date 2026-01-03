
import React, { useState, useRef } from 'react';
import { BingoSize, GridConfig, CellMapping } from './types';
import { loadImage, shuffleArray } from './utils/imageUtils';
import { GridEditor } from './components/GridEditor';
import { BingoBoard } from './components/BingoBoard';

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    size: 5,
    rect: { x: 50, y: 50, width: 300, height: 300 }
  });
  const [mapping, setMapping] = useState<CellMapping[]>([]);
  const [isEditingGrid, setIsEditingGrid] = useState<boolean>(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeMapping = (size: BingoSize) => {
    const newMapping: CellMapping[] = [];
    for (let i = 0; i < size * size; i++) {
      newMapping.push({ currentPos: i, originalPos: i });
    }
    setMapping(newMapping);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const img = await loadImage(event.target.result as string);
        setImage(img);
        
        const minDim = Math.min(img.width, img.height);
        const gridW = minDim * 0.7;
        const gridH = minDim * 0.7;
        
        const newRect = {
          x: (img.width - gridW) / 2,
          y: (img.height - gridH) / 2,
          width: gridW,
          height: gridH
        };

        setGridConfig({ size: 5, rect: newRect });
        initializeMapping(5);
        setIsEditingGrid(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSizeChange = (newSize: BingoSize) => {
    setGridConfig(prev => ({ ...prev, size: newSize }));
    initializeMapping(newSize);
  };

  const handleShuffle = () => {
    const originalPositions = mapping.map(m => m.originalPos);
    const shuffled = shuffleArray(originalPositions);
    const newMapping = mapping.map((m, i) => ({
      ...m,
      originalPos: shuffled[i]
    }));
    setMapping(newMapping);
  };

  const handleSwap = (idxA: number, idxB: number) => {
    const newMapping = [...mapping];
    const temp = newMapping[idxA].originalPos;
    newMapping[idxA].originalPos = newMapping[idxB].originalPos;
    newMapping[idxB].originalPos = temp;
    setMapping(newMapping);
  };

  const downloadImage = () => {
    if (!image) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    const { rect, size } = gridConfig;
    const cellW = rect.width / size;
    const cellH = rect.height / size;

    mapping.forEach((m, i) => {
      const targetX = rect.x + (i % size) * cellW;
      const targetY = rect.y + Math.floor(i / size) * cellH;
      const sourceX = rect.x + (m.originalPos % size) * cellW;
      const sourceY = rect.y + Math.floor(m.originalPos / size) * cellH;

      ctx.drawImage(image, sourceX, sourceY, cellW, cellH, targetX, targetY, cellW, cellH);
    });

    const link = document.createElement('a');
    link.download = `bingo-shuffled-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#f0f2f5] pb-20">
      <header className="w-full bg-white shadow-sm py-4 px-6 mb-8 border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight hidden sm:block">Bingo Shuffler</h1>
          </div>
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors text-sm"
            >
              {image ? 'Change Image' : 'Upload Image'}
            </button>
            {!isEditingGrid && image && (
               <button
                  onClick={downloadImage}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-sm shadow-md"
                >
                  Download
                </button>
            )}
          </div>
        </div>
      </header>

      {image ? (
        <main className="w-full max-w-6xl px-4 flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-500 text-xs uppercase tracking-wider mr-2">Size:</span>
              {[3, 4, 5].map(s => (
                <button
                  key={s}
                  onClick={() => handleSizeChange(s as BingoSize)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all text-sm ${gridConfig.size === s ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  {s}x{s}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsEditingGrid(!isEditingGrid)}
                className={`flex-1 md:flex-none px-6 py-2 rounded-lg font-bold transition-all border-2 text-sm ${isEditingGrid ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
              >
                {isEditingGrid ? 'Confirm Grid Area' : 'Modify Grid Area'}
              </button>
              
              {!isEditingGrid && (
                <button
                  onClick={handleShuffle}
                  className="flex-1 md:flex-none px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-all text-sm shadow-md"
                >
                  Shuffle All
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            {isEditingGrid ? (
              <GridEditor
                image={image}
                size={gridConfig.size}
                rect={gridConfig.rect}
                onRectChange={(rect) => setGridConfig({ ...gridConfig, rect })}
              />
            ) : (
              <BingoBoard
                image={image}
                size={gridConfig.size}
                rect={gridConfig.rect}
                mapping={mapping}
                onSwap={handleSwap}
              />
            )}
          </div>
          
          <div className="text-center text-gray-400 text-xs mt-4">
            {isEditingGrid 
              ? "Position the grid over your bingo cells. Use one finger to move, two fingers to zoom." 
              : "Drag any cell to swap it with another. Press 'Shuffle' to randomize everything."}
          </div>
        </main>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center border-4 border-dashed border-gray-300 rounded-3xl w-full max-w-xl aspect-square sm:aspect-video text-gray-400 bg-white hover:bg-gray-50 hover:border-indigo-300 transition-all cursor-pointer mx-4 mt-10 group"
        >
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
            <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-600">Upload your Bingo image</p>
          <p className="text-sm text-gray-400 mt-2 px-8 text-center">Click here to select a 3x3, 4x4, or 5x5 bingo image from your device</p>
        </div>
      )}
      
      <footer className="mt-auto pt-10 text-gray-400 text-xs text-center px-4">
        © Bingo Shuffler Tool • Optimized for Mobile & Desktop • Works Offline
      </footer>
    </div>
  );
};

export default App;
