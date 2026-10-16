import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, EyeOff, Volume2, Sparkles, X, BookOpen, ChevronRight, Award } from 'lucide-react';
import { MathTerm, CardProgressMap, CategoryId } from '../types/math';
import { CATEGORIES } from '../data/mathVocabData';
import { MathView, MathText } from './MathView';
import { GeometryDiagram, isGeometryTerm } from './GeometryDiagram';
import { speakEnglish } from '../utils/speech';
import { isCardDue, getCardMasteryLevel, getTodayString } from '../utils/sm2';

interface VocabLibraryTabProps {
  terms: MathTerm[];
  cardProgress: CardProgressMap;
  onAddCustomTerm: (newTerm: MathTerm) => void;
  onSelectForAi: (term: MathTerm) => void;
  theme?: 'paper' | 'night';
}

export const VocabLibraryTab: React.FC<VocabLibraryTabProps> = ({
  terms,
  cardProgress,
  onAddCustomTerm,
  onSelectForAi,
  theme = 'paper',
}) => {
  const isPaper = theme === 'paper';
  const today = getTodayString();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'mastered' | 'new'>('all');
  const [activeRecallMode, setActiveRecallMode] = useState<boolean>(false);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Term Detail Modal
  const [detailModalTerm, setDetailModalTerm] = useState<MathTerm | null>(null);

  // Add Term Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTermData, setNewTermData] = useState<Partial<MathTerm>>({
    category: 'number_theory',
    term: '',
    phonetic: '',
    partOfSpeech: 'noun',
    vietnameseMeaning: '',
    mathDefinition: '',
    vietnameseDefinition: '',
    formulaOrRule: '',
    olympiadWordProblem: '',
    solution: '',
    etymology: '',
    targetGrades: 'Lớp 6 - 9',
    olympiadExam: 'TIMO / SASMO',
  });

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return terms.filter((term) => {
      // Category match
      if (selectedCategory !== 'all' && term.category !== selectedCategory) {
        return false;
      }

      // Status match
      const progress = cardProgress[term.id];
      if (statusFilter === 'due') {
        if (!isCardDue(progress, today)) return false;
      } else if (statusFilter === 'mastered') {
        if (!progress || progress.interval < 14) return false;
      } else if (statusFilter === 'new') {
        if (progress && progress.repetition > 0) return false;
      }

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match =
          term.term.toLowerCase().includes(query) ||
          term.vietnameseMeaning.toLowerCase().includes(query) ||
          term.mathDefinition.toLowerCase().includes(query) ||
          term.vietnameseDefinition.toLowerCase().includes(query) ||
          term.olympiadWordProblem.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [terms, selectedCategory, statusFilter, searchTerm, cardProgress, today]);

  // Toggle reveal for active recall
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Submit new term
  const handleCreateTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTermData.term || !newTermData.vietnameseMeaning) return;

    const term: MathTerm = {
      id: `custom_${Date.now()}`,
      category: (newTermData.category as CategoryId) || 'number_theory',
      term: newTermData.term.trim(),
      phonetic: newTermData.phonetic?.trim() || '/ˈmæθ.tɜːm/',
      partOfSpeech: newTermData.partOfSpeech || 'noun',
      vietnameseMeaning: newTermData.vietnameseMeaning.trim(),
      mathDefinition:
        newTermData.mathDefinition?.trim() ||
        'A mathematical term used in international middle school contests.',
      vietnameseDefinition:
        newTermData.vietnameseDefinition?.trim() ||
        'Thuật ngữ toán học dùng trong các kỳ thi học sinh giỏi.',
      formulaOrRule: newTermData.formulaOrRule?.trim() || 'Rule or formula applies.',
      olympiadWordProblem:
        newTermData.olympiadWordProblem?.trim() ||
        'A problem involving this mathematical concept.',
      solution: newTermData.solution?.trim() || 'Apply definition and solve step-by-step.',
      etymology: newTermData.etymology?.trim() || 'Mathematical terminology.',
      targetGrades: newTermData.targetGrades || 'Lớp 6 - 9',
      olympiadExam: newTermData.olympiadExam || 'TIMO / SASMO',
    };

    onAddCustomTerm(term);
    setIsAddModalOpen(false);
    setNewTermData({
      category: 'number_theory',
      term: '',
      phonetic: '',
      partOfSpeech: 'noun',
      vietnameseMeaning: '',
      mathDefinition: '',
      vietnameseDefinition: '',
      formulaOrRule: '',
      olympiadWordProblem: '',
      solution: '',
      etymology: '',
      targetGrades: 'Lớp 6 - 9',
      olympiadExam: 'TIMO / SASMO',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header controls bar */}
      <div
        className={`p-5 rounded-2xl border transition-colors mb-6 shadow-sm ${
          isPaper
            ? 'bg-white border-[#e5e0d6]'
            : 'bg-slate-900/60 border-slate-800/90'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2
              className={`text-xl font-bold font-academic-serif flex items-center gap-2 ${
                isPaper ? 'text-slate-900' : 'text-white'
              }`}
            >
              <BookOpen className={`w-5 h-5 ${isPaper ? 'text-indigo-700' : 'text-indigo-400'}`} />
              <span>Mục Lục & Từ Điển Khái Niệm Toán Học</span>
            </h2>
            <p className={`text-xs mt-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
              Tra cứu {terms.length} thuật ngữ cốt lõi · Phân loại theo 4 nhánh toán học THCS & Olympic
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Active Recall Switch */}
            <button
              onClick={() => {
                setActiveRecallMode(!activeRecallMode);
                setRevealedIds({});
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
                activeRecallMode
                  ? isPaper
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : isPaper
                  ? 'bg-[#f8f5ee] text-slate-700 border-[#e2ddd3] hover:bg-slate-100'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white'
              }`}
            >
              {activeRecallMode ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
              <span>Active Recall (Tự che nghĩa)</span>
            </button>

            {/* Add Custom Term Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm thuật ngữ</span>
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div
          className={`grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t ${
            isPaper ? 'border-[#eee8dc]' : 'border-slate-800/80'
          }`}
        >
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isPaper ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Tra cứu thuật ngữ tiếng Anh, nghĩa tiếng Việt, công thức..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border focus:outline-none transition-colors ${
                isPaper
                  ? 'bg-[#fcfbf9] text-slate-900 placeholder-slate-400 border-[#ded8cb] focus:border-indigo-600'
                  : 'bg-slate-950 text-slate-200 placeholder-slate-500 border-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* Category filter */}
          <div className="md:col-span-4 flex items-center gap-1 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === 'all'
                  ? isPaper
                    ? 'bg-[#ede8dd] text-slate-900 font-semibold border border-[#ded8cb]'
                    : 'bg-slate-800 text-white font-medium border border-slate-700/80'
                  : isPaper
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? isPaper
                      ? 'bg-[#ede8dd] text-slate-900 font-semibold border border-[#ded8cb]'
                      : 'bg-slate-800 text-slate-100 font-medium border border-slate-700/80'
                    : isPaper
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{cat.nameVi.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="md:col-span-3 flex items-center gap-1 justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={`text-xs rounded-xl px-3 py-2 border focus:outline-none w-full ${
                isPaper
                  ? 'bg-[#fcfbf9] border-[#ded8cb] text-slate-800 focus:border-indigo-600'
                  : 'bg-slate-950 border-slate-800 text-slate-300 focus:border-indigo-500'
              }`}
            >
              <option value="all">Mọi trạng thái ({terms.length})</option>
              <option value="due">Cần ôn hôm nay</option>
              <option value="mastered">Đã nắm vững</option>
              <option value="new">Chưa học</option>
            </select>
          </div>
        </div>
      </div>

      {/* Terms Lexicon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTerms.map((term) => {
          const category = CATEGORIES.find((c) => c.id === term.category);
          const progress = cardProgress[term.id];
          const due = isCardDue(progress, today);
          const mastery = getCardMasteryLevel(progress);
          const isRevealed = revealedIds[term.id];

          return (
            <div
              key={term.id}
              onClick={() => setDetailModalTerm(term)}
              className={`rounded-xl p-5 border transition-all flex flex-col justify-between group cursor-pointer shadow-xs relative ${
                isPaper
                  ? 'bg-white hover:bg-[#fbf9f4] border-[#e2ddd3] hover:border-indigo-300'
                  : 'bg-[#0c101c] hover:bg-[#0e1424] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header of card: Unboxed quiet metadata */}
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <div className={`flex items-center gap-1.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                    <span className={`font-semibold text-[11px] ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
                      {category?.nameVi.split(' ')[0]}
                    </span>
                    <span aria-hidden="true" className={isPaper ? 'text-slate-300' : 'text-slate-600'}>·</span>
                    <span className="font-mono text-[11px]">{term.olympiadExam}</span>
                  </div>

                  {/* Status */}
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      due
                        ? isPaper
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-900/50'
                        : mastery === 'mastered'
                        ? isPaper
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-900/50'
                        : isPaper
                        ? 'text-slate-600 bg-slate-100 border border-slate-200'
                        : 'text-slate-400 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {due ? 'Đến hạn ôn' : mastery === 'mastered' ? 'Đã thuộc' : `${progress?.interval || 1}d`}
                  </span>
                </div>

                {/* Term title and audio */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3
                    className={`text-xl font-bold font-academic-serif transition-colors ${
                      isPaper ? 'text-slate-900 group-hover:text-indigo-900' : 'text-slate-100 group-hover:text-indigo-200'
                    }`}
                  >
                    {term.term}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakEnglish(term.term);
                    }}
                    title="Nghe phát âm"
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      isPaper ? 'text-slate-400 hover:text-indigo-600' : 'text-slate-400 hover:text-indigo-300'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Phonetics & part of speech */}
                <div className={`text-xs font-mono mb-3 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>{term.phonetic}</span>
                  <span className={`mx-1.5 ${isPaper ? 'text-slate-300' : 'text-slate-600'}`}>·</span>
                  <span className="italic font-sans">{term.partOfSpeech}</span>
                </div>

                {/* Active recall mask or Meaning */}
                <div className="mb-3">
                  {activeRecallMode && !isRevealed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReveal(term.id);
                      }}
                      className={`w-full py-2 px-3 rounded-lg border border-dashed text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                        isPaper
                          ? 'bg-[#fcfbf9] border-[#cfc8bd] text-amber-800 hover:bg-amber-50'
                          : 'bg-slate-950/90 border-slate-700 text-amber-300 hover:bg-slate-900'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Nhấn để hé lộ bản dịch</span>
                    </button>
                  ) : (
                    <div
                      className={`p-2.5 rounded-lg border ${
                        isPaper
                          ? 'bg-[#fcfbf9] border-[#e8e4dc]'
                          : 'bg-slate-950 border-slate-800/80'
                      }`}
                    >
                      <p className={`text-xs font-semibold mb-0.5 ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                        {term.vietnameseMeaning}
                      </p>
                      <p className={`text-[11px] line-clamp-2 leading-relaxed ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                        {term.vietnameseDefinition}
                      </p>
                    </div>
                  )}
                </div>

                {/* Formula preview */}
                {(!activeRecallMode || isRevealed) && (
                  <div
                    className={`p-2 rounded-md border text-xs ${
                      isPaper
                        ? 'bg-[#f8f5ee] border-[#e6e0d4] text-slate-800'
                        : 'bg-slate-950/80 border-slate-900 text-slate-300'
                    }`}
                  >
                    <MathView math={term.formulaOrRule} className="text-xs" />
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div
                className={`pt-3 mt-3 border-t flex items-center justify-between text-xs ${
                  isPaper ? 'border-[#eee9df] text-slate-500' : 'border-slate-800/80 text-slate-500'
                }`}
              >
                <span className="font-mono text-[11px]">
                  EF: {progress?.easeFactor?.toFixed(2) || '2.50'} · Lặp: {progress?.repetition || 0}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectForAi(term);
                    }}
                    className={`transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                      isPaper ? 'text-purple-700 hover:text-purple-900' : 'text-purple-400 hover:text-purple-300'
                    }`}
                    title="Phân tích AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI</span>
                  </button>
                  <span
                    className={`text-xs font-medium group-hover:translate-x-0.5 transition-transform flex items-center ${
                      isPaper ? 'text-indigo-700' : 'text-indigo-400'
                    }`}
                  >
                    <span>Chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTerms.length === 0 && (
        <div
          className={`text-center py-16 rounded-2xl border ${
            isPaper
              ? 'bg-white border-[#e5e0d6] text-slate-500'
              : 'bg-slate-900/40 border-slate-800 text-slate-400'
          }`}
        >
          <p className="text-xs">Không tìm thấy thuật ngữ nào phù hợp với bộ lọc hiện tại.</p>
        </div>
      )}

      {/* ================= MODAL: TERM DETAILS ================= */}
      {detailModalTerm && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setDetailModalTerm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 ${
              isPaper
                ? 'bg-white border-[#ded8cb] text-slate-800'
                : 'bg-[#0c101c] border-slate-700 text-slate-200'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-start justify-between gap-4 pb-4 border-b ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
              <div>
                <div className={`flex items-center gap-2 text-xs mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span className={`font-mono ${isPaper ? 'text-indigo-700' : 'text-indigo-300'}`}>{detailModalTerm.olympiadExam}</span>
                  <span aria-hidden="true" className={isPaper ? 'text-slate-300' : 'text-slate-600'}>·</span>
                  <span>{detailModalTerm.targetGrades}</span>
                </div>
                <h3 className={`text-3xl font-bold font-academic-serif ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                  {detailModalTerm.term}
                </h3>
                <div className={`flex items-center gap-2 text-xs font-mono mt-0.5 ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
                  <span>{detailModalTerm.phonetic}</span>
                  <button
                    onClick={() => speakEnglish(detailModalTerm.term)}
                    className={`p-1 rounded cursor-pointer ${
                      isPaper ? 'bg-slate-100 text-slate-700 hover:text-black' : 'bg-slate-900 text-indigo-300 hover:text-white'
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setDetailModalTerm(null)}
                className={`p-1.5 rounded-lg cursor-pointer border ${
                  isPaper ? 'bg-slate-100 text-slate-600 hover:text-black border-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vietnamese Meaning */}
            <div className={`p-4 rounded-xl border ${isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[11px] font-mono uppercase block mb-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Bản dịch tiếng Việt
              </span>
              <p className={`text-xl font-bold font-academic-serif ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                {detailModalTerm.vietnameseMeaning}
              </p>
            </div>

            {/* Bilingual Definitions */}
            <div className={`p-4 rounded-xl border space-y-3 text-xs leading-relaxed ${isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'}`}>
              <div>
                <span className={`font-semibold block text-[11px] uppercase tracking-wide ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                  1. English Math Definition:
                </span>
                <p className={`mt-1 font-serif text-sm ${isPaper ? 'text-slate-900' : 'text-slate-200'}`}>
                  "{detailModalTerm.mathDefinition}"
                </p>
              </div>
              <div className={`pt-2 border-t ${isPaper ? 'border-[#eee8dc]' : 'border-slate-900'}`}>
                <span className={`font-semibold block text-[11px] uppercase tracking-wide ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
                  2. Diễn giải sư phạm:
                </span>
                <p className={`mt-1 ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                  {detailModalTerm.vietnameseDefinition}
                </p>
              </div>
            </div>

            {/* Geometric Illustration - CHỈ HIỂN THỊ KHI LIÊN QUAN TỚI HÌNH HỌC */}
            {isGeometryTerm(detailModalTerm) && (
              <GeometryDiagram term={detailModalTerm} theme={theme} />
            )}

            {/* Formula / Rule */}
            <div className={`p-4 rounded-xl border ${isPaper ? 'bg-[#f6f2e9] border-[#e2dcd0]' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wide block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                Công thức & Quy tắc tính toán:
              </span>
              <MathView math={detailModalTerm.formulaOrRule} block className={isPaper ? 'text-slate-900' : 'text-slate-100'} />
            </div>

            {/* Olympiad Problem & Solution */}
            <div className={`p-4 rounded-xl border space-y-2 ${isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'}`}>
              <div className="flex items-center gap-1.5 text-xs">
                <Award className={`w-4 h-4 ${isPaper ? 'text-amber-700' : 'text-amber-400'}`} />
                <span className={`font-semibold ${isPaper ? 'text-amber-900' : 'text-amber-400'}`}>
                  Bài toán Olympic thực tế ({detailModalTerm.olympiadExam})
                </span>
              </div>
              <div className={`text-xs italic leading-relaxed font-serif ${isPaper ? 'text-slate-800' : 'text-slate-200'}`}>
                <MathText text={detailModalTerm.olympiadWordProblem} />
              </div>
              <div className={`pt-2 border-t text-xs ${isPaper ? 'border-[#eee8dc]' : 'border-slate-900'}`}>
                <span className={`font-semibold block mb-1 ${isPaper ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  Lời giải chi tiết:
                </span>
                <div className={`leading-relaxed ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                  <MathText text={detailModalTerm.solution} />
                </div>
              </div>
            </div>

            {/* Etymology */}
            {detailModalTerm.etymology && (
              <div className={`text-xs p-3 rounded-xl border ${isPaper ? 'bg-[#f8f5ee] border-[#e5e0d6] text-slate-600' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
                <strong className={isPaper ? 'text-slate-800' : 'text-slate-300'}>Gốc từ ngữ học:</strong> {detailModalTerm.etymology}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => {
                  onSelectForAi(detailModalTerm);
                  setDetailModalTerm(null);
                }}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mở trong AI Copilot</span>
              </button>

              <button
                onClick={() => setDetailModalTerm(null)}
                className={`px-4 py-2 rounded-xl font-medium cursor-pointer border ${
                  isPaper ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOM TERM ================= */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <form
            onSubmit={handleCreateTerm}
            onClick={(e) => e.stopPropagation()}
            className={`border rounded-2xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 text-xs ${
              isPaper ? 'bg-white border-[#ded8cb] text-slate-800' : 'bg-[#0c101c] border-slate-700 text-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
              <h3 className={`text-lg font-bold font-academic-serif flex items-center gap-2 ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                <Plus className={`w-4 h-4 ${isPaper ? 'text-indigo-700' : 'text-indigo-400'}`} />
                <span>Bổ Sung Thuật Ngữ Toán Học Mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`p-1 rounded-md cursor-pointer ${
                  isPaper ? 'bg-slate-100 text-slate-600 hover:text-black' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Thuật ngữ Tiếng Anh (*)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inscribed angle"
                  value={newTermData.term}
                  onChange={(e) => setNewTermData({ ...newTermData, term: e.target.value })}
                  className={`w-full rounded-xl p-2.5 border focus:outline-none ${
                    isPaper
                      ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                      : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Nghĩa Tiếng Việt (*)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Góc nội tiếp"
                  value={newTermData.vietnameseMeaning}
                  onChange={(e) =>
                    setNewTermData({ ...newTermData, vietnameseMeaning: e.target.value })
                  }
                  className={`w-full rounded-xl p-2.5 border focus:outline-none ${
                    isPaper
                      ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                      : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Phân môn</label>
                <select
                  value={newTermData.category}
                  onChange={(e) =>
                    setNewTermData({ ...newTermData, category: e.target.value as CategoryId })
                  }
                  className={`w-full rounded-xl p-2.5 border focus:outline-none ${
                    isPaper
                      ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                      : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                  }`}
                >
                  <option value="number_theory">Số học (Number Theory)</option>
                  <option value="geometry">Hình học (Geometry)</option>
                  <option value="algebra">Đại số (Algebra)</option>
                  <option value="combinatorics">Tổ hợp & Xác suất</option>
                </select>
              </div>

              <div>
                <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Phiên âm IPA</label>
                <input
                  type="text"
                  placeholder="e.g. /ɪnˈskraɪbd ˈæŋ.ɡəl/"
                  value={newTermData.phonetic}
                  onChange={(e) => setNewTermData({ ...newTermData, phonetic: e.target.value })}
                  className={`w-full rounded-xl p-2.5 border focus:outline-none font-mono ${
                    isPaper
                      ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                      : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Định nghĩa Tiếng Anh</label>
              <textarea
                rows={2}
                placeholder="An angle formed by two chords in a circle which have a common endpoint."
                value={newTermData.mathDefinition}
                onChange={(e) => setNewTermData({ ...newTermData, mathDefinition: e.target.value })}
                className={`w-full rounded-xl p-2.5 border focus:outline-none ${
                  isPaper
                    ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                    : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Công thức / Quy tắc (LaTeX)</label>
              <input
                type="text"
                placeholder="e.g. \angle ABC = \frac{1}{2} \text{arc}(AC)"
                value={newTermData.formulaOrRule}
                onChange={(e) => setNewTermData({ ...newTermData, formulaOrRule: e.target.value })}
                className={`w-full rounded-xl p-2.5 border focus:outline-none font-mono ${
                  isPaper
                    ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                    : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>

            <div>
              <label className={`block mb-1 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Bài toán Olympic mẫu & Lời giải</label>
              <input
                type="text"
                placeholder="Đề bài Olympic..."
                value={newTermData.olympiadWordProblem}
                onChange={(e) =>
                  setNewTermData({ ...newTermData, olympiadWordProblem: e.target.value })
                }
                className={`w-full rounded-xl p-2.5 border focus:outline-none mb-2 ${
                  isPaper
                    ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                    : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                }`}
              />
              <input
                type="text"
                placeholder="Lời giải chi tiết..."
                value={newTermData.solution}
                onChange={(e) => setNewTermData({ ...newTermData, solution: e.target.value })}
                className={`w-full rounded-xl p-2.5 border focus:outline-none ${
                  isPaper
                    ? 'bg-[#fcfbf9] text-slate-900 border-[#ded8cb] focus:border-indigo-600'
                    : 'bg-slate-950 text-slate-200 border-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>

            <div className={`pt-3 flex items-center justify-end gap-3 border-t ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className={`px-4 py-2 rounded-xl font-medium cursor-pointer border ${
                  isPaper ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
              >
                Lưu vào từ điển
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
