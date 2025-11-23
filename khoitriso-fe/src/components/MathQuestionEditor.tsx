'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import dynamic from 'next/dynamic';

// Lazy load GeometryDrawer to avoid SSR issues with canvas
const GeometryDrawer = dynamic(() => import('./GeometryDrawer'), { ssr: false });

interface MathQuestionEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  label?: string;
}

/**
 * Editor toán học chuyên nghiệp với công cụ trực quan
 * Hỗ trợ công thức, phân số, căn, lũy thừa, ký hiệu đặc biệt
 */
export default function MathQuestionEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  height = 400,
  label,
}: MathQuestionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showSymbols, setShowSymbols] = useState(false);
  const [showGeometryDrawer, setShowGeometryDrawer] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertFraction = () => {
    const numerator = prompt('Nhập tử số:') || 'a';
    const denominator = prompt('Nhập mẫu số:') || 'b';
    const html = `<span class="math-fraction" contenteditable="false">
      <span class="numerator" contenteditable="true">${numerator}</span>
      <span class="fraction-bar"></span>
      <span class="denominator" contenteditable="true">${denominator}</span>
    </span>&nbsp;`;
    insertHtml(html);
  };

  const insertSquareRoot = () => {
    const value = prompt('Nhập giá trị trong căn:') || 'x';
    const html = `<span class="math-root" contenteditable="false">√<span class="root-content" contenteditable="true">${value}</span></span>&nbsp;`;
    insertHtml(html);
  };

  const insertPower = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      notify('Vui lòng chọn cơ số trước', 'info');
      return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) {
      notify('Vui lòng chọn cơ số trước', 'info');
      return;
    }
    const power = prompt('Nhập số mũ:') || '2';
    const html = `<span class="math-power">${selectedText}<sup contenteditable="true">${power}</sup></span>&nbsp;`;
    range.deleteContents();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
      range.insertNode(temp.firstChild);
    }
  };

  const insertSubscript = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      notify('Vui lòng chọn văn bản trước', 'info');
      return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    if (!selectedText) {
      notify('Vui lòng chọn văn bản trước', 'info');
      return;
    }
    const sub = prompt('Nhập chỉ số dưới:') || 'n';
    const html = `<span class="math-subscript">${selectedText}<sub contenteditable="true">${sub}</sub></span>&nbsp;`;
    range.deleteContents();
    const temp = document.createElement('div');
    temp.innerHTML = html;
    while (temp.firstChild) {
      range.insertNode(temp.firstChild);
    }
  };

  const insertSymbol = (symbol: string) => {
    insertHtml(symbol);
    setShowSymbols(false);
  };

  const insertHtml = (html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, html);
      handleInput();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const mathSymbols = [
    { symbol: '≤', name: 'Nhỏ hơn bằng' },
    { symbol: '≥', name: 'Lớn hơn bằng' },
    { symbol: '≠', name: 'Khác' },
    { symbol: '±', name: 'Cộng trừ' },
    { symbol: '×', name: 'Nhân' },
    { symbol: '÷', name: 'Chia' },
    { symbol: '√', name: 'Căn' },
    { symbol: '∞', name: 'Vô cùng' },
    { symbol: 'π', name: 'Pi' },
    { symbol: '∑', name: 'Tổng' },
    { symbol: '∫', name: 'Tích phân' },
    { symbol: '°', name: 'Độ' },
    { symbol: 'α', name: 'Alpha' },
    { symbol: 'β', name: 'Beta' },
    { symbol: 'γ', name: 'Gamma' },
    { symbol: 'θ', name: 'Theta' },
    { symbol: '∆', name: 'Delta' },
    { symbol: '∈', name: 'Thuộc' },
    { symbol: '∉', name: 'Không thuộc' },
    { symbol: '⊂', name: 'Tập con' },
    { symbol: '∪', name: 'Hợp' },
    { symbol: '∩', name: 'Giao' },
    { symbol: '→', name: 'Mũi tên phải' },
    { symbol: '←', name: 'Mũi tên trái' },
  ];

  return (
    <div className="math-question-editor">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Toolbar */}
      <div ref={toolbarRef} className="editor-toolbar">
        {/* Text formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="toolbar-btn"
            title="Đậm (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="toolbar-btn"
            title="Nghiêng (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="toolbar-btn"
            title="Gạch chân (Ctrl+U)"
          >
            <u>U</u>
          </button>
        </div>

        {/* Math symbols */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={insertFraction}
            className="toolbar-btn"
            title="Chèn phân số"
          >
            <span className="inline-flex flex-col text-xs leading-none">
              <span>a</span>
              <span className="border-t border-gray-600 px-1">b</span>
            </span>
          </button>
          <button
            type="button"
            onClick={insertSquareRoot}
            className="toolbar-btn"
            title="Chèn căn bậc hai"
          >
            √
          </button>
          <button
            type="button"
            onClick={insertPower}
            className="toolbar-btn"
            title="Lũy thừa (chọn cơ số trước)"
          >
            x<sup className="text-xs">n</sup>
          </button>
          <button
            type="button"
            onClick={insertSubscript}
            className="toolbar-btn"
            title="Chỉ số dưới (chọn văn bản trước)"
          >
            x<sub className="text-xs">n</sub>
          </button>
        </div>

        {/* More symbols */}
        <div className="toolbar-group relative">
          <button
            type="button"
            onClick={() => setShowSymbols(!showSymbols)}
            className="toolbar-btn"
            title="Ký hiệu toán học"
          >
            Σ ∫ π
          </button>
          {showSymbols && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-10 w-80 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-6 gap-2">
                {mathSymbols.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertSymbol(item.symbol)}
                    className="p-2 hover:bg-gray-100 rounded text-lg flex items-center justify-center"
                    title={item.name}
                  >
                    {item.symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alignment */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="toolbar-btn"
            title="Căn trái"
          >
            ≡
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="toolbar-btn"
            title="Căn giữa"
          >
            ≣
          </button>
        </div>

        {/* Lists */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="toolbar-btn"
            title="Danh sách không thứ tự"
          >
            ⁃
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="toolbar-btn"
            title="Danh sách có thứ tự"
          >
            1.
          </button>
        </div>

        {/* Insert image and geometry */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => {
              const url = prompt('Nhập URL hình ảnh:');
              if (url) {
                insertHtml(`<img src="${url}" alt="Hình ảnh" style="max-width: 100%; height: auto;" />`);
              }
            }}
            className="toolbar-btn"
            title="Chèn hình ảnh"
          >
            🖼️
          </button>
          <button
            type="button"
            onClick={() => setShowGeometryDrawer(true)}
            className="toolbar-btn bg-blue-50 hover:bg-blue-100"
            title="Vẽ hình học"
          >
            📐
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        className="editor-content"
        contentEditable
        onInput={handleInput}
        style={{ minHeight: height }}
        data-placeholder={placeholder}
      />

      {/* Geometry Drawer Modal */}
      {showGeometryDrawer && (
        <GeometryDrawer
          onSave={(imageUrl) => {
            insertHtml(`<img src="${imageUrl}" alt="Hình vẽ" style="max-width: 100%; height: auto; margin: 10px 0;" />`);
            notify('Đã chèn hình vẽ thành công', 'success');
          }}
          onClose={() => setShowGeometryDrawer(false)}
        />
      )}

      <style jsx>{`
        .math-question-editor {
          width: 100%;
        }

        .editor-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 8px;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
        }

        .toolbar-group {
          display: flex;
          gap: 4px;
          padding: 0 8px;
          border-right: 1px solid #e5e7eb;
        }

        .toolbar-group:last-child {
          border-right: none;
        }

        .toolbar-btn {
          padding: 6px 10px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          min-width: 36px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-center;
        }

        .toolbar-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .toolbar-btn:active {
          background: #e5e7eb;
        }

        .editor-content {
          padding: 16px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0 0 6px 6px;
          outline: none;
          font-size: 14px;
          line-height: 1.6;
          overflow-y: auto;
        }

        .editor-content:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .editor-content:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }

        /* Math styles */
        :global(.math-fraction) {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          vertical-align: middle;
          margin: 0 4px;
          font-family: 'Times New Roman', serif;
        }

        :global(.math-fraction .numerator),
        :global(.math-fraction .denominator) {
          padding: 2px 6px;
          text-align: center;
        }

        :global(.math-fraction .fraction-bar) {
          width: 100%;
          height: 1px;
          background: #000;
          margin: 2px 0;
        }

        :global(.math-root) {
          display: inline-flex;
          align-items: center;
          font-size: 1.2em;
          margin: 0 2px;
          font-family: 'Times New Roman', serif;
        }

        :global(.math-root .root-content) {
          font-size: 0.85em;
          border-top: 1px solid #000;
          padding: 0 4px;
        }

        :global(.math-power),
        :global(.math-subscript) {
          display: inline;
          font-family: 'Times New Roman', serif;
        }

        :global(.editor-content sup) {
          vertical-align: super;
          font-size: 0.75em;
        }

        :global(.editor-content sub) {
          vertical-align: sub;
          font-size: 0.75em;
        }

        :global(.editor-content img) {
          max-width: 100%;
          height: auto;
          margin: 8px 0;
        }
      `}</style>
    </div>
  );
}
