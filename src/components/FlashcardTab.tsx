import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, RotateCw, CheckCircle, ChevronDown, ChevronUp, Sparkles, Award } from 'lucide-react';
import { MathTerm, CardProgressMap, CategoryId } from '../types/math';
import { CATEGORIES } from '../data/mathVocabData';
import { MathView, MathText } from './MathView';
import { GeometryDiagram, isGeometryTerm } from './GeometryDiagram';
import { previewNextIntervals, isCardDue, getTodayString } from '../utils/sm2';
import { speakEnglish, playAudioFeedback } from '../utils/speech';

interface FlashcardTabProps {
  terms: MathTerm[];
  cardProgress: CardProgressMap;
  onReviewCard: (wordId: string, quality: 1 | 2 | 3 | 4) => void;
  onOpenAiForTerm: (term: MathTerm) => void;
  theme?: 'paper' | 'night';
}

export const FlashcardTab: React.FC<FlashcardTabProps> = ({
  terms,
  cardProgress,
  onReviewCard,
  onOpenAiForTerm,
  theme = 'paper',
}) => {
  const isPaper = theme === 'paper';
  const today = getTodayString();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [isCramMode, setIsCramMode] = useState(false);

  // Filtered pool
  const filteredTerms = useMemo(() => {
    if (selectedCategory === 'all') return terms;
    return terms.filter((t) => t.category === selectedCategory);
  }, [terms, selectedCategory]);

  // Due Queue
  const [dueQueueIds, setDueQueueIds] = useState<string[]>([]);
  const [sessionInitialTotal, setSessionInitialTotal] = useState<number>(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState<number>(0);

  // Initialize or update queue
  useEffect(() => {
    const due = filteredTerms.filter((term) => {
      if (isCramMode) return true;
      return isCardDue(cardProgress[term.id], today);
    });

    const ids = due.map((t) => t.id);
    setDueQueueIds(ids);
    setSessionInitialTotal(ids.length);
    setSessionCompletedCount(0);
    setIsFlipped(false);
    setShowSolution(false);
  }, [filteredTerms, isCramMode, today]);

  // Current Card
  const currentTermId = dueQueueIds[0];
  const currentTerm = useMemo(() => {
    return terms.find((t) => t.id === currentTermId);
  }, [terms, currentTermId]);

  const currentProgress = currentTerm ? cardProgress[currentTerm.id] : undefined;
  const currentCategory = currentTerm
    ? CATEGORIES.find((c) => c.id === currentTerm.category)
    : undefined;

  // Next intervals preview for the 4 SM-2 buttons
  const intervalsPreview = useMemo(() => {
    return previewNextIntervals(currentProgress);
  }, [currentProgress]);

  // Play audio
  const handlePronounce = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!currentTerm) return;
      speakEnglish(currentTerm.term, { rate: speechRate });
    },
    [currentTerm, speechRate]
  );

  // Pronounce example problem
  const handlePronounceProblem = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (!currentTerm) return;
      speakEnglish(currentTerm.olympiadWordProblem, { rate: speechRate });
    },
    [currentTerm, speechRate]
  );

  // Handle Flip
  const handleFlip = useCallback(() => {
    playAudioFeedback('flip');
    setIsFlipped((prev) => !prev);
  }, []);

  // Handle Review
  const handleRate = useCallback(
    (quality: 1 | 2 | 3 | 4) => {
      if (!currentTerm) return;

      if (quality === 1) {
        playAudioFeedback('wrong');
      } else {
        playAudioFeedback('correct');
      }

      onReviewCard(currentTerm.id, quality);

      // Session queue update
      setDueQueueIds((prev) => {
        const remaining = prev.slice(1);
        if (quality === 1) {
          return [...remaining, currentTerm.id];
        } else {
          setSessionCompletedCount((c) => c + 1);
          return remaining;
        }
      });

      setIsFlipped(false);
      setShowSolution(false);

      if (dueQueueIds.length === 1 && quality !== 1) {
        playAudioFeedback('complete');
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    },
    [currentTerm, onReviewCard, dueQueueIds.length]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleRate, isFlipped]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Category selector & Mode toggle */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 mb-6 p-2.5 rounded-2xl border transition-colors ${
          isPaper
            ? 'bg-white border-[#e5e0d6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]'
            : 'bg-slate-900/70 border-slate-800/90 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? isPaper
                  ? 'bg-[#ede8dd] text-slate-900 font-semibold border border-[#ded8cb]'
                  : 'bg-slate-800 text-white border border-slate-700/80 shadow-xs'
                : isPaper
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tất cả ({terms.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? isPaper
                    ? 'bg-[#ede8dd] text-slate-900 font-semibold border border-[#ded8cb]'
                    : 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-xs'
                  : isPaper
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{cat.nameVi}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs ml-auto">
          {/* Speech Rate */}
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${
              isPaper
                ? 'bg-[#f8f5ee] border-[#e2ddd3] text-slate-600'
                : 'bg-slate-950/70 border-slate-800/80 text-slate-400'
            }`}
          >
            <span>Giọng đọc:</span>
            <button
              onClick={() => setSpeechRate(0.8)}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                speechRate === 0.8
                  ? isPaper
                    ? 'bg-amber-200/70 text-amber-900 font-bold'
                    : 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : isPaper
                  ? 'hover:text-slate-900'
                  : 'hover:text-slate-200'
              }`}
            >
              0.8x
            </button>
            <button
              onClick={() => setSpeechRate(1.0)}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                speechRate === 1.0
                  ? isPaper
                    ? 'bg-amber-200/70 text-amber-900 font-bold'
                    : 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : isPaper
                  ? 'hover:text-slate-900'
                  : 'hover:text-slate-200'
              }`}
            >
              1.0x
            </button>
          </div>

          {/* Cram mode toggle */}
          <button
            onClick={() => setIsCramMode(!isCramMode)}
            className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium ${
              isCramMode
                ? isPaper
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : isPaper
                ? 'bg-[#f8f5ee] text-slate-600 border-[#e2ddd3] hover:text-slate-900'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isCramMode ? 'Chế độ: Ôn tự do' : 'Chế độ: Chu kỳ SM-2'}
          </button>
        </div>
      </div>

      {/* Main card or Congratulations screen */}
      {dueQueueIds.length === 0 ? (
        <div
          className={`border rounded-2xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-sm ${
            isPaper
              ? 'bg-white border-[#e5e0d6]'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div
            className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isPaper ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 border border-slate-700 text-emerald-400'
            }`}
          >
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2
            className={`text-2xl font-bold font-academic-serif mb-2 ${
              isPaper ? 'text-slate-900' : 'text-white'
            }`}
          >
            Mục Tiêu Ôn Tập Hôm Nay Đã Hoàn Thành
          </h2>
          <p className={`text-xs md:text-sm mb-6 leading-relaxed ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
            Thuật toán Spaced Repetition SM-2 đã tự động xếp lịch ôn tập tiếp theo vào các ngày tới để củng cố trí nhớ dài hạn.
          </p>

          <div
            className={`grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl border text-left text-xs ${
              isPaper
                ? 'bg-[#faf7f0] border-[#e6e1d5]'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div>
              <span className={`block mb-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Thuật ngữ đã ôn:
              </span>
              <p className={`text-base font-bold font-mono ${isPaper ? 'text-slate-800' : 'text-slate-200'}`}>
                {sessionCompletedCount || sessionInitialTotal} từ vựng
              </p>
            </div>
            <div>
              <span className={`block mb-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Trạng thái não bộ:
              </span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                Đã củng cố chu kỳ
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs">
            <button
              onClick={() => setIsCramMode(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm transition-all cursor-pointer"
            >
              Ôn tập tăng cường tự do
            </button>
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'all' ? 'number_theory' : 'all')}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer border ${
                isPaper
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-[#ddd7cc]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Đổi phân môn học
            </button>
          </div>
        </div>
      ) : currentTerm ? (
        <div>
          {/* Progress Header */}
          <div
            className={`flex items-center justify-between text-xs mb-2 px-1 ${
              isPaper ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>Còn lại: <strong className={isPaper ? 'text-slate-900 font-mono' : 'text-slate-200 font-mono'}>{dueQueueIds.length}</strong></span>
              <span>·</span>
              <span>Độ khó (EF): <strong className={isPaper ? 'text-slate-800 font-mono' : 'text-slate-300 font-mono'}>{currentProgress?.easeFactor?.toFixed(2) || '2.50'}</strong></span>
              <span>·</span>
              <span>Lặp lại: <strong className={isPaper ? 'text-slate-800 font-mono' : 'text-slate-300 font-mono'}>{currentProgress?.repetition || 0} lần</strong></span>
            </div>
            <div className={`hidden sm:block ${isPaper ? 'text-slate-500' : 'text-slate-500'}`}>
              Phím <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${isPaper ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>Space</kbd> lật thẻ · <kbd className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${isPaper ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>1 - 4</kbd> đánh giá
            </div>
          </div>

          {/* Progress bar */}
          <div
            className={`w-full h-1.5 rounded-full mb-6 overflow-hidden border ${
              isPaper ? 'bg-[#ede8de] border-[#dfd9ce]' : 'bg-slate-900 border-slate-800/80'
            }`}
          >
            <div
              className={`h-full transition-all duration-300 ${isPaper ? 'bg-indigo-600' : 'bg-indigo-500'}`}
              style={{
                width: `${
                  sessionInitialTotal > 0
                    ? Math.min(100, (sessionCompletedCount / sessionInitialTotal) * 100)
                    : 10
                }%`,
              }}
            />
          </div>

          {/* 3D Flashcard Monograph */}
          <div className="perspective-1000 mb-6 min-h-[460px] cursor-pointer" onClick={handleFlip}>
            <div
              className={`relative w-full min-h-[460px] duration-500 transform-style-3d transition-transform ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* ================= CARD FRONT ================= */}
              <div
                className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border p-6 md:p-8 flex flex-col justify-between transition-colors ${
                  isPaper
                    ? 'bg-white border-[#e2ddd3] shadow-[0_4px_24px_rgba(0,0,0,0.04)] paper-grid-bg'
                    : 'bg-[#0c101c] border-slate-800 shadow-xl night-grid-bg'
                }`}
              >
                {/* Monograph Top: Unboxed academic metadata */}
                <div
                  className={`flex items-center justify-between pb-4 border-b ${
                    isPaper ? 'border-[#eee9df]' : 'border-slate-800/80'
                  }`}
                >
                  <div className={`flex items-center gap-2 text-xs ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className={`font-semibold uppercase tracking-wider text-[11px] ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
                      {currentCategory?.nameVi}
                    </span>
                    <span aria-hidden="true" className={isPaper ? 'text-slate-400' : 'text-slate-600'}>·</span>
                    <span className="font-mono">{currentTerm.olympiadExam}</span>
                    <span aria-hidden="true" className={isPaper ? 'text-slate-400' : 'text-slate-600'}>·</span>
                    <span>{currentTerm.targetGrades}</span>
                  </div>

                  <button
                    onClick={handlePronounce}
                    title="Phát âm tiếng Anh chuẩn bản ngữ"
                    className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                      isPaper
                        ? 'bg-[#f9f7f2] hover:bg-[#ede8de] text-slate-700 border-[#ded8cb]'
                        : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700/80'
                    }`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Monograph Center: Authoritative Academic Serif Title */}
                <div className="text-center py-8">
                  <p
                    className={`text-xs font-mono uppercase tracking-widest mb-2 ${
                      isPaper ? 'text-slate-500 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    MATHEMATICAL VOCABULARY ({currentTerm.partOfSpeech})
                  </p>
                  <h2
                    className={`text-4xl md:text-5xl font-bold font-academic-serif tracking-normal mb-3 ${
                      isPaper ? 'text-slate-900' : 'text-slate-100'
                    }`}
                  >
                    {currentTerm.term}
                  </h2>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-mono mb-4 ${
                      isPaper
                        ? 'bg-[#f7f4ec] border-[#e0dad0] text-indigo-900'
                        : 'bg-slate-950/80 border-slate-800 text-indigo-300'
                    }`}
                  >
                    <span>{currentTerm.phonetic}</span>
                  </div>

                  {/* Geometric Illustration Thumbnail on Front Card - CHỈ HIỂN THỊ KHI LIÊN QUAN TỚI HÌNH HỌC */}
                  {isGeometryTerm(currentTerm) && (
                    <div className="mb-4 flex justify-center">
                      <div className="w-52 h-24 overflow-hidden rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700/50 p-1 flex items-center justify-center bg-emerald-50/20 dark:bg-emerald-950/20">
                        <GeometryDiagram term={currentTerm} theme={theme} compact className="w-full h-full border-none bg-transparent" />
                      </div>
                    </div>
                  )}

                  <p
                    className={`text-xs max-w-md mx-auto leading-relaxed ${
                      isPaper ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Khái niệm toán học cốt lõi trong các kỳ thi Olympic quốc tế THCS (Lớp 6 - 9).
                  </p>
                </div>

                {/* Monograph Bottom: Quiet Action */}
                <div
                  className={`flex items-center justify-between pt-4 border-t text-xs ${
                    isPaper ? 'border-[#eee9df] text-slate-600' : 'border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <RotateCw className={`w-3.5 h-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
                    <span>Bấm vào thẻ hoặc phím Space để xem Định nghĩa & Công thức</span>
                  </div>
                  <span className={`font-medium ${isPaper ? 'text-slate-800' : 'text-slate-300'}`}>
                    Lật thẻ [Space] →
                  </span>
                </div>
              </div>

              {/* ================= CARD BACK ================= */}
              <div
                className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border p-6 md:p-8 flex flex-col justify-between overflow-y-auto ${
                  isPaper
                    ? 'bg-white border-[#ded8cb] shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-slate-800'
                    : 'bg-[#0c101c] border-slate-700/90 shadow-xl text-slate-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Section I: Translation & Controls */}
                  <div
                    className={`flex items-center justify-between pb-3 border-b ${
                      isPaper ? 'border-[#eee9df]' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <span className={`text-[11px] font-mono uppercase tracking-wider ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                        Nghĩa Tiếng Việt
                      </span>
                      <h3
                        className={`text-2xl font-bold font-academic-serif mt-0.5 ${
                          isPaper ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        {currentTerm.vietnameseMeaning}{' '}
                        <span className={`text-sm font-normal font-sans ${isPaper ? 'text-indigo-700' : 'text-indigo-300'}`}>
                          ({currentTerm.term})
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePronounce}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isPaper
                            ? 'bg-[#f7f4ec] hover:bg-[#ede8dc] text-slate-700 border-[#ded8cb]'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                        }`}
                      >
                        <Volume2 className={`w-3.5 h-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
                        <span>Đọc từ</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAiForTerm(currentTerm);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                          isPaper
                            ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                            : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Phân tích</span>
                      </button>
                    </div>
                  </div>

                  {/* Section II: Formal Definitions */}
                  <div
                    className={`p-4 rounded-xl border space-y-2.5 text-xs leading-relaxed ${
                      isPaper
                        ? 'bg-[#fbf9f4] border-[#ece7de]'
                        : 'bg-slate-950/80 border-slate-800/90'
                    }`}
                  >
                    <div>
                      <span className={`font-semibold block text-[11px] uppercase tracking-wide ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                        1. Định nghĩa chuẩn mực (English):
                      </span>
                      <p className={`mt-0.5 font-serif text-sm ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        "{currentTerm.mathDefinition}"
                      </p>
                    </div>
                    <div className={`pt-2 border-t ${isPaper ? 'border-[#eee8dc]' : 'border-slate-900'}`}>
                      <span className={`font-semibold block text-[11px] uppercase tracking-wide ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
                        2. Diễn giải sư phạm (Tiếng Việt):
                      </span>
                      <p className={`mt-0.5 ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                        {currentTerm.vietnameseDefinition}
                      </p>
                    </div>
                  </div>

                  {/* Section II-B: Minh Họa Hình Học Trực Quan - CHỈ HIỂN THỊ KHI LIÊN QUAN TỚI HÌNH HỌC */}
                  {isGeometryTerm(currentTerm) && (
                    <GeometryDiagram term={currentTerm} theme={theme} />
                  )}

                  {/* Section III: Formula / Theorem Box */}
                  <div
                    className={`p-4 rounded-xl border text-left ${
                      isPaper
                        ? 'bg-[#f6f2e9] border-[#e2dcd0]'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase tracking-wide block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                      Công thức & Quy tắc tính toán (Formula & Rule):
                    </span>
                    <div className="py-1">
                      <MathView math={currentTerm.formulaOrRule} block className={isPaper ? 'text-slate-900 text-sm' : 'text-slate-100 text-sm'} />
                    </div>
                  </div>

                  {/* Section IV: Authentic Olympiad Contest Problem */}
                  <div
                    className={`p-4 rounded-xl border text-left ${
                      isPaper
                        ? 'bg-[#fbf9f4] border-[#ece7de]'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Award className={`w-3.5 h-3.5 ${isPaper ? 'text-amber-700' : 'text-amber-400'}`} />
                        <span className={`text-xs font-semibold ${isPaper ? 'text-amber-900' : 'text-amber-300'}`}>
                          Bài toán Olympic ({currentTerm.olympiadExam})
                        </span>
                      </div>
                      <button
                        onClick={handlePronounceProblem}
                        className={`text-[11px] flex items-center gap-1 cursor-pointer ${
                          isPaper ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Nghe đề</span>
                      </button>
                    </div>
                    <div className={`text-xs leading-relaxed italic mb-2 font-serif ${isPaper ? 'text-slate-800' : 'text-slate-300'}`}>
                      <MathText text={currentTerm.olympiadWordProblem} />
                    </div>

                    {/* Expandable Solution */}
                    <div className={`pt-2 border-t ${isPaper ? 'border-[#eee8dc]' : 'border-slate-900'}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSolution(!showSolution);
                        }}
                        className={`flex items-center justify-between w-full text-xs font-medium cursor-pointer ${
                          isPaper ? 'text-emerald-800 hover:text-emerald-900' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        <span>{showSolution ? 'Thu gọn lời giải' : 'Xem lời giải & bước tư duy'}</span>
                        {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {showSolution && (
                        <div
                          className={`mt-2 p-3 rounded-lg border text-xs leading-relaxed space-y-1 ${
                            isPaper
                              ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                          <p className={`font-semibold ${isPaper ? 'text-emerald-900' : 'text-emerald-400'}`}>
                            Hướng dẫn giải chi tiết:
                          </p>
                          <MathText text={currentTerm.solution} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section V: Linguistic Etymology */}
                  {currentTerm.etymology && (
                    <div
                      className={`text-[11px] px-3 py-2 rounded-lg border ${
                        isPaper
                          ? 'bg-[#f7f4ec] border-[#e2ddd3] text-slate-600'
                          : 'bg-slate-950/50 border-slate-800/70 text-slate-400'
                      }`}
                    >
                      <strong className={isPaper ? 'text-slate-800' : 'text-slate-300'}>Gốc từ ngữ học:</strong> {currentTerm.etymology}
                    </div>
                  )}
                </div>

                <div
                  className={`pt-3 text-center text-xs border-t ${
                    isPaper ? 'border-[#eee9df] text-slate-500' : 'border-slate-800 text-slate-500'
                  }`}
                >
                  Chọn phản xạ trí nhớ theo thuật toán Spaced Repetition SM-2:
                </div>
              </div>
            </div>
          </div>

          {/* ================= 4 REFLEX BUTTONS: EYE-FRIENDLY & ELEGANT ================= */}
          <div
            className={`p-4 rounded-2xl border shadow-sm transition-colors ${
              isPaper
                ? 'bg-white border-[#e5e0d6]'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div
              className={`text-[11px] font-mono uppercase tracking-wider text-center mb-3 ${
                isPaper ? 'text-slate-500 font-semibold' : 'text-slate-400'
              }`}
            >
              ĐÁNH GIÁ PHẢN XẠ TRÍ NHỚ (SPACED REPETITION SM-2)
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* 🔴 NÚT 1. LẠI (Again / Quality = 1) */}
              <button
                onClick={() => handleRate(1)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors cursor-pointer group shadow-xs active:scale-98 ${
                  isPaper
                    ? 'bg-[#fff5f5] hover:bg-[#ffebeb] border-rose-200/90 text-rose-900'
                    : 'bg-slate-950 hover:bg-slate-900 border-rose-900/60 text-rose-300'
                }`}
              >
                <div className={`font-bold text-sm mb-0.5 ${isPaper ? 'text-rose-800' : 'text-rose-400'}`}>
                  1. LẠI (Again)
                </div>
                <span className={`text-[11px] ${isPaper ? 'text-slate-600' : 'text-slate-300'}`}>
                  Quên hoàn toàn
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${isPaper ? 'text-rose-700 font-semibold' : 'text-rose-300/80'}`}>
                  Ôn lại: {intervalsPreview[1]}
                </span>
                <span className={`text-[9px] mt-1 font-mono ${isPaper ? 'text-slate-400' : 'text-slate-500'}`}>
                  Phím [1]
                </span>
              </button>

              {/* 🟠 NÚT 2. KHÓ (Hard / Quality = 2) */}
              <button
                onClick={() => handleRate(2)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors cursor-pointer group shadow-xs active:scale-98 ${
                  isPaper
                    ? 'bg-[#fffbeb] hover:bg-[#fef3c7] border-amber-200/90 text-amber-900'
                    : 'bg-slate-950 hover:bg-slate-900 border-amber-900/60 text-amber-300'
                }`}
              >
                <div className={`font-bold text-sm mb-0.5 ${isPaper ? 'text-amber-800' : 'text-amber-400'}`}>
                  2. KHÓ (Hard)
                </div>
                <span className={`text-[11px] ${isPaper ? 'text-slate-600' : 'text-slate-300'}`}>
                  Chưa trơn tru
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${isPaper ? 'text-amber-700 font-semibold' : 'text-amber-300/80'}`}>
                  Ôn lại: {intervalsPreview[2]}
                </span>
                <span className={`text-[9px] mt-1 font-mono ${isPaper ? 'text-slate-400' : 'text-slate-500'}`}>
                  Phím [2]
                </span>
              </button>

              {/* 🟢 NÚT 3. TỐT (Good / Quality = 3) */}
              <button
                onClick={() => handleRate(3)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors cursor-pointer group shadow-xs active:scale-98 ${
                  isPaper
                    ? 'bg-[#f0fdf4] hover:bg-[#dcfce7] border-emerald-200/90 text-emerald-900'
                    : 'bg-slate-950 hover:bg-slate-900 border-emerald-900/60 text-emerald-300'
                }`}
              >
                <div className={`font-bold text-sm mb-0.5 ${isPaper ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  3. TỐT (Good)
                </div>
                <span className={`text-[11px] ${isPaper ? 'text-slate-600' : 'text-slate-300'}`}>
                  Tốc độ tự nhiên
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${isPaper ? 'text-emerald-700 font-semibold' : 'text-emerald-300/80'}`}>
                  Ôn lại: {intervalsPreview[3]}
                </span>
                <span className={`text-[9px] mt-1 font-mono ${isPaper ? 'text-slate-400' : 'text-slate-500'}`}>
                  Phím [3]
                </span>
              </button>

              {/* 🔵 NÚT 4. DỄ (Easy / Quality = 4) */}
              <button
                onClick={() => handleRate(4)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors cursor-pointer group shadow-xs active:scale-98 ${
                  isPaper
                    ? 'bg-[#eef2ff] hover:bg-[#e0e7ff] border-indigo-200/90 text-indigo-900'
                    : 'bg-slate-950 hover:bg-slate-900 border-indigo-900/60 text-indigo-300'
                }`}
              >
                <div className={`font-bold text-sm mb-0.5 ${isPaper ? 'text-indigo-800' : 'text-indigo-400'}`}>
                  4. DỄ (Easy)
                </div>
                <span className={`text-[11px] ${isPaper ? 'text-slate-600' : 'text-slate-300'}`}>
                  Phản xạ tức thì
                </span>
                <span className={`text-[10px] font-mono mt-0.5 ${isPaper ? 'text-indigo-700 font-semibold' : 'text-indigo-300/80'}`}>
                  Ôn lại: {intervalsPreview[4]}
                </span>
                <span className={`text-[9px] mt-1 font-mono ${isPaper ? 'text-slate-400' : 'text-slate-500'}`}>
                  Phím [4]
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
