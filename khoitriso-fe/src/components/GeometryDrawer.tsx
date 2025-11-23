'use client';

import React, { useState, useRef, useEffect } from 'react';

interface GeometryDrawerProps {
  onSave: (imageUrl: string) => void;
  onClose: () => void;
}

type Tool = 'select' | 'point' | 'line' | 'circle' | 'rectangle' | 'triangle' | 'arrow' | 'text';

interface Shape {
  id: string;
  type: Tool;
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  color: string;
  text?: string;
}

export default function GeometryDrawer({ onSave, onClose }: GeometryDrawerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('line');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [color, setColor] = useState('#000000');
  const [showGrid, setShowGrid] = useState(true);

  const canvasWidth = 800;
  const canvasHeight = 600;

  useEffect(() => {
    redrawCanvas();
  }, [shapes, showGrid]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1;
      const gridSize = 50;

      for (let i = 0; i <= canvasWidth; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvasHeight);
        ctx.stroke();
      }

      for (let i = 0; i <= canvasHeight; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvasWidth, i);
        ctx.stroke();
      }
    }

    // Draw all shapes
    shapes.forEach(shape => drawShape(ctx, shape));
  };

  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.strokeStyle = shape.color;
    ctx.fillStyle = shape.color;
    ctx.lineWidth = 2;

    switch (shape.type) {
      case 'point':
        ctx.beginPath();
        ctx.arc(shape.startX, shape.startY, 4, 0, 2 * Math.PI);
        ctx.fill();
        break;

      case 'line':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          ctx.beginPath();
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          const headlen = 15;
          const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);

          ctx.beginPath();
          ctx.moveTo(shape.startX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(shape.endX, shape.endY);
          ctx.lineTo(
            shape.endX - headlen * Math.cos(angle - Math.PI / 6),
            shape.endY - headlen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            shape.endX - headlen * Math.cos(angle + Math.PI / 6),
            shape.endY - headlen * Math.sin(angle + Math.PI / 6)
          );
          ctx.lineTo(shape.endX, shape.endY);
          ctx.fill();
        }
        break;

      case 'circle':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          const radius = Math.sqrt(
            Math.pow(shape.endX - shape.startX, 2) + Math.pow(shape.endY - shape.startY, 2)
          );
          ctx.beginPath();
          ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          ctx.strokeRect(
            shape.startX,
            shape.startY,
            shape.endX - shape.startX,
            shape.endY - shape.startY
          );
        }
        break;

      case 'triangle':
        if (shape.endX !== undefined && shape.endY !== undefined) {
          const midX = (shape.startX + shape.endX) / 2;
          ctx.beginPath();
          ctx.moveTo(midX, shape.startY);
          ctx.lineTo(shape.endX, shape.endY);
          ctx.lineTo(shape.startX, shape.endY);
          ctx.closePath();
          ctx.stroke();
        }
        break;

      case 'text':
        if (shape.text) {
          ctx.font = '16px Arial';
          ctx.fillText(shape.text, shape.startX, shape.startY);
        }
        break;
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (tool === 'text') {
      const text = prompt('Nhập văn bản:');
      if (text) {
        setShapes([...shapes, {
          id: `shape-${Date.now()}`,
          type: 'text',
          startX: pos.x,
          startY: pos.y,
          color,
          text,
        }]);
      }
      return;
    }

    if (tool === 'point') {
      setShapes([...shapes, {
        id: `shape-${Date.now()}`,
        type: 'point',
        startX: pos.x,
        startY: pos.y,
        color,
      }]);
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getMousePos(e);

    // Redraw everything
    redrawCanvas();

    // Draw temporary shape
    const tempShape: Shape = {
      id: 'temp',
      type: tool,
      startX: startPos.x,
      startY: startPos.y,
      endX: pos.x,
      endY: pos.y,
      color,
    };
    drawShape(ctx, tempShape);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    const newShape: Shape = {
      id: `shape-${Date.now()}`,
      type: tool,
      startX: startPos.x,
      startY: startPos.y,
      endX: pos.x,
      endY: pos.y,
      color,
    };

    setShapes([...shapes, newShape]);
    setIsDrawing(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL('image/png', 1.0);
    onSave(dataURL);
  };

  const clearCanvas = () => {
    if (confirm('Xóa tất cả hình vẽ?')) {
      setShapes([]);
    }
  };

  const undo = () => {
    if (shapes.length > 0) {
      setShapes(shapes.slice(0, -1));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Vẽ hình học</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => setTool('point')}
                className={`px-3 py-2 rounded text-sm ${tool === 'point' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Điểm"
              >
                ⚫ Điểm
              </button>
              <button
                onClick={() => setTool('line')}
                className={`px-3 py-2 rounded text-sm ${tool === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Đường thẳng"
              >
                ─ Đường
              </button>
              <button
                onClick={() => setTool('arrow')}
                className={`px-3 py-2 rounded text-sm ${tool === 'arrow' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Mũi tên"
              >
                → Mũi tên
              </button>
            </div>

            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => setTool('circle')}
                className={`px-3 py-2 rounded text-sm ${tool === 'circle' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Hình tròn"
              >
                ⭕ Tròn
              </button>
              <button
                onClick={() => setTool('rectangle')}
                className={`px-3 py-2 rounded text-sm ${tool === 'rectangle' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Hình chữ nhật"
              >
                ▭ HCN
              </button>
              <button
                onClick={() => setTool('triangle')}
                className={`px-3 py-2 rounded text-sm ${tool === 'triangle' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Tam giác"
              >
                △ Tam giác
              </button>
            </div>

            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => setTool('text')}
                className={`px-3 py-2 rounded text-sm ${tool === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Văn bản"
              >
                A Nhãn
              </button>
            </div>

            <div className="flex gap-2 items-center border-r border-gray-300 pr-2">
              <label className="text-sm font-medium">Màu:</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 cursor-pointer border border-gray-300 rounded"
              />
            </div>

            <div className="flex gap-1 border-r border-gray-300 pr-2">
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-3 py-2 rounded text-sm ${showGrid ? 'bg-green-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                title="Lưới"
              >
                # Lưới
              </button>
            </div>

            <div className="flex gap-1">
              <button
                onClick={undo}
                className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                title="Hoàn tác"
              >
                ↶ Hoàn tác
              </button>
              <button
                onClick={clearCanvas}
                className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                title="Xóa tất cả"
              >
                🗑️ Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="p-4 bg-gray-50 flex-1 overflow-auto">
          <div className="bg-white border-2 border-gray-300 inline-block">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="cursor-crosshair"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <p><strong>Hướng dẫn:</strong> Chọn công cụ → Click và kéo trên canvas để vẽ</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Lưu và chèn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
