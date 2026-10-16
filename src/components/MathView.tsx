import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const renderedHtml = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        output: 'html', // Giữ duy nhất dòng công thức chuẩn ký hiệu toán học KaTeX, bỏ dòng chữ thô bên dưới
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
      return null;
    }
  }, [math, block]);

  if (!renderedHtml) {
    return (
      <span className={`font-mono text-cyan-300 bg-slate-900/60 px-2 py-0.5 rounded ${className}`}>
        {math}
      </span>
    );
  }

  return (
    <span
      className={`inline-block overflow-x-auto max-w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
