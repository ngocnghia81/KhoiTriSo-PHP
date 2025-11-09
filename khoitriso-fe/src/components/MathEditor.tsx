'use client';

import { useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  showPreview?: boolean;
}

export default function MathEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung. Sử dụng công cụ bên dưới để chèn công thức toán học.',
  rows = 4,
  showPreview = true,
}: MathEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Math symbols and templates
  const mathSymbols = {
    basic: [
      { label: '+', latex: '+' },
      { label: '−', latex: '-' },
      { label: '×', latex: '\\times' },
      { label: '÷', latex: '\\div' },
      { label: '±', latex: '\\pm' },
      { label: '=', latex: '=' },
      { label: '≠', latex: '\\neq' },
      { label: '≈', latex: '\\approx' },
      { label: '<', latex: '<' },
      { label: '>', latex: '>' },
      { label: '≤', latex: '\\leq' },
      { label: '≥', latex: '\\geq' },
    ],
    fractions: [
      { label: 'Phân số', latex: '\\frac{a}{b}', template: '\\frac{}{}' },
      { label: 'Phân số nhỏ', latex: '\\tfrac{a}{b}', template: '\\tfrac{}{}' },
      { label: 'Phân số lớn', latex: '\\dfrac{a}{b}', template: '\\dfrac{}{}' },
    ],
    roots: [
      { label: 'Căn bậc 2', latex: '\\sqrt{x}', template: '\\sqrt{}' },
      { label: 'Căn bậc n', latex: '\\sqrt[n]{x}', template: '\\sqrt[]{}' },
      { label: 'Căn bậc 3', latex: '\\sqrt[3]{x}', template: '\\sqrt[3]{}' },
    ],
    powers: [
      { label: 'Bình phương', latex: 'x^2', template: '^{}' },
      { label: 'Lũy thừa', latex: 'x^n', template: '^{}' },
      { label: 'Chỉ số dưới', latex: 'x_n', template: '_{}' },
      { label: 'Cả hai', latex: 'x_n^2', template: '_{}^{}' },
    ],
    functions: [
      { label: 'sin', latex: '\\sin(x)', template: '\\sin()' },
      { label: 'cos', latex: '\\cos(x)', template: '\\cos()' },
      { label: 'tan', latex: '\\tan(x)', template: '\\tan()' },
      { label: 'log', latex: '\\log(x)', template: '\\log()' },
      { label: 'ln', latex: '\\ln(x)', template: '\\ln()' },
      { label: 'exp', latex: '\\exp(x)', template: '\\exp()' },
    ],
    integrals: [
      { label: 'Tích phân', latex: '\\int f(x)dx', template: '\\int  dx' },
      { label: 'Tích phân xác định', latex: '\\int_a^b f(x)dx', template: '\\int_{}^{}  dx' },
      { label: 'Tích phân kép', latex: '\\iint f(x,y)dxdy', template: '\\iint  dxdy' },
      { label: 'Tích phân ba', latex: '\\iiint f(x,y,z)dxdydz', template: '\\iiint  dxdydz' },
    ],
    sums: [
      { label: 'Tổng', latex: '\\sum_{i=1}^{n}', template: '\\sum_{}^{}' },
      { label: 'Tích', latex: '\\prod_{i=1}^{n}', template: '\\prod_{}^{}' },
      { label: 'Giới hạn', latex: '\\lim_{x \\to \\infty}', template: '\\lim_{x \\to }' },
    ],
    matrices: [
      { label: 'Ma trận 2x2', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', template: '\\begin{pmatrix}  &  \\\\  &  \\end{pmatrix}' },
      { label: 'Ma trận 3x3', latex: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}', template: '\\begin{pmatrix}  &  &  \\\\  &  &  \\\\  &  &  \\end{pmatrix}' },
      { label: 'Định thức', latex: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}', template: '\\begin{vmatrix}  &  \\\\  &  \\end{vmatrix}' },
    ],
    greek: [
      { label: 'α', latex: '\\alpha' },
      { label: 'β', latex: '\\beta' },
      { label: 'γ', latex: '\\gamma' },
      { label: 'δ', latex: '\\delta' },
      { label: 'ε', latex: '\\epsilon' },
      { label: 'θ', latex: '\\theta' },
      { label: 'λ', latex: '\\lambda' },
      { label: 'μ', latex: '\\mu' },
      { label: 'π', latex: '\\pi' },
      { label: 'σ', latex: '\\sigma' },
      { label: 'φ', latex: '\\phi' },
      { label: 'ω', latex: '\\omega' },
      { label: 'Δ', latex: '\\Delta' },
      { label: 'Ω', latex: '\\Omega' },
      { label: 'Σ', latex: '\\Sigma' },
      { label: 'Π', latex: '\\Pi' },
    ],
    arrows: [
      { label: '→', latex: '\\rightarrow' },
      { label: '←', latex: '\\leftarrow' },
      { label: '↔', latex: '\\leftrightarrow' },
      { label: '⇒', latex: '\\Rightarrow' },
      { label: '⇐', latex: '\\Leftarrow' },
      { label: '⇔', latex: '\\Leftrightarrow' },
      { label: '∞', latex: '\\infty' },
    ],
  };

  const insertAtCursor = (text: string, template?: string) => {
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = template || text;
      
      // Replace placeholders {} with selected text or empty
      const finalText = textToInsert.replace(/\{\}/g, selectedText || '');
      
      const newValue = value.substring(0, start) + finalText + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        const newCursorPos = start + finalText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    } else {
      // Fallback: append to end
      onChange(value + (value ? ' ' : '') + (template || text));
    }
  };

  const insertMathBlock = (template: string) => {
    const mathBlock = `$$${template}$$`;
    insertAtCursor(mathBlock);
  };

  const insertInline = (template: string) => {
    const inlineMath = `$${template}$`;
    insertAtCursor(inlineMath);
  };

  // Parse content to show preview
  const renderPreview = (content: string) => {
    if (!content) return null;
    
    // Split by $$ blocks (block math) and $ blocks (inline math)
    const parts: Array<{ type: 'text' | 'block' | 'inline'; content: string }> = [];
    let currentIndex = 0;
    
    // Match $$...$$ (block math) first, then $...$ (inline math)
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    const inlineMathRegex = /\$([^$]+)\$/g;
    
    let match;
    const blockMatches: Array<{ start: number; end: number; content: string }> = [];
    const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
    
    // Find all block math
    while ((match = blockMathRegex.exec(content)) !== null) {
      blockMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }
    
    // Find all inline math (excluding those inside block math)
    while ((match = inlineMathRegex.exec(content)) !== null) {
      const isInsideBlock = blockMatches.some(
        bm => match!.index >= bm.start && match!.index < bm.end
      );
      if (!isInsideBlock) {
        inlineMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
        });
      }
    }
    
    // Combine and sort all matches
    const allMatches = [
      ...blockMatches.map(m => ({ ...m, type: 'block' as const })),
      ...inlineMatches.map(m => ({ ...m, type: 'inline' as const })),
    ].sort((a, b) => a.start - b.start);
    
    // Build parts array
    let lastIndex = 0;
    for (const match of allMatches) {
      if (match.start > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.start),
        });
      }
      parts.push({
        type: match.type,
        content: match.content,
      });
      lastIndex = match.end;
    }
    
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex),
      });
    }
    
    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }
    
    return (
      <div className="prose max-w-none p-3 bg-gray-50 rounded-md border min-h-[50px]">
        {parts.length === 0 ? (
          <span className="text-gray-400 italic">Nhập nội dung để xem preview...</span>
        ) : (
          parts.map((part, i) => {
            if (part.type === 'block') {
              try {
                return <BlockMath key={i} math={part.content.trim()} />;
              } catch (e) {
                return <span key={i} className="text-red-500 text-sm">[Lỗi công thức: {part.content}]</span>;
              }
            } else if (part.type === 'inline') {
              try {
                return <InlineMath key={i} math={part.content.trim()} />;
              } catch (e) {
                return <span key={i} className="text-red-500 text-sm">[Lỗi công thức: {part.content}]</span>;
              }
            } else {
              // Split text by newlines to preserve line breaks
              const textParts = part.content.split('\n');
              return (
                <span key={i}>
                  {textParts.map((line, lineIdx) => (
                    <span key={lineIdx}>
                      {line}
                      {lineIdx < textParts.length - 1 && <br />}
                    </span>
                  ))}
                </span>
              );
            }
          })
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setCursorPosition(e.target.selectionStart);
          }}
          onSelect={(e) => {
            const target = e.target as HTMLTextAreaElement;
            setCursorPosition(target.selectionStart);
          }}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
        />
      </div>
      {showPreview && value && (
        <div className="mt-2 border-t pt-2">
          <div className="text-xs font-semibold text-gray-600 mb-1">Preview:</div>
          {renderPreview(value)}
        </div>
      )}

      {/* Math Toolbar */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <button
          type="button"
          onClick={() => setShowToolbar(!showToolbar)}
          className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between"
        >
          <span>📐 Công cụ công thức toán học</span>
          <span className="text-gray-400">{showToolbar ? '▼' : '▶'}</span>
        </button>

        {showToolbar && (
          <div className="p-4 border-t border-gray-200 space-y-4 max-h-96 overflow-y-auto">
            {/* Basic Symbols */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Ký hiệu cơ bản</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.basic.map((sym, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertInline(sym.latex)}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm font-mono"
                    title={sym.latex}
                  >
                    {sym.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fractions */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Phân số</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.fractions.map((frac, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertMathBlock(frac.template || frac.latex)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded text-sm"
                    title={frac.latex}
                  >
                    {frac.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Roots */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Căn thức</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.roots.map((root, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertMathBlock(root.template || root.latex)}
                    className="px-3 py-1.5 bg-green-50 hover:bg-green-100 rounded text-sm"
                    title={root.latex}
                  >
                    {root.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Powers & Subscripts */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Lũy thừa & Chỉ số</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.powers.map((power, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertInline(power.template || power.latex)}
                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 rounded text-sm"
                    title={power.latex}
                  >
                    {power.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Functions */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Hàm số</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.functions.map((func, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertMathBlock(func.template || func.latex)}
                    className="px-3 py-1.5 bg-yellow-50 hover:bg-yellow-100 rounded text-sm font-mono"
                    title={func.latex}
                  >
                    {func.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Integrals */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Tích phân</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.integrals.map((int, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertMathBlock(int.template || int.latex)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded text-sm"
                    title={int.latex}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sums & Limits */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Tổng & Giới hạn</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.sums.map((sum, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertMathBlock(sum.template || sum.latex)}
                    className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 rounded text-sm"
                    title={sum.latex}
                  >
                    {sum.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Greek Letters */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Chữ cái Hy Lạp</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.greek.map((letter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertInline(letter.latex)}
                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded text-sm"
                    title={letter.latex}
                  >
                    {letter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrows & Special */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Mũi tên & Đặc biệt</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.arrows.map((arrow, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertInline(arrow.latex)}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 rounded text-sm"
                    title={arrow.latex}
                  >
                    {arrow.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrices */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Ma trận</label>
              <div className="flex flex-wrap gap-2">
                {mathSymbols.matrices.map((matrix, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertMathBlock(matrix.template || matrix.latex)}
                    className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded text-sm"
                    title={matrix.latex}
                  >
                    {matrix.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Insert Buttons */}
            <div className="pt-2 border-t border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 mb-2">Chèn nhanh</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertMathBlock('\\frac{}{}')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Phân số
                </button>
                <button
                  type="button"
                  onClick={() => insertMathBlock('\\sqrt{}')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  Căn bậc 2
                </button>
                <button
                  type="button"
                  onClick={() => insertInline('^{}')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Lũy thừa
                </button>
                <button
                  type="button"
                  onClick={() => insertInline('_{}')}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                >
                  Chỉ số dưới
                </button>
                <button
                  type="button"
                  onClick={() => insertMathBlock('\\int_{}^{}  dx')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
                >
                  Tích phân
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

