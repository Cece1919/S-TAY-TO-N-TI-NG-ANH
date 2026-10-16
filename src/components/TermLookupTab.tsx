import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Search,
  Sparkles,
  Plus,
  CheckCircle,
  Volume2,
  BookOpen,
  Award,
  Compass,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Key,
  Layers,
  HelpCircle,
  FileText
} from 'lucide-react';
import { MathTerm, CategoryId } from '../types/math';
import { CATEGORIES } from '../data/mathVocabData';
import { lookupAndGenerateMathTerm } from '../utils/offlineBrain';
import { speakEnglish, playChime } from '../utils/speech';
import { MathView } from './MathView';
import { GeometryDiagram, isGeometryTerm } from './GeometryDiagram';

interface TermLookupTabProps {
  existingTerms: MathTerm[];
  onAddTerm: (term: MathTerm) => void;
  onNavigateToFlashcards: (termId?: string) => void;
  savedApiKey: string;
  onSaveApiKey: (key: string) => void;
  theme: 'paper' | 'night';
}

const POPULAR_SEARCH_SUGGESTIONS = [
  { label: 'Đường tròn nội tiếp (Inscribed circle)', query: 'Inscribed circle' },
  { label: 'Bộ ba Pythagore (Pythagorean triple)', query: 'Pythagorean triple' },
  { label: 'Cấp số nhân (Geometric progression)', query: 'Geometric progression' },
  { label: 'Tứ giác nội tiếp (Cyclic quadrilateral)', query: 'Cyclic quadrilateral' },
  { label: 'Đồng dư thức (Modular congruence)', query: 'Modular congruence' },
  { label: 'Giai thừa (Factorial)', query: 'Factorial' },
  { label: 'Hình thang (Trapezoid)', query: 'Trapezoid' },
  { label: 'Hình thoi (Rhombus)', query: 'Rhombus' },
  { label: 'Hình bình hành (Parallelogram)', query: 'Parallelogram' },
  { label: 'Số chính phương (Square number)', query: 'Square number' },
];

