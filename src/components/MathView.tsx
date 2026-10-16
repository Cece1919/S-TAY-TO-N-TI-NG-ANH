import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math: string;
  block?: boolean;
  className?: string;
}

/**
 * Strips outer LaTeX delimiters like $, $$, \(, \), \[, \] if present
 */
export function cleanFormula(raw: string): string {
  if (!raw) return '';
  let str = raw.trim();
  if (str.startsWith('$$') && str.endsWith('$$') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  } else if (str.startsWith('$') && str.endsWith('$') && str.length >= 2) {
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('\\[') && str.endsWith('\\]') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  } else if (str.startsWith('\\(') && str.endsWith('\\)') && str.length >= 4) {
    str = str.slice(2, -2).trim();
  }
  return str;
}

/**
 * Renders a single LaTeX / MathType formula using KaTeX
 */
export const MathView: React.FC<MathViewProps> = ({ math, block = false, className = '' }) => {
  const renderedHtml = useMemo(() => {
    if (!math) return '';
    const cleaned = cleanFormula(math);
    try {
      return katex.renderToString(cleaned, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        output: 'html', // Only render HTML for clean, sharp math typography
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
      className={`${block ? 'block my-1 overflow-x-auto max-w-full text-center' : 'inline-block overflow-x-auto max-w-full align-baseline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

interface MathTextProps {
  text: string;
  className?: string;
  blockFormulaClassName?: string;
  inlineFormulaClassName?: string;
}

/**
 * Renders text containing mixed content:
 * - Block LaTeX math: $$...$$ or \[...\]
 * - Inline LaTeX / MathType math: $...$ or \(...\)
 * - Markdown bold (**text**) and italic (*text*)
 * - Preserves paragraphs and formatting
 */
export const MathText: React.FC<MathTextProps> = ({
  text,
  className = '',
  blockFormulaClassName = '',
  inlineFormulaClassName = '',
}) => {
  const elements = useMemo(() => {
    if (!text) return null;

    // 1. Split text into block math and non-block math segments
    const blockMathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g;
    const blockSegments = text.split(blockMathRegex);

    return blockSegments.map((segment, blockIdx) => {
      if (!segment) return null;

      // Check if this segment is a display / block equation
      const isBlockMath =
        (segment.startsWith('$$') && segment.endsWith('$$') && segment.length >= 4) ||
        (segment.startsWith('\\[') && segment.endsWith('\\]') && segment.length >= 4);

      if (isBlockMath) {
        const mathContent = cleanFormula(segment);
        try {
          const html = katex.renderToString(mathContent, {
            displayMode: true,
            throwOnError: false,
            strict: false,
            output: 'html',
          });
          return (
            <div
              key={`block-${blockIdx}`}
              className={`my-2 py-1 overflow-x-auto text-center max-w-full ${blockFormulaClassName}`}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return (
            <pre
              key={`block-err-${blockIdx}`}
              className="my-2 p-2 bg-slate-900 text-cyan-300 font-mono text-xs rounded overflow-x-auto text-center"
            >
              {mathContent}
            </pre>
          );
        }
      }

      // For non-block text, split by lines to preserve structure and parse inline math
      const lines = segment.split('\n');
      return (
        <span key={`text-block-${blockIdx}`}>
          {lines.map((line, lineIdx) => {
            // Check for list item
            const isBullet = /^\s*[-*•]\s+/.test(line);
            const cleanLine = isBullet ? line.replace(/^\s*[-*•]\s+/, '') : line;

            // Regex for inline math: $formula$ or \(formula\)
            const inlineMathRegex = /(\$[^\$\n\s](?:[^\$\n]*?[^\$\n\s])?\$|\\\(.*?\\\))/g;
            const inlineSegments = cleanLine.split(inlineMathRegex);

            const lineContent = inlineSegments.map((part, partIdx) => {
              if (!part) return null;

              const isInlineMath =
                (part.startsWith('$') && part.endsWith('$') && part.length >= 2) ||
                (part.startsWith('\\(') && part.endsWith('\\)') && part.length >= 4);

              if (isInlineMath) {
                const mathContent = cleanFormula(part);
                try {
                  const html = katex.renderToString(mathContent, {
                    displayMode: false,
                    throwOnError: false,
                    strict: false,
                    output: 'html',
                  });
                  return (
                    <span
                      key={`inline-${partIdx}`}
                      className={`inline-block px-0.5 align-baseline ${inlineFormulaClassName}`}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                } catch {
                  return (
                    <span
                      key={`inline-err-${partIdx}`}
                      className="font-mono text-xs text-indigo-400 px-1 bg-indigo-50/20 rounded"
                    >
                      {mathContent}
                    </span>
                  );
                }
              }

              // Parse Markdown bold (**bold**) and italic (*italic*)
              return (
                <span key={`txt-${partIdx}`}>
                  {renderMarkdownSpans(part)}
                </span>
              );
            });

            if (isBullet) {
              return (
                <div key={`line-${lineIdx}`} className="flex items-start gap-1.5 my-1 ml-2">
                  <span className="text-indigo-500 font-bold select-none leading-relaxed">•</span>
                  <span className="flex-1 leading-relaxed">{lineContent}</span>
                </div>
              );
            }

            return (
              <React.Fragment key={`line-${lineIdx}`}>
                {lineContent}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            );
          })}
        </span>
      );
    });
  }, [text, blockFormulaClassName, inlineFormulaClassName]);

  return <div className={`math-content leading-relaxed ${className}`}>{elements}</div>;
};

/**
 * Simple helper to format **bold** and *italic* in non-math text
 */
function renderMarkdownSpans(text: string): React.ReactNode {
  if (!text.includes('*')) {
    return text;
  }

  // Split by bold (**text**)
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
      return (
        <strong key={`b-${bIdx}`} className="font-semibold text-inherit">
          {bPart.slice(2, -2)}
        </strong>
      );
    }

    // Split by italic (*text*)
    const italicParts = bPart.split(/(\*.*?\*)/g);
    return italicParts.map((iPart, iIdx) => {
      if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length >= 2) {
        return (
          <em key={`i-${bIdx}-${iIdx}`} className="italic text-inherit">
            {iPart.slice(1, -1)}
          </em>
        );
      }
      return iPart;
    });
  });
}
