import React, { useState, useEffect } from 'react';
import { Sparkles, Key, Volume2, Send, ChevronRight, Lightbulb, Compass, Award } from 'lucide-react';
import { MathTerm } from '../types/math';
import {
  generateOlympiadProblem,
  GeneratedProblem,
  getEtymologyInfo,
  EtymologyDetail,
  askAiTutor,
} from '../utils/offlineBrain';
import { speakEnglish } from '../utils/speech';
import { MathView, MathText } from './MathView';

interface AiCopilotTabProps {
  terms: MathTerm[];
  initialTerm?: MathTerm | null;
  savedApiKey: string;
  onSaveApiKey: (key: string) => void;
  theme?: 'paper' | 'night';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiCopilotTab: React.FC<AiCopilotTabProps> = ({
  terms,
  initialTerm,
  savedApiKey,
  onSaveApiKey,
  theme = 'paper',
}) => {
  const isPaper = theme === 'paper';
  const [selectedTermId, setSelectedTermId] = useState<string>(
    initialTerm?.id || terms[0]?.id || 'num_01'
  );
  const [activeSubTab, setActiveSubTab] = useState<'generator' | 'etymology' | 'chat'>('generator');
  const [selectedExam, setSelectedExam] = useState<string>('TIMO / SASMO');
  const [apiKeyInput, setApiKeyInput] = useState<string>(savedApiKey || '');
  const [isKeySaved, setIsKeySaved] = useState(false);

  // Problem generator state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState<GeneratedProblem | null>(null);
  const [showProblemHints, setShowProblemHints] = useState(false);
  const [showFullSolution, setShowFullSolution] = useState(false);

  // Etymology state
  const [etymologyData, setEtymologyData] = useState<EtymologyDetail | null>(null);

  // Chat tutor state
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý AI Toán học. Tôi hỗ trợ phân tích chuyên sâu thuật ngữ, sinh đề thi Olympic toán quốc tế và hướng dẫn phương pháp tư duy song ngữ. Bạn cần thảo luận chuyên đề nào?',
      timestamp: 'Hiện tại',
    },
  ]);

  const currentTerm = terms.find((t) => t.id === selectedTermId) || terms[0];

  useEffect(() => {
    if (initialTerm) {
      setSelectedTermId(initialTerm.id);
    }
  }, [initialTerm]);

  useEffect(() => {
    if (currentTerm) {
      setEtymologyData(getEtymologyInfo(currentTerm));
    }
  }, [currentTerm]);

  const handleSaveKey = () => {
    onSaveApiKey(apiKeyInput.trim());
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2500);
  };

  const handleGenerateProblem = async () => {
    if (!currentTerm) return;
    setIsGenerating(true);
    setShowProblemHints(false);
    setShowFullSolution(false);
    try {
      const problem = await generateOlympiadProblem(currentTerm, selectedExam, savedApiKey);
      setGeneratedProblem(problem);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!generatedProblem && currentTerm) {
      handleGenerateProblem();
    }
  }, [selectedTermId]);

  const handleSendChat = async (queryText?: string) => {
    const textToSend = queryText || chatInput.trim();
    if (!textToSend || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const aiReply = await askAiTutor(textToSend, currentTerm, savedApiKey);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Scholarly AI Header */}
      <div
        className={`border rounded-2xl p-5 mb-6 transition-colors shadow-xs ${
          isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-slate-900/60 border-slate-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-xl font-bold font-academic-serif ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                Trợ Lý Toán Học & Sinh Đề Olympic (AI Math Copilot)
              </h2>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                  isPaper
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI Online Sẵn sàng</span>
              </span>
            </div>
            <p className={`text-xs mt-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
              Hệ thống kết nối AI online hỗ trợ giải đáp toán học tức thì, chính xác, khoa học và sinh đề thi Olympic quốc tế.
            </p>
          </div>

          {/* AI Connection status indicator */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
              isPaper
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Trực tuyến 24/7 (Gemini AI)</span>
          </div>
        </div>

        {/* Selected Term & Mode Switcher */}
        <div className={`mt-4 pt-4 border-t flex flex-wrap items-center gap-3 text-xs ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800/80'}`}>
          <span className={isPaper ? 'text-slate-500' : 'text-slate-400'}>Khái niệm đang nghiên cứu:</span>
          <select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className={`border rounded-lg px-2.5 py-1.5 focus:outline-none font-medium ${
              isPaper
                ? 'bg-[#fcfbf9] border-[#ded8cb] text-slate-800 focus:border-indigo-600'
                : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500'
            }`}
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.term} — {t.vietnameseMeaning} [{t.olympiadExam}]
              </option>
            ))}
          </select>

          {/* Subtabs switcher */}
          <div
            className={`flex items-center gap-1 ml-auto p-1 rounded-xl border ${
              isPaper ? 'bg-[#f0ebe1] border-[#ded8cb]' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <button
              onClick={() => setActiveSubTab('generator')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeSubTab === 'generator'
                  ? isPaper
                    ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                    : 'bg-slate-800 text-white border border-slate-700/80'
                  : isPaper
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sinh Bài Toán Olympic
            </button>
            <button
              onClick={() => setActiveSubTab('etymology')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeSubTab === 'etymology'
                  ? isPaper
                    ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                    : 'bg-slate-800 text-white border border-slate-700/80'
                  : isPaper
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gốc Từ & Bản Chất
            </button>
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeSubTab === 'chat'
                  ? isPaper
                    ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                    : 'bg-slate-800 text-white border border-slate-700/80'
                  : isPaper
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gia Sư Giải Toán
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: OLYMPIAD WORD PROBLEM GENERATOR */}
      {activeSubTab === 'generator' && (
        <div className="space-y-6">
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
              isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={isPaper ? 'text-slate-600' : 'text-slate-400'}>Định dạng kỳ thi:</span>
              <div className="flex gap-1">
                {['TIMO / SASMO', 'ASMO', 'HKIMO'].map((exam) => (
                  <button
                    key={exam}
                    onClick={() => setSelectedExam(exam)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedExam === exam
                        ? isPaper
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold'
                          : 'bg-slate-800 text-indigo-300 border border-slate-700'
                        : isPaper
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateProblem}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Đang soạn thảo đề bài...' : 'Tạo Đề Bài Mới'}</span>
            </button>
          </div>

          {generatedProblem && (
            <div
              className={`border rounded-2xl p-6 md:p-8 shadow-sm transition-colors ${
                isPaper ? 'bg-white border-[#e5e0d6] text-slate-800' : 'bg-[#0c101c] border-slate-800 text-slate-200'
              }`}
            >
              <div
                className={`flex flex-wrap items-center justify-between gap-2 pb-4 border-b mb-5 text-xs ${
                  isPaper ? 'border-[#eee8dc]' : 'border-slate-800'
                }`}
              >
                <div className={`flex items-center gap-2 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                  <span className={`font-mono font-semibold ${isPaper ? 'text-indigo-800' : 'text-indigo-300'}`}>
                    {generatedProblem.olympiadExam}
                  </span>
                  <span aria-hidden="true" className={isPaper ? 'text-slate-300' : 'text-slate-600'}>·</span>
                  <span>{generatedProblem.gradeLevel}</span>
                </div>

                <button
                  onClick={() => speakEnglish(generatedProblem.problemEn)}
                  className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer ${
                    isPaper
                      ? 'bg-[#f7f4ec] hover:bg-[#ede8dc] text-slate-700 border-[#ded8cb]'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPaper ? 'text-indigo-600' : 'text-indigo-400'}`} />
                  <span>Nghe phát âm đề bài</span>
                </button>
              </div>

              <h3 className={`text-xl font-bold font-academic-serif mb-4 ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                {generatedProblem.title}
              </h3>

              {/* Problem Statement Box */}
              <div
                className={`p-4 rounded-xl border mb-4 ${
                  isPaper ? 'bg-[#fbf9f4] border-[#ece7de]' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <span className={`text-[11px] font-mono uppercase block mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                  Problem Statement (English):
                </span>
                <div className={`text-base font-serif italic leading-relaxed ${isPaper ? 'text-slate-900' : 'text-slate-100'}`}>
                  <MathText text={generatedProblem.problemEn} />
                </div>
              </div>

              {/* Vietnamese Translation */}
              <div
                className={`p-4 rounded-xl border mb-6 text-xs md:text-sm leading-relaxed ${
                  isPaper ? 'bg-[#f8f5ee] border-[#e2ddd3] text-slate-700' : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <span className={`text-[11px] font-mono uppercase block mb-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                  Bản dịch tiếng Việt sư phạm:
                </span>
                <MathText text={generatedProblem.problemVi} />
              </div>

              {/* Hints */}
              <div className="mb-4">
                <button
                  onClick={() => setShowProblemHints(!showProblemHints)}
                  className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                    isPaper ? 'text-amber-800 hover:text-amber-900' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>{showProblemHints ? 'Thu gọn gợi ý' : 'Gợi ý phương pháp tư duy (Hints)'}</span>
                </button>

                {showProblemHints && (
                  <div
                    className={`mt-2 p-4 rounded-xl border text-xs space-y-1.5 leading-relaxed ${
                      isPaper ? 'bg-amber-50/70 border-amber-200 text-amber-950' : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    {generatedProblem.hints.map((hint, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-mono font-semibold">[{idx + 1}]</span>
                        <div className="flex-1 leading-relaxed">
                          <MathText text={hint} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Solution */}
              <div>
                <button
                  onClick={() => setShowFullSolution(!showFullSolution)}
                  className={`w-full py-2.5 px-4 rounded-xl font-medium text-xs flex items-center justify-between border cursor-pointer transition-colors ${
                    isPaper
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border-slate-800'
                  }`}
                >
                  <span>{showFullSolution ? 'Thu gọn lời giải' : 'Xem Lời giải chi tiết & Đáp số'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFullSolution ? 'rotate-90' : ''}`} />
                </button>

                {showFullSolution && (
                  <div
                    className={`mt-3 p-5 rounded-xl border text-xs space-y-3 ${
                      isPaper ? 'bg-[#fbf9f4] border-[#ece7de]' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <span className={`text-[11px] font-semibold uppercase tracking-wide block ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                      Các bước lập luận giải toán:
                    </span>
                    <div className={`space-y-2 ${isPaper ? 'text-slate-800' : 'text-slate-300'}`}>
                      {generatedProblem.solutionSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="font-mono text-[11px] font-semibold">
                            {idx + 1}.
                          </span>
                          <div className="leading-relaxed flex-1">
                            <MathText text={step} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={`pt-3 border-t flex items-center justify-between ${isPaper ? 'border-[#eee8dc]' : 'border-slate-900'}`}>
                      <span className={`font-semibold ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>Đáp số chung cuộc:</span>
                      <span
                        className={`font-mono font-bold text-sm px-3 py-1 rounded border ${
                          isPaper
                            ? 'text-emerald-900 bg-emerald-100 border-emerald-300'
                            : 'text-emerald-300 bg-slate-900 border-slate-800'
                        }`}
                      >
                        <MathText text={generatedProblem.finalAnswer} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: ETYMOLOGY */}
      {activeSubTab === 'etymology' && etymologyData && (
        <div
          className={`border rounded-2xl p-6 md:p-8 shadow-sm transition-colors ${
            isPaper ? 'bg-white border-[#e5e0d6] text-slate-800' : 'bg-[#0c101c] border-slate-800 text-slate-200'
          }`}
        >
          <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
            <div>
              <h3 className={`text-2xl font-bold font-academic-serif ${isPaper ? 'text-slate-900' : 'text-white'}`}>
                Khảo Cứu Gốc Từ: {etymologyData.term}
              </h3>
              <p className={`text-xs mt-0.5 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Nguồn gốc từ vựng Hy Lạp / La Tinh và tiến trình hình thành khái niệm toán học.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className={`p-4 rounded-xl border space-y-2 ${isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[11px] font-mono uppercase block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Gốc từ nguyên thủy ({etymologyData.rootLanguage})
              </span>
              <p className={`text-lg font-bold font-academic-serif ${isPaper ? 'text-indigo-900' : 'text-indigo-300'}`}>
                "{etymologyData.rootWord}"
              </p>
              <p className={`leading-relaxed ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                {etymologyData.rootMeaning}
              </p>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[11px] font-mono uppercase block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Bối cảnh lịch sử toán học
              </span>
              <p className={`leading-relaxed ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                {etymologyData.historicalContext}
              </p>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${isPaper ? 'bg-[#faf7f0] border-[#ece7de]' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[11px] font-mono uppercase block ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Từ vựng học thuật liên quan (Cognates)
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {etymologyData.cognateWords.map((word, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                      isPaper
                        ? 'bg-white text-slate-800 border-[#ded8cb]'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${isPaper ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-950 border-slate-800'}`}>
              <span className={`text-[11px] font-mono uppercase block ${isPaper ? 'text-amber-800 font-semibold' : 'text-amber-400'}`}>
                Mẹo liên tưởng ghi nhớ
              </span>
              <p className={`leading-relaxed ${isPaper ? 'text-amber-950' : 'text-slate-300'}`}>
                {etymologyData.mnemonicMemoryHook}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: TUTOR CHAT */}
      {activeSubTab === 'chat' && (
        <div
          className={`border rounded-2xl p-6 shadow-sm flex flex-col h-[520px] transition-colors ${
            isPaper ? 'bg-white border-[#e5e0d6]' : 'bg-[#0c101c] border-slate-800'
          }`}
        >
          {/* Quick Prompts */}
          <div className={`flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b text-xs ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
            <span className={`whitespace-nowrap ${isPaper ? 'text-slate-500' : 'text-slate-500'}`}>Chủ đề mẫu:</span>
            {[
              'Số 1 có phải là Prime number không?',
              'Mẹo nhớ bộ ba số Pythagoras?',
              'Nguyên lý Dirichlet áp dụng thế nào?',
              'Phân biệt Permutation và Combination?',
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendChat(q)}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer border transition-colors ${
                  isPaper
                    ? 'bg-[#f7f4ec] text-slate-700 border-[#ded8cb] hover:bg-slate-100'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed border ${
                    msg.sender === 'user'
                      ? isPaper
                        ? 'bg-indigo-700 text-white border-indigo-800'
                        : 'bg-slate-800 text-slate-100 border-slate-700'
                      : isPaper
                      ? 'bg-[#faf7f0] text-slate-800 border-[#e8e4db]'
                      : 'bg-slate-950 text-slate-200 border-slate-800'
                  }`}
                >
                  <MathText
                    text={msg.text}
                    className="leading-relaxed"
                    inlineFormulaClassName={msg.sender === 'user' ? 'text-white' : undefined}
                  />
                  <span className={`block text-[10px] mt-1.5 text-right font-mono ${msg.sender === 'user' ? 'text-indigo-200' : isPaper ? 'text-slate-500' : 'text-slate-500'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div
                  className={`rounded-xl p-3 border text-xs flex items-center gap-2 ${
                    isPaper ? 'bg-[#f7f4ec] border-[#ded8cb] text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span>Trợ lý đang phân tích bài toán...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={`pt-3 border-t flex items-center gap-2 ${isPaper ? 'border-[#eee8dc]' : 'border-slate-800'}`}>
            <input
              type="text"
              placeholder={`Đặt câu hỏi toán học về ${currentTerm.term} hoặc bài toán cần giải...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              className={`flex-1 text-xs rounded-xl px-3.5 py-2.5 border focus:outline-none transition-colors ${
                isPaper
                  ? 'bg-[#fcfbf9] text-slate-900 placeholder-slate-400 border-[#ded8cb] focus:border-indigo-600'
                  : 'bg-slate-950 text-slate-200 placeholder-slate-500 border-slate-800 focus:border-indigo-500'
              }`}
            />
            <button
              onClick={() => handleSendChat()}
              disabled={isChatLoading || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50 text-xs font-medium"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