export const TermLookupTab: React.FC<TermLookupTabProps> = ({
  existingTerms,
  onAddTerm,
  onNavigateToFlashcards,
  savedApiKey,
  onSaveApiKey,
  theme,
}) => {
  const isPaper = theme === 'paper';
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<MathTerm | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(savedApiKey);
  const [recentAdded, setRecentAdded] = useState<MathTerm[]>([]);

  // Check if current result is already in the existing deck
  const isAlreadyInDeck = useMemo(() => {
    if (!currentResult) return false;
    const lowerResult = currentResult.term.toLowerCase().trim();
    return existingTerms.some(
      (t) => t.term.toLowerCase().trim() === lowerResult || t.id === currentResult.id
    );
  }, [currentResult, existingTerms]);

  // Handle Search
  const handleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!q) return;

    setIsLoading(true);
    setStatusMessage(null);
    setShowSolution(false);

    try {
      // First check if term already exists in local list
      const exactMatch = existingTerms.find(
        (t) =>
          t.term.toLowerCase() === q.toLowerCase() ||
          t.vietnameseMeaning.toLowerCase() === q.toLowerCase()
      );

      if (exactMatch) {
        setCurrentResult(exactMatch);
        setStatusMessage({
          text: `Thuật ngữ "${exactMatch.term}" đã có sẵn trong sổ tay của bạn.`,
          type: 'info',
        });
        setIsLoading(false);
        return;
      }

      // Generate or lookup via AI / Offline Brain
      const generated = await lookupAndGenerateMathTerm(q, savedApiKey);
      setCurrentResult(generated);
      setStatusMessage({
        text: `Đã tra cứu thành công! AI đã tổng hợp đầy đủ định nghĩa, công thức KaTeX, đề Olympic và gốc từ.`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Lookup failed:', err);
      setStatusMessage({
        text: 'Có lỗi trong quá trình tra cứu. Vui lòng thử lại với từ khóa khác.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Adding term to Deck
  const handleAddToDeck = () => {
    if (!currentResult) return;

    // Check if already in deck
    if (isAlreadyInDeck) {
      setStatusMessage({
        text: `Thuật ngữ "${currentResult.term}" đã tồn tại trong bộ thẻ học!`,
        type: 'info',
      });
      return;
    }

    onAddTerm(currentResult);
    setRecentAdded((prev) => [currentResult, ...prev]);

    // Sound and celebration
    playChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    setStatusMessage({
      text: `🎉 Tuyệt vời! Đã thêm "${currentResult.term}" vào bộ Flashcard ôn tập hôm nay.`,
      type: 'success',
    });
  };

  const handleSaveKey = () => {
    onSaveApiKey(apiKeyInput.trim());
    setShowApiKeyInput(false);
    setStatusMessage({
      text: 'Đã lưu cấu hình Google Gemini API Key.',
      type: 'success',
    });
  };

  const categoryInfo = currentResult
    ? CATEGORIES.find((c) => c.id === currentResult.category) || CATEGORIES[0]
    : CATEGORIES[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          isPaper
            ? 'bg-[#fcfbf7] border-[#e8e4dc] shadow-xs'
            : 'bg-[#151c2c] border-slate-800 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isPaper
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                }`}
              >
                <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1
                className={`text-xl font-bold font-academic-serif tracking-tight ${
                  isPaper ? 'text-slate-900' : 'text-white'
                }`}
              >
                Tra Cứu Thuật Ngữ Toán Học AI
              </h1>
              <span
                className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full ${
                  isPaper
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-slate-900 text-slate-300 border border-slate-700'
                }`}
              >
                Olympic & Song Ngữ
              </span>
            </div>
            <p className={`text-xs md:text-sm ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
              Nhập từ khóa bất kỳ (Tiếng Anh hoặc Tiếng Việt). AI sẽ phân tích và biên soạn trọn bộ
              thông tin học thuật chuẩn Olympic để bạn thêm ngay vào thẻ Flashcard.
            </p>
          </div>

          {/* Quick API Key toggle */}
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl border font-medium cursor-pointer transition-colors self-start md:self-auto ${
              isPaper
                ? 'bg-white border-[#dfd9ce] text-slate-700 hover:bg-amber-50/50'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{savedApiKey ? 'Đã cài Gemini Key' : 'Tùy chọn Gemini Key'}</span>
          </button>
        </div>

        {/* Expandable API Key Box */}
        {showApiKeyInput && (
          <div
            className={`mt-4 p-4 rounded-xl border text-xs space-y-3 ${
              isPaper
                ? 'bg-amber-50/50 border-amber-200/80 text-slate-700'
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Cấu hình Gemini AI Key (Không bắt buộc)
              </span>
              <span className={`text-[11px] ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Hệ thống luôn có sẵn Offline Fallback Brain hoạt động 100% ngoại tuyến
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Dán Gemini API Key (AIzaSy...)"
                className={`flex-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none ${
                  isPaper
                    ? 'bg-white border-[#d8d3c8] text-slate-900 focus:border-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-indigo-400'
                }`}
              />
              <button
                onClick={handleSaveKey}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium cursor-pointer transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        )}

        {/* Search Input Bar */}
        <div className="mt-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isPaper ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập thuật ngữ: ví dụ 'Inscribed circle', 'Đường tròn ngoại tiếp', 'Pythagorean triple'..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${
                  isPaper
                    ? 'bg-white border-[#d8d3c8] text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                    : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Đang tra cứu...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tra Cứu Thuật Ngữ</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Popular Suggestions */}
        <div className="mt-4 pt-3 border-t border-dashed border-[#e4ded3] dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium">Gợi ý thuật ngữ Olympic thường gặp:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SEARCH_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchQuery(item.query);
                  handleSearch(item.query);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  isPaper
                    ? 'bg-white border-[#e0dad0] text-slate-700 hover:bg-amber-50 hover:border-amber-300'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 border transition-all ${
            statusMessage.type === 'success'
              ? isPaper
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : statusMessage.type === 'info'
              ? isPaper
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
              : isPaper
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          {isAlreadyInDeck && (
            <button
              onClick={() => onNavigateToFlashcards(currentResult?.id)}
              className="font-semibold underline shrink-0 hover:opacity-80 cursor-pointer flex items-center gap-1"
            >
              <span>Xem trong Flashcard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Result Card: Full Academic Specification */}
      {currentResult && (
        <div
          className={`rounded-2xl border transition-all overflow-hidden ${
            isPaper
              ? 'bg-[#fcfbf7] border-[#e8e4dc] shadow-sm'
              : 'bg-[#151c2c] border-slate-800 shadow-md'
          }`}
        >
          {/* Card Top Action Bar */}
          <div
            className={`p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isPaper ? 'bg-[#f7f4ec] border-[#e8e4dc]' : 'bg-[#111724] border-slate-800'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${categoryInfo.badgeBg} ${categoryInfo.color} border ${categoryInfo.borderColor}`}
              >
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.nameVi}</span>
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isPaper
                    ? 'bg-white text-slate-700 border-slate-300'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                {currentResult.targetGrades}
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                  isPaper
                    ? 'bg-amber-100/70 text-amber-900 border-amber-300'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}
              >
                {currentResult.olympiadExam}
              </span>
            </div>

            {/* Main Action Button: Add to Flashcard */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isAlreadyInDeck ? (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium border flex items-center gap-1.5 ${
                      isPaper
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Đã có trong Flashcard</span>
                  </span>
                  <button
                    onClick={() => onNavigateToFlashcards(currentResult.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl cursor-pointer transition-colors"
                  >
                    <span>Học thẻ này ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToDeck}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Bộ Thẻ Flashcard (Ôn Tập Ngay)</span>
                </button>
              )}
            </div>
          </div>

          {/* Card Body: Full Academic Specification */}
          <div className="p-6 space-y-6">
            {/* 1. Term & Pronunciation */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 pb-4 border-b border-[#eee8dc] dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2
                    className={`text-2xl font-bold font-academic-serif tracking-tight ${
                      isPaper ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {currentResult.term}
                  </h2>
                  <span
                    className={`text-xs italic px-2 py-0.5 rounded border ${
                      isPaper
                        ? 'bg-white text-slate-600 border-slate-300'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {currentResult.partOfSpeech}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                  <span>{currentResult.phonetic}</span>
                </div>
              </div>

              {/* Pronunciation Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakEnglish(currentResult.term, { rate: 1.0 })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    isPaper
                      ? 'bg-white border-[#d8d3c8] text-slate-700 hover:bg-amber-50'
                      : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Phát âm tiếng Anh chuẩn bản xứ"
                >
                  <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Phát âm (Chuẩn)</span>
                </button>
                <button
                  onClick={() => speakEnglish(currentResult.term, { rate: 0.8 })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isPaper
                      ? 'bg-white border-[#d8d3c8] text-slate-600 hover:bg-amber-50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                  title="Phát âm chậm 0.8x cho học sinh luyện nói"
                >
                  <span>0.8x</span>
                </button>
              </div>
            </div>

            {/* 2. Vietnamese Meaning */}
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isPaper
                  ? 'bg-amber-50/60 border-amber-200/70 text-slate-900'
                  : 'bg-indigo-950/20 border-indigo-900/40 text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-800 dark:text-amber-400">
                  Nghĩa Tiếng Việt:
                </span>
                <span className="text-base font-bold font-academic-serif">
                  {currentResult.vietnameseMeaning}
                </span>
              </div>
            </div>

            {/* 3. Bilingual Definitions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-xl border space-y-1.5 ${
                  isPaper
                    ? 'bg-white border-[#e6e0d4]'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Formal Mathematical Definition (English)</span>
                </div>
                <p className={`text-xs leading-relaxed ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                  {currentResult.mathDefinition}
                </p>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-1.5 ${
                  isPaper
                    ? 'bg-white border-[#e6e0d4]'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Giải Thích Sư Phạm (Tiếng Việt)</span>
                </div>
                <p className={`text-xs leading-relaxed ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                  {currentResult.vietnameseDefinition}
                </p>
              </div>
            </div>

            {/* Geometric Illustration - CHỈ HIỂN THỊ KHI THUẬT NGỮ LIÊN QUAN TỚI HÌNH HỌC */}
            {isGeometryTerm(currentResult) && (
              <GeometryDiagram term={currentResult} theme={theme} />
            )}

            {/* 4. Mathematical Formula / Rule in KaTeX */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isPaper
                  ? 'bg-amber-50/30 border-amber-200/80'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                  <span>∑</span> Công Thức Toán Học & Định Lý Trọng Tâm (KaTeX LaTeX)
                </span>
                <span className="text-[11px] font-mono text-slate-500">Chuẩn ký hiệu quốc tế</span>
              </div>
              <div
                className={`py-3 px-4 rounded-lg flex items-center justify-center overflow-x-auto border ${
                  isPaper
                    ? 'bg-white border-[#e6e0d4] text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              >
                <MathView math={currentResult.formulaOrRule} block className="text-sm font-mono" />
              </div>
            </div>

            {/* 5. Olympiad Word Problem & Step-by-Step Solution */}
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isPaper
                  ? 'bg-white border-[#e6e0d4]'
                  : 'bg-slate-900/70 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  <Award className="w-4 h-4" />
                  <span>Bài Toán Mẫu Olympic Chuẩn Đề Thi ({currentResult.olympiadExam})</span>
                </div>
                <button
                  onClick={() => speakEnglish(currentResult.olympiadWordProblem)}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                    isPaper
                      ? 'bg-amber-50 border-amber-200 text-slate-700 hover:bg-amber-100'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Đọc câu hỏi bài toán"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className={`text-xs md:text-sm font-medium leading-relaxed ${isPaper ? 'text-slate-800' : 'text-slate-200'}`}>
                {currentResult.olympiadWordProblem}
              </p>

              {/* Collapsible Solution */}
              <div className="pt-2 border-t border-dashed border-[#eee8dc] dark:border-slate-800">
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className={`w-full flex items-center justify-between py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    isPaper
                      ? 'bg-amber-50 text-amber-900 hover:bg-amber-100/70'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  <span>{showSolution ? 'Ẩn lời giải chi tiết' : 'Xem lời giải bước từng bước & Đáp số'}</span>
                  {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showSolution && (
                  <div
                    className={`mt-2 p-3.5 rounded-lg text-xs leading-relaxed space-y-1.5 border animate-fadeIn ${
                      isPaper
                        ? 'bg-[#fbf9f4] border-[#e8e2d6] text-slate-700'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                      Phương pháp giải toán Olympic:
                    </div>
                    <div className="whitespace-pre-line font-academic-serif">
                      {currentResult.solution}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Etymology & Mnemonic */}
            <div
              className={`p-4 rounded-xl border space-y-1.5 ${
                isPaper
                  ? 'bg-amber-50/40 border-amber-200/60 text-slate-700'
                  : 'bg-slate-900/50 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Gốc Từ Ngôn Ngữ & Mẹo Ghi Nhớ Sâu (Etymology & Mnemonic):</span>
              </div>
              <p className="text-xs leading-relaxed italic">
                {currentResult.etymology}
              </p>
            </div>

            {/* Bottom Add Action Prompt */}
            {!isAlreadyInDeck && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={handleAddToDeck}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs md:text-sm rounded-xl cursor-pointer transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Xác Nhận Thêm Vào Sổ Tay Flashcard</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recently Added in this Session */}
      {recentAdded.length > 0 && (
        <div
          className={`p-5 rounded-2xl border space-y-3 ${
            isPaper
              ? 'bg-[#fcfbf7] border-[#e8e4dc]'
              : 'bg-[#151c2c] border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3
              className={`text-xs font-bold uppercase tracking-wider ${
                isPaper ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Các thuật ngữ bạn vừa thêm vào Flashcard ({recentAdded.length})
            </h3>
            <button
              onClick={() => onNavigateToFlashcards()}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Vào học ngay</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {recentAdded.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setCurrentResult(item);
                  setShowSolution(false);
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isPaper
                    ? 'bg-white border-[#e6e0d4] hover:border-indigo-400 hover:shadow-xs'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-900 dark:text-white">{item.term}</div>
                <div className="text-slate-500 text-[11px] truncate">{item.vietnameseMeaning}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
