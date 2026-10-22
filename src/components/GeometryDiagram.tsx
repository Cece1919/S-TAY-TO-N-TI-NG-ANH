import React from 'react';
import { Compass } from 'lucide-react';
import { MathTerm } from '../types/math';

interface GeometryDiagramProps {
  term: MathTerm;
  theme: 'paper' | 'night';
  className?: string;
  compact?: boolean;
}

/**
 * Kiểm tra xem thuật ngữ có thuộc hoặc liên quan tới phân môn Hình học hay không.
 * Các nội dung không liên quan (Số học, Đại số, Tổ hợp/Xác suất) sẽ trả về false và không hiển thị hình vẽ.
 */
export const isGeometryTerm = (term?: MathTerm | null): boolean => {
  if (!term) return false;

  // 1. Phân môn Hình học (Geometry)
  if (term.category === 'geometry') return true;

  // 2. Các phân môn khác (Đại số, Số học, Tổ hợp) thì bỏ qua không vẽ hình
  if (term.category === 'algebra' || term.category === 'number_theory' || term.category === 'combinatorics') {
    return false;
  }

  // 3. Với các thuật ngữ tự do, chỉ hiển thị nếu có từ khóa chuẩn về Hình học
  const termLower = (term.term + ' ' + term.vietnameseMeaning).toLowerCase();
  const geometryKeywords = [
    'hình học', 'hình tròn', 'tam giác', 'tứ giác', 'hình chữ nhật', 'hình vuông',
    'hình thang', 'hình thoi', 'hình bình hành', 'đường tròn', 'nội tiếp', 'ngoại tiếp',
    'cạnh huyền', 'chu vi', 'đường kính', 'bán kính', 'trực tâm', 'trọng tâm', 'phân giác', 'trung trực',
    'circle', 'triangle', 'rectangle', 'square', 'trapezoid', 'rhombus', 'parallelogram',
    'quadrilateral', 'polygon', 'hypotenuse', 'incircle', 'circumcircle', 'bisector'
  ];

  return geometryKeywords.some((kw) => termLower.includes(kw));
};

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({
  term,
  theme,
  className = '',
  compact = false,
}) => {
  // Chỉ thuật ngữ nào liên quan tới hình thì mới hiển thị, không liên quan thì bỏ qua
  if (!isGeometryTerm(term)) {
    return null;
  }

  const isPaper = theme === 'paper';
  const termLower = (term.term + ' ' + term.vietnameseMeaning).toLowerCase();

  // If the term has an explicit diagramSvg and is geometry, use it
  if (term.diagramSvg) {
    return (
      <div
        className={`rounded-xl border p-3 flex flex-col items-center justify-center transition-all ${
          isPaper
            ? 'bg-[#fbf9f4] border-[#e8e2d6] text-slate-800'
            : 'bg-slate-950/80 border-slate-800 text-slate-200'
        } ${className}`}
      >
        {!compact && (
          <div className="w-full flex items-center justify-between mb-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Hình học trực quan ({term.term})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Minh họa vector SVG</span>
          </div>
        )}
        <div
          className={`w-full max-w-[280px] h-[130px] flex items-center justify-center overflow-hidden ${
            isPaper ? '[&_svg]:stroke-slate-800' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: term.diagramSvg }}
        />
      </div>
    );
  }

  // Primary colors
  const strokeColor = isPaper ? '#1e293b' : '#38bdf8';
  const accentColor = isPaper ? '#059669' : '#34d399';
  const auxColor = isPaper ? '#b45309' : '#f59e0b';
  const fillColor = isPaper ? 'rgba(5, 150, 105, 0.08)' : 'rgba(56, 189, 248, 0.12)';
  const textColor = isPaper ? '#334155' : '#e2e8f0';

  // Choose the most appropriate geometric SVG figure
  let diagramContent: React.ReactNode = null;

  if (termLower.includes('inscribed') || termLower.includes('nội tiếp') || termLower.includes('incircle')) {
    // Inscribed circle in triangle (Đường tròn nội tiếp tam giác)
    // Mathematically exact: Isosceles triangle with base BC = 132 (y = 106), height h = 88, legs AB = AC = 110
    // Semiperimeter s = 176, Area = 5808 => inradius r = 33, incenter I = (100, 73).
    // Exact tangent points on all 3 sides:
    // - Side BC: (100, 106)
    // - Side AB: (73.6, 53.2)
    // - Side AC: (126.4, 53.2)
    diagramContent = (
      <svg viewBox="0 0 200 136" className="w-full h-full">
        {/* Triangle ABC */}
        <polygon points="34,106 166,106 100,18" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Inscribed circle touching ALL three sides precisely */}
        <circle cx="100" cy="73" r="33" fill="none" stroke={accentColor} strokeWidth="2" />
        {/* Incenter I */}
        <circle cx="100" cy="73" r="2.5" fill={auxColor} />
        <text x="93" y="71" fontSize="10" fill={textColor} fontWeight="bold">I</text>
        {/* Radii to all 3 sides demonstrating tangency */}
        <line x1="100" y1="73" x2="100" y2="106" stroke={auxColor} strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="100" y1="73" x2="73.6" y2="53.2" stroke={auxColor} strokeWidth="1" strokeDasharray="2,2" opacity="0.65" />
        <line x1="100" y1="73" x2="126.4" y2="53.2" stroke={auxColor} strokeWidth="1" strokeDasharray="2,2" opacity="0.65" />
        {/* Tangent points contact dots */}
        <circle cx="100" cy="106" r="2" fill={accentColor} />
        <circle cx="73.6" cy="53.2" r="2" fill={accentColor} />
        <circle cx="126.4" cy="53.2" r="2" fill={accentColor} />
        {/* Right angle at BC contact point */}
        <rect x="100" y="99" width="7" height="7" fill="none" stroke={auxColor} strokeWidth="1" />
        {/* Radius label */}
        <text x="107" y="92" fontSize="10" fill={auxColor} fontWeight="bold">r</text>
        {/* Vertex Labels */}
        <text x="100" y="13" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">A</text>
        <text x="23" y="110" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">B</text>
        <text x="177" y="110" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">C</text>
        {/* Formulas */}
        <text x="100" y="122" fontSize="9.5" fill={accentColor} textAnchor="middle" fontWeight="bold">r = A / s</text>
        <text x="100" y="132" fontSize="7.5" fill={textColor} textAnchor="middle" opacity="0.75">s = (a + b + c) / 2</text>
      </svg>
    );
  } else if (termLower.includes('circumscribed') || termLower.includes('ngoại tiếp') || termLower.includes('circumcircle')) {
    // Circumscribed circle around triangle (Đường tròn ngoại tiếp)
    // Mathematically exact: Center O(100, 65), Radius R = 50
    // Vertices A(100, 15), B(60, 95), C(140, 95) all satisfy dx² + dy² = 50² = 2500
    diagramContent = (
      <svg viewBox="0 0 200 136" className="w-full h-full">
        {/* Circumcircle */}
        <circle cx="100" cy="65" r="50" fill={fillColor} stroke={accentColor} strokeWidth="2" />
        {/* Triangle inscribed in circumcircle */}
        <polygon points="60,95 140,95 100,15" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Circumcenter O and radius R */}
        <circle cx="100" cy="65" r="2.5" fill={auxColor} />
        <line x1="100" y1="65" x2="140" y2="95" stroke={auxColor} strokeWidth="1.5" strokeDasharray="3,2" />
        {/* Labels */}
        <text x="100" y="10" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">A</text>
        <text x="48" y="100" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">B</text>
        <text x="152" y="100" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">C</text>
        <text x="94" y="62" fontSize="10" fill={textColor} fontWeight="bold">O</text>
        <text x="122" y="76" fontSize="10" fill={auxColor} fontWeight="bold">R</text>
        <text x="100" y="123" fontSize="9.5" fill={accentColor} textAnchor="middle" fontWeight="bold">R = abc / (4A)</text>
      </svg>
    );
  } else if (termLower.includes('parallelogram') || termLower.includes('bình hành')) {
    // Parallelogram (Hình bình hành)
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Parallelogram */}
        <polygon points="45,100 165,100 140,35 20,35" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Dashed altitude h */}
        <line x1="140" y1="35" x2="140" y2="100" stroke={auxColor} strokeWidth="1.5" strokeDasharray="3,2" />
        <rect x="133" y="93" width="7" height="7" fill="none" stroke={auxColor} strokeWidth="1" />
        {/* Labels */}
        <text x="95" y="115" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">base (b)</text>
        <text x="147" y="70" fontSize="11" fill={auxColor} fontWeight="bold">h</text>
        <text x="15" y="32" fontSize="10" fill={textColor}>A</text>
        <text x="145" y="32" fontSize="10" fill={textColor}>B</text>
        <text x="172" y="105" fontSize="10" fill={textColor}>C</text>
        <text x="38" y="105" fontSize="10" fill={textColor}>D</text>
        <text x="100" y="20" fontSize="9" fill={accentColor} textAnchor="middle" fontWeight="bold">Area = b · h</text>
      </svg>
    );
  } else if (termLower.includes('rhombus') || termLower.includes('thoi')) {
    // Rhombus with diagonals (Hình thoi)
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Rhombus ABCD */}
        <polygon points="100,15 165,65 100,115 35,65" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Diagonals d1 and d2 */}
        <line x1="100" y1="15" x2="100" y2="115" stroke={accentColor} strokeWidth="1.5" />
        <line x1="35" y1="65" x2="165" y2="65" stroke={auxColor} strokeWidth="1.5" />
        {/* Right angle mark at center */}
        <rect x="100" y="65" width="7" height="7" fill="none" stroke={textColor} strokeWidth="1" />
        {/* Labels */}
        <text x="100" y="10" fontSize="10" fill={textColor} textAnchor="middle" fontWeight="bold">A</text>
        <text x="175" y="69" fontSize="10" fill={textColor} fontWeight="bold">B</text>
        <text x="100" y="126" fontSize="10" fill={textColor} textAnchor="middle" fontWeight="bold">C</text>
        <text x="24" y="69" fontSize="10" fill={textColor} fontWeight="bold">D</text>
        <text x="105" y="45" fontSize="10" fill={accentColor} fontWeight="bold">d₁</text>
        <text x="130" y="60" fontSize="10" fill={auxColor} fontWeight="bold">d₂</text>
        <text x="100" y="77" fontSize="9" fill={accentColor} textAnchor="middle" fontWeight="bold">A = ½ d₁ d₂</text>
      </svg>
    );
  } else if (termLower.includes('trapezoid') || termLower.includes('thang')) {
    // Trapezoid with bases a, b and height h (Hình thang)
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Trapezoid */}
        <polygon points="30,105 170,105 135,35 65,35" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Dashed altitude h */}
        <line x1="65" y1="35" x2="65" y2="105" stroke={auxColor} strokeWidth="1.5" strokeDasharray="3,2" />
        <rect x="65" y="98" width="7" height="7" fill="none" stroke={auxColor} strokeWidth="1" />
        {/* Median m */}
        <line x1="47.5" y1="70" x2="152.5" y2="70" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4,2" />
        {/* Labels */}
        <text x="100" y="27" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">Đáy bé a</text>
        <text x="100" y="120" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">Đáy lớn b</text>
        <text x="56" y="70" fontSize="11" fill={auxColor} fontWeight="bold">h</text>
        <text x="100" y="66" fontSize="10" fill={accentColor} textAnchor="middle">m = (a+b)/2</text>
      </svg>
    );
  } else if (termLower.includes('cyclic') || termLower.includes('tứ giác nội tiếp')) {
    // Cyclic quadrilateral (Tứ giác nội tiếp)
    // Exact: Center (100, 65), Radius 50.
    // Vertices on circle: A(70, 25), B(140, 35), C(130, 105), D(60, 95).
    diagramContent = (
      <svg viewBox="0 0 200 135" className="w-full h-full">
        {/* Circle */}
        <circle cx="100" cy="65" r="50" fill={fillColor} stroke={accentColor} strokeWidth="1.5" strokeDasharray="3,2" />
        {/* Quadrilateral on circle */}
        <polygon points="70,25 140,35 130,105 60,95" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Vertices dots */}
        <circle cx="70" cy="25" r="2" fill={textColor} />
        <circle cx="140" cy="35" r="2" fill={textColor} />
        <circle cx="130" cy="105" r="2" fill={textColor} />
        <circle cx="60" cy="95" r="2" fill={textColor} />
        {/* Labels */}
        <text x="60" y="22" fontSize="11" fill={textColor} fontWeight="bold">A</text>
        <text x="148" y="32" fontSize="11" fill={textColor} fontWeight="bold">B</text>
        <text x="138" y="112" fontSize="11" fill={textColor} fontWeight="bold">C</text>
        <text x="50" y="102" fontSize="11" fill={textColor} fontWeight="bold">D</text>
        <text x="100" y="68" fontSize="9" fill={auxColor} textAnchor="middle" fontWeight="bold">∠A + ∠C = 180°</text>
        <text x="100" y="125" fontSize="8.5" fill={accentColor} textAnchor="middle">∠B + ∠D = 180°</text>
      </svg>
    );
  } else if (termLower.includes('hypotenuse') || termLower.includes('pythagor') || termLower.includes('tam giác vuông') || termLower.includes('cạnh huyền')) {
    // Right triangle with hypotenuse (Tam giác vuông & Cạnh huyền)
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Right triangle */}
        <polygon points="40,105 160,105 40,25" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Right angle symbol */}
        <rect x="40" y="95" width="10" height="10" fill="none" stroke={auxColor} strokeWidth="1.5" />
        {/* Labels */}
        <text x="26" y="65" fontSize="11" fill={textColor} fontWeight="bold">a</text>
        <text x="100" y="120" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">b</text>
        <text x="110" y="55" fontSize="11" fill={auxColor} fontWeight="bold">c (Hypotenuse)</text>
        <text x="100" y="72" fontSize="10" fill={accentColor} textAnchor="middle" fontWeight="bold">c² = a² + b²</text>
      </svg>
    );
  } else if (termLower.includes('phân giác') || termLower.includes('angle bisector')) {
    // Angle bisector (Đường phân giác góc / tam giác)
    // Ray AD bisecting angle A
    diagramContent = (
      <svg viewBox="0 0 200 135" className="w-full h-full">
        {/* Triangle ABC */}
        <polygon points="30,105 170,105 90,20" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Angle bisector AD */}
        <line x1="90" y1="20" x2="108" y2="105" stroke={accentColor} strokeWidth="2" />
        <circle cx="108" cy="105" r="2.5" fill={accentColor} />
        {/* Angle arc marks at A */}
        <path d="M 82 34 A 16 16 0 0 0 92 36" fill="none" stroke={auxColor} strokeWidth="1.5" />
        <path d="M 94 36 A 16 16 0 0 0 102 33" fill="none" stroke={auxColor} strokeWidth="1.5" />
        {/* Labels */}
        <text x="90" y="14" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">A</text>
        <text x="20" y="112" fontSize="11" fill={textColor} fontWeight="bold">B</text>
        <text x="178" y="112" fontSize="11" fill={textColor} fontWeight="bold">C</text>
        <text x="108" y="118" fontSize="10" fill={accentColor} textAnchor="middle" fontWeight="bold">D</text>
        <text x="100" y="70" fontSize="9" fill={auxColor} textAnchor="middle">∠BAD = ∠CAD</text>
        <text x="100" y="130" fontSize="9" fill={accentColor} textAnchor="middle" fontWeight="bold">DB / DC = AB / AC</text>
      </svg>
    );
  } else if (termLower.includes('bisector') || termLower.includes('trung trực')) {
    // Perpendicular bisector (Đường trung trực đoạn thẳng)
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Segment AB */}
        <line x1="30" y1="65" x2="170" y2="65" stroke={strokeColor} strokeWidth="2" />
        {/* Perpendicular line d */}
        <line x1="100" y1="15" x2="100" y2="115" stroke={accentColor} strokeWidth="2" />
        {/* Right angle mark */}
        <rect x="100" y="53" width="12" height="12" fill="none" stroke={auxColor} strokeWidth="1.5" />
        {/* Midpoint M and endpoints */}
        <circle cx="30" cy="65" r="3" fill={textColor} />
        <circle cx="170" cy="65" r="3" fill={textColor} />
        <circle cx="100" cy="65" r="3" fill={auxColor} />
        {/* Equal tick marks AM = MB */}
        <line x1="63" y1="60" x2="63" y2="70" stroke={textColor} strokeWidth="1.5" />
        <line x1="137" y1="60" x2="137" y2="70" stroke={textColor} strokeWidth="1.5" />
        {/* Labels */}
        <text x="20" y="70" fontSize="11" fill={textColor} fontWeight="bold">A</text>
        <text x="178" y="70" fontSize="11" fill={textColor} fontWeight="bold">B</text>
        <text x="100" y="80" fontSize="10" fill={auxColor} textAnchor="middle" fontWeight="bold">M</text>
        <text x="108" y="25" fontSize="11" fill={accentColor} fontWeight="bold">d ⊥ AB</text>
        <text x="100" y="125" fontSize="9" fill={accentColor} textAnchor="middle">AM = MB</text>
      </svg>
    );
  } else if (termLower.includes('circle') || termLower.includes('tròn') || termLower.includes('circumference') || termLower.includes('radius') || termLower.includes('diameter')) {
    // Circle with radius and diameter (Đường tròn, Chu vi & Bán kính)
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Circle */}
        <circle cx="100" cy="65" r="48" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        {/* Diameter */}
        <line x1="52" y1="65" x2="148" y2="65" stroke={textColor} strokeWidth="1.5" strokeDasharray="3,2" />
        {/* Radius */}
        <line x1="100" y1="65" x2="134" y2="31" stroke={accentColor} strokeWidth="2" />
        <circle cx="100" cy="65" r="3" fill={auxColor} />
        {/* Labels */}
        <text x="94" y="61" fontSize="10" fill={textColor} fontWeight="bold">O</text>
        <text x="122" y="44" fontSize="11" fill={accentColor} fontWeight="bold">r</text>
        <text x="75" y="60" fontSize="10" fill={textColor}>d = 2r</text>
        <text x="100" y="125" fontSize="10" fill={auxColor} textAnchor="middle" fontWeight="bold">C = 2πr = πd</text>
      </svg>
    );
  } else {
    // Default Geometry Figure: General Olympiad Triangle with Altitude & Medians
    diagramContent = (
      <svg viewBox="0 0 200 130" className="w-full h-full">
        {/* Triangle ABC */}
        <polygon points="35,105 165,105 85,25" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {/* Dashed altitude h */}
        <line x1="85" y1="25" x2="85" y2="105" stroke={auxColor} strokeWidth="1.5" strokeDasharray="3,2" />
        <rect x="85" y="97" width="8" height="8" fill="none" stroke={auxColor} strokeWidth="1" />
        {/* Labels */}
        <text x="85" y="18" fontSize="11" fill={textColor} textAnchor="middle" fontWeight="bold">A</text>
        <text x="22" y="112" fontSize="11" fill={textColor} fontWeight="bold">B</text>
        <text x="175" y="112" fontSize="11" fill={textColor} fontWeight="bold">C</text>
        <text x="93" y="65" fontSize="10" fill={auxColor} fontWeight="bold">h</text>
        <text x="100" y="120" fontSize="11" fill={textColor} textAnchor="middle">base (b)</text>
        <text x="100" y="78" fontSize="9" fill={accentColor} textAnchor="middle" fontWeight="bold">A = ½ b · h</text>
      </svg>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col items-center justify-center transition-all ${
        isPaper
          ? 'bg-[#fbf9f4] border-[#e8e2d6] text-slate-800'
          : 'bg-slate-950/80 border-slate-800 text-slate-200'
      } ${className}`}
    >
      {!compact && (
        <div className="w-full flex items-center justify-between mb-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Minh họa hình học trực quan</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">Vector SVG</span>
        </div>
      )}
      <div className="w-full max-w-[280px] h-[135px] flex items-center justify-center">
        {diagramContent}
      </div>
    </div>
  );
};
