import React, { useRef, useState, useEffect } from 'react';
import { Square, Circle, Eraser, Trash2, Download, Save, Palette } from 'lucide-react';
import { VirtualFile } from '../../types';

export const PaintApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#0078d4');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  
  // Track last coordinates for drawing smooth lines
  const lastX = useRef(0);
  const lastY = useRef(0);

  const colors = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#ffffff', '#c3c3c3', '#b5e61d', '#96c2f1', '#ffc90e', '#efe4b0', '#16a085', '#2ecc71', '#3498db', '#9b59b6'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to parent client dimensions
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = (rect?.width || 600) - 16;
    canvas.height = (rect?.height || 400) - 76;

    // Set canvas initial background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    
    // Get mouse/touch coordinates relative to canvas
    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      }
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    lastX.current = x;
    lastY.current = y;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    // Prevent scrolling on touch screens
    if ('touches' in e) {
      e.preventDefault();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x = 0;
    let y = 0;

    if ('touches' in e) {
      if (e.touches.length > 0) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      }
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastX.current = x;
    lastY.current = y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  // Export paint to standard browser download
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'my-painting.png';
    link.href = dataUrl;
    link.click();
  };

  // Save to WebOS Virtual File System
  const handleSaveToVfs = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    const fileName = prompt('Enter a name for your drawing (saved in Pictures):', 'painting.png');
    if (!fileName) return;

    let sanitizedName = fileName.trim();
    if (!sanitizedName.endsWith('.png')) {
      sanitizedName += '.png';
    }

    try {
      const stored = localStorage.getItem('webos_files');
      let files: VirtualFile[] = stored ? JSON.parse(stored) : [];

      const existingIndex = files.findIndex(
        f => f.name.toLowerCase() === sanitizedName.toLowerCase() && f.path === 'Pictures'
      );

      const newFile: VirtualFile = {
        name: sanitizedName,
        path: 'Pictures',
        content: dataUrl, // Save base64 image string as content
        type: 'image',
        createdAt: new Date().toISOString()
      };

      if (existingIndex > -1) {
        files[existingIndex] = newFile;
      } else {
        files.push(newFile);
      }

      localStorage.setItem('webos_files', JSON.stringify(files));
      window.dispatchEvent(new Event('webos_fs_updated'));
      alert(`Drawing saved successfully to virtual "Pictures" folder as "${sanitizedName}"!`);
    } catch (e) {
      console.error(e);
      alert('Failed to save drawing. Image is likely too large for LocalStorage limits.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] text-gray-800 font-sans" id="paint-app">
      {/* Paint Tool controls toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#e0e3e7] border-b border-gray-300 px-4 py-2 select-none text-xs">
        {/* Color Palette */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-none no-scrollbar">
          <Palette className="w-4 h-4 text-gray-600 shrink-0 mr-1" />
          <div className="grid grid-cols-10 gap-0.5 shrink-0">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool('brush');
                }}
                className={`w-4.5 h-4.5 border rounded-sm transition-transform ${
                  color === c && tool === 'brush' ? 'scale-110 ring-1 ring-blue-500 border-white' : 'border-gray-400'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
          {/* Custom color input */}
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setTool('brush');
            }}
            className="w-6 h-6 border border-gray-400 rounded-md cursor-pointer shrink-0 ml-1.5"
            title="Custom Color"
          />
        </div>

        {/* Brush Controls & Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded p-0.5">
            <button
              onClick={() => setTool('brush')}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                tool === 'brush' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
              id="paint-tool-brush"
            >
              Brush
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                tool === 'eraser' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'
              }`}
              id="paint-tool-eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-600 font-medium">Size:</span>
            <input
              type="range"
              min="1"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20 accent-blue-600 h-1.5 rounded-lg bg-gray-300"
              id="paint-size-slider"
            />
            <span className="w-5 text-right font-mono text-[10px] text-gray-500">{brushSize}px</span>
          </div>
        </div>

        {/* Global Save/Clear Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 bg-white hover:bg-red-50 hover:text-red-600 rounded text-gray-700 transition-colors font-medium"
            id="paint-btn-clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleSaveToVfs}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium shadow-sm"
            id="paint-btn-save-vfs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save App</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 p-1.5 hover:bg-gray-200 border border-transparent rounded text-gray-700 transition-colors"
            title="Download PNG to PC"
            id="paint-btn-download"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Canvas */}
      <div className="flex-1 p-2 bg-gray-100 overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-white rounded border border-gray-300 cursor-crosshair shadow-sm touch-none"
          id="paint-canvas-element"
        />
      </div>
    </div>
  );
};
