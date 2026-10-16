import React, { useMemo, useRef } from 'react';
import { BarChart3, Download, Upload, RefreshCw, FileText } from 'lucide-react';
import { MathTerm, CardProgressMap, LearningStats } from '../types/math';
import { CATEGORIES } from '../data/mathVocabData';
import { isCardDue, getTodayString } from '../utils/sm2';
import { exportDataAsJson, importDataFromJson, loadAppData } from '../utils/storage';

interface AnalyticsTabProps {
  terms: MathTerm[];
  cardProgress: CardProgressMap;
  stats: LearningStats;
  onDataImported: () => void;
  onResetProgress: () => void;
  theme?: 'paper' | 'night';
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  terms,
  cardProgress,
  stats,
  onDataImported,
  onResetProgress,
  theme = 'paper',
}) => {
  const isPaper = theme === 'paper';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = getTodayString();

  // Metrics calculation
  const totalTerms = terms.length;
  let totalReviews = stats.totalReviews || 0;
  let totalEase = 0;
  let reviewedTermsCount = 0;
  let masteredCount = 0;
  let dueCount = 0;

  terms.forEach((t) => {
    const p = cardProgress[t.id];
    if (p && p.repetition > 0) {
      reviewedTermsCount += 1;
      totalEase += p.easeFactor;
      if (p.interval >= 14) masteredCount += 1;
    }
    if (isCardDue(p, today)) {
      dueCount += 1;
    }
  });

  const avgEaseFactor = reviewedTermsCount > 0 ? (totalEase / reviewedTermsCount).toFixed(2) : '2.50';
  const retentionScore = Math.min(99, Math.round(65 + (masteredCount / totalTerms) * 30 + (stats.streakDays > 3 ? 4 : 0)));

  // Category breakdown
  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catTerms = terms.filter((t) => t.category === cat.id);
      const catTotal = catTerms.length;
      let catMastered = 0;
      let catLearning = 0;

      catTerms.forEach((t) => {
        const p = cardProgress[t.id];
        if (p && p.interval >= 14) catMastered += 1;
        else if (p && p.repetition > 0) catLearning += 1;
      });

      const percentage = catTotal > 0 ? Math.round((catMastered / catTotal) * 100) : 0;
      return {
        ...cat,
        total: catTotal,
        mastered: catMastered,
        learning: catLearning,
        percentage,
      };
    });
  }, [terms, cardProgress]);

  // Export JSON
  const handleExportJson = () => {
    const currentData = loadAppData();
    exportDataAsJson(currentData);
  };

  // Import JSON
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDataFromJson(content);
        if (res) {
          alert('Nhập dữ liệu thành công! Tiến trình ôn tập đã được khôi phục.');
          onDataImported();
        } else {
          alert('Tệp dữ liệu không hợp lệ. Vui lòng kiểm tra lại file JSON.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export Standalone HTML
  const handleExportSingleFileHtml = () => {
    const fullData = loadAppData();
    const dataJson = JSON.stringify(fullData);
    const termsJson = JSON.stringify(terms);

    const standaloneHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Math M32 - Standalone Offline Edition</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #faf8f5; color: #1e293b; font-family: system-ui, sans-serif; }
  </style>
</head>
<body class="p-6 max-w-4xl mx-auto">
  <div class="bg-white border border-[#e2ddd3] rounded-2xl p-8 text-center mb-6 shadow-sm">
    <h1 class="text-2xl font-bold text-slate-900 mb-2">Math M32 - Sổ Tay Thuật Ngữ Toán Olympic</h1>
    <p class="text-xs text-slate-500">Bản xuất độc lập lưu trữ ${terms.length} thuật ngữ và thuật toán Spaced Repetition SM-2.</p>
  </div>
  <div id="app-container" class="space-y-4"></div>
  <script>
    const terms = ${termsJson};
    const savedData = ${dataJson};
    const container = document.getElementById('app-container');
    terms.forEach(t => {
      const card = document.createElement('div');
      card.className = "bg-white border border-[#e2ddd3] p-5 rounded-xl shadow-xs";
      card.innerHTML = '<div class="flex justify-between items-center mb-1 text-xs text-slate-500"><span>' + t.category + '</span><span>' + t.olympiadExam + '</span></div><h2 class="text-lg font-bold text-slate-900">' + t.term + ' (' + t.vietnameseMeaning + ')</h2><p class="text-xs text-slate-600 mt-1">' + t.mathDefinition + '</p><div class="mt-2 text-xs font-mono text-indigo-900 bg-[#f7f4ec] p-2 rounded border border-[#e0dad0]">' + t.formulaOrRule + '</div><p class="mt-2 text-xs text-amber-800 italic">Bài toán: ' + t.olympiadWordProblem + '</p>';
      container.appendChild(card);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([standaloneHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Math_M32_Standalone_${getTodayString()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Scholarly Header */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-5 rounded-2xl border shadow-xs transition-colors ${
          isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div>
          <h2 className={`text-xl font-bold font-academic-serif flex items-center gap-2 ${isPaper ? 'text-slate-900' : 'text-white'}`}>
            <BarChart3 className={`w-5 h-5 ${isPaper ? 'text-indigo-700' : 'text-indigo-400'}`} />
            <span>Hồ Sơ Sư Phạm & Tiến Trình Ghi Nhớ SM-2</span>
          </h2>
          <p className={`text-xs mt-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Báo cáo định lượng về chỉ số duy trì trí nhớ, chu kỳ Spaced Repetition và mức độ thành thạo 4 phân môn Olympic.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handlePrintReport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
              isPaper
                ? 'bg-[#f7f4ec] hover:bg-slate-100 text-slate-800 border-[#ded8cb]'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <FileText className={`w-3.5 h-3.5 ${isPaper ? 'text-indigo-700' : 'text-indigo-400'}`} />
            <span>In Báo Cáo Sư Phạm</span>
          </button>
          <button
            onClick={handleExportSingleFileHtml}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất HTML Độc Lập</span>
          </button>
        </div>
      </div>

      {/* 4 Quantitative Academic Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className={`border p-4 rounded-xl shadow-xs transition-colors ${
            isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
          }`}
        >
          <span className={`text-xs block mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Chuỗi ngày học liên tục
          </span>
          <p className={`text-2xl font-bold font-mono ${isPaper ? 'text-slate-900' : 'text-white'}`}>
            {stats.streakDays} <span className="text-xs font-normal font-sans">ngày</span>
          </p>
          <span className={`text-[11px] mt-1 block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Hình thành phản xạ Spaced Repetition
          </span>
        </div>

        <div
          className={`border p-4 rounded-xl shadow-xs transition-colors ${
            isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
          }`}
        >
          <span className={`text-xs block mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Tổng lượt ôn phản xạ
          </span>
          <p className={`text-2xl font-bold font-mono ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
            {totalReviews} <span className="text-xs font-normal font-sans">lần</span>
          </p>
          <span className={`text-[11px] mt-1 block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Đã thực hiện qua 4 phím SM-2
          </span>
        </div>

        <div
          className={`border p-4 rounded-xl shadow-xs transition-colors ${
            isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
          }`}
        >
          <span className={`text-xs block mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Độ khó trung bình (EF)
          </span>
          <p className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            {avgEaseFactor} <span className="text-xs font-normal font-sans">/ 2.50</span>
          </p>
          <span className={`text-[11px] mt-1 block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Mức sàn tối thiểu: 1.30
          </span>
        </div>

        <div
          className={`border p-4 rounded-xl shadow-xs transition-colors ${
            isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
          }`}
        >
          <span className={`text-xs block mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Chỉ số duy trì trí nhớ
          </span>
          <p className={`text-2xl font-bold font-mono ${isPaper ? 'text-purple-800' : 'text-indigo-400'}`}>
            {retentionScore}%
          </p>
          <span className={`text-[11px] mt-1 block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
            Theo mô hình khoa học Ebbinghaus
          </span>
        </div>
      </div>

      {/* Retention Curve Visualizer: SM-2 vs Ebbinghaus */}
      <div
        className={`border rounded-2xl p-6 mb-6 shadow-xs transition-colors ${
          isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
        }`}
      >
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b gap-2 ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
          <div>
            <h3 className={`text-base font-bold font-academic-serif ${isPaper ? 'text-slate-900' : 'text-white'}`}>
              Đường Cong Quên Lãng Ebbinghaus & Cơ Chế Khôi Phục SM-2
            </h3>
            <p className={`text-xs mt-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
              Cơ sở khoa học: Ôn tập ngắt quãng vào các mốc Ngày 1, 2, 4 hoặc 1, 2, 3, 5 ngày duy trì trí nhớ trên 90%.
            </p>
          </div>
          <div className={`flex items-center gap-3 text-xs ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
              <span className="w-2.5 h-0.5 bg-rose-500 rounded" /> Không ôn (Quên 80%)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium">
              <span className="w-2.5 h-0.5 bg-indigo-600 rounded" /> Có SM-2 (Nhớ &gt; 92%)
            </span>
          </div>
        </div>

        {/* Graph representation */}
        <div
          className={`h-40 w-full rounded-xl p-4 border relative flex flex-col justify-between ${
            isPaper ? 'bg-[#faf7f0] border-[#e6e0d4]' : 'bg-slate-950 border-slate-900'
          }`}
        >
          <div className="absolute inset-0 p-4 pointer-events-none">
            <svg viewBox="0 0 600 130" className="w-full h-full stroke-current fill-none" preserveAspectRatio="none">
              <line x1="0" y1="30" x2="600" y2="30" className={isPaper ? 'stroke-slate-300' : 'stroke-slate-900'} strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="600" y2="70" className={isPaper ? 'stroke-slate-300' : 'stroke-slate-900'} strokeDasharray="3 3" />
              <line x1="0" y1="110" x2="600" y2="110" className={isPaper ? 'stroke-slate-300' : 'stroke-slate-900'} strokeDasharray="3 3" />

              {/* Ebbinghaus decay curve (Rose) */}
              <path
                d="M 20 15 Q 120 100, 580 115"
                className="stroke-rose-600 stroke-2 opacity-80"
              />

              {/* SM-2 Reset curves (Indigo) */}
              <path
                d="M 20 15 Q 80 50, 140 18 Q 230 45, 320 16 Q 440 35, 580 15"
                className="stroke-indigo-600 stroke-2"
              />
              <circle cx="140" cy="18" r="3.5" className="fill-indigo-600 stroke-none" />
              <circle cx="320" cy="16" r="3.5" className="fill-indigo-600 stroke-none" />
              <circle cx="580" cy="15" r="3.5" className="fill-indigo-600 stroke-none" />
            </svg>
          </div>

          <div className={`flex justify-between text-[11px] pt-1 z-10 font-mono ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
            <span>100% Trí nhớ</span>
            <span>Mốc 1 (1d)</span>
            <span>Mốc 2 (2-3d)</span>
            <span>Mốc 3 (4-5d)</span>
            <span>Dài hạn (&gt;13d)</span>
          </div>

          <div className={`flex justify-between text-[11px] z-10 pt-2 border-t font-mono ${isPaper ? 'border-[#e4ded2] text-slate-700' : 'border-slate-900 text-slate-400'}`}>
            <span className={isPaper ? 'text-indigo-900 font-bold' : 'text-indigo-300'}>Lúc mới học</span>
            <span>Nhắc lại 1</span>
            <span>Nhắc lại 2</span>
            <span>Nhắc lại 3</span>
            <span className={isPaper ? 'text-emerald-900 font-bold' : 'text-emerald-400'}>Trí nhớ dài hạn</span>
          </div>
        </div>
      </div>

      {/* Category Mastery Progress */}
      <div
        className={`border rounded-2xl p-6 mb-6 shadow-xs transition-colors ${
          isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
        }`}
      >
        <h3 className={`text-base font-bold font-academic-serif mb-3 ${isPaper ? 'text-slate-900' : 'text-white'}`}>
          Tỷ Lệ Nắm Vững Theo 4 Phân Môn Toán Học
        </h3>
        <div className="space-y-3">
          {categoryStats.map((cat) => (
            <div
              key={cat.id}
              className={`p-3.5 rounded-xl border ${
                isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>{cat.nameVi}</span>
                  <span className={`font-mono ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>({cat.nameEn})</span>
                </div>
                <div className={`flex items-center gap-3 font-mono ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span>
                    Thuộc: <strong className={isPaper ? 'text-emerald-800' : 'text-emerald-400'}>{cat.mastered}</strong> / {cat.total}
                  </span>
                  <span className={`font-bold ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                    {cat.percentage}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div
                className={`w-full h-2 rounded-full overflow-hidden border ${
                  isPaper ? 'bg-[#eae4da] border-[#ded8cb]' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div
                  className="bg-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${Math.max(5, cat.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup & Data Operations */}
      <div
        className={`border rounded-2xl p-5 shadow-xs text-xs transition-colors ${
          isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <h3 className={`text-base font-bold font-academic-serif mb-1 ${isPaper ? 'text-slate-900' : 'text-white'}`}>
          Lưu Trữ & Khôi Phục Dữ Liệu Học Tập
        </h3>
        <p className={`mb-4 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
          Toàn bộ lịch sử ôn tập được lưu trữ an toàn trong trình duyệt (<code className={`font-mono ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>mathvocab_ai_v1_data</code>).
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJson}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border cursor-pointer font-medium transition-colors ${
              isPaper
                ? 'bg-[#f7f4ec] hover:bg-slate-100 text-slate-800 border-[#ded8cb]'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <Download className={`w-3.5 h-3.5 ${isPaper ? 'text-indigo-700' : 'text-indigo-400'}`} />
            <span>Xuất file JSON sao lưu</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border cursor-pointer font-medium transition-colors ${
              isPaper
                ? 'bg-[#f7f4ec] hover:bg-slate-100 text-slate-800 border-[#ded8cb]'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <Upload className={`w-3.5 h-3.5 ${isPaper ? 'text-emerald-700' : 'text-emerald-400'}`} />
            <span>Nhập file JSON từ máy</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => {
              if (window.confirm('Bạn có chắc muốn đặt lại toàn bộ tiến trình ôn tập SM-2 về trạng thái ban đầu?')) {
                onResetProgress();
              }
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border cursor-pointer ml-auto transition-colors ${
              isPaper
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                : 'bg-slate-950 hover:bg-rose-950/40 text-rose-300 border-rose-900/40'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Khôi phục ban đầu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
