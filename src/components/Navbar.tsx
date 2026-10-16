import React from 'react';
import { Sparkles, BookOpen, BarChart3, Layers, Calendar, Sun, Moon, Leaf, Search, Cloud, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'flashcard' | 'lookup' | 'ai' | 'library' | 'analytics';
  setActiveTab: (tab: 'flashcard' | 'lookup' | 'ai' | 'library' | 'analytics') => void;
  dueCount: number;
  streakDays: number;
  totalCards: number;
  theme: 'paper' | 'night';
  onToggleTheme: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'error';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  dueCount,
  streakDays,
  totalCards,
  theme,
  onToggleTheme,
  currentUser,
  onOpenAuth,
  syncStatus = 'synced',
}) => {
  const isPaper = theme === 'paper';

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3 transition-colors duration-200 ${
        isPaper
          ? 'bg-[#fcfbf7]/95 border-[#e8e4dc] text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
          : 'bg-[#0f141f]/95 border-slate-800 text-slate-100 shadow-xs'
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Academic Brand Mark */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                isPaper
                  ? 'bg-amber-100/70 border border-amber-300/60 text-amber-900 shadow-xs'
                  : 'bg-slate-900 border border-slate-700/80 text-indigo-300'
              }`}
            >
              <span className="font-academic-serif italic">∑</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-base font-bold tracking-tight font-academic-serif ${
                    isPaper ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  Math M32
                </span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                    isPaper
                      ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  Olympic 6-9
                </span>
              </div>
              <p className={`text-[11px] ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                Sổ tay thuật ngữ toán học song ngữ & thuật toán SM-2
              </p>
            </div>
          </div>

          {/* Mobile Right Bar: User Login, Theme Toggle & Stats */}
          <div className="flex items-center gap-1.5 md:hidden">
            {onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                  currentUser
                    ? isPaper
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                    : isPaper
                    ? 'bg-white border-[#e2ded5] text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
                title={currentUser ? `Đang đăng nhập: ${currentUser.email}` : 'Đăng nhập để đồng bộ đa thiết bị'}
              >
                {currentUser ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '✓'}
                  </span>
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                )}
              </button>
            )}
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                isPaper
                  ? 'bg-white border-[#e2ded5] text-amber-800 hover:bg-amber-50'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
              }`}
              title="Đổi chế độ màu sắc bảo vệ mắt"
            >
              {isPaper ? <Moon className="w-3.5 h-3.5 text-slate-700" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <div className={`text-xs ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className="font-semibold">{streakDays}d</span> · <span className="font-semibold text-indigo-600 dark:text-indigo-300">{dueCount}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation: Clean Academic Segmented Switcher */}
        <nav
          className={`flex items-center p-1 rounded-xl border w-full md:w-auto overflow-x-auto text-xs transition-colors ${
            isPaper
              ? 'bg-[#f0ebe1] border-[#e2ddd3]'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <button
            onClick={() => setActiveTab('flashcard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'flashcard'
                ? isPaper
                  ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                  : 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : isPaper
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Thẻ Flashcard</span>
            {dueCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isPaper
                    ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {dueCount}
              </span>
            )}
          </button>

          {/* New Tab: Tra Cứu Thuật Ngữ */}
          <button
            onClick={() => setActiveTab('lookup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'lookup'
                ? isPaper
                  ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                  : 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : isPaper
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Tra Cứu Thuật Ngữ</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ai'
                ? isPaper
                  ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                  : 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : isPaper
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>AI Copilot & Đề Thi</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'library'
                ? isPaper
                  ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                  : 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : isPaper
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Thư Viện ({totalCards})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? isPaper
                  ? 'bg-white text-slate-900 shadow-xs border border-[#ddd7cc]'
                  : 'bg-slate-800 text-white shadow-xs border border-slate-700/80'
                : isPaper
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Báo Cáo Sư Phạm</span>
          </button>
        </nav>

        {/* Desktop Right Controls: User account, theme toggle & stats */}
        <div className="hidden md:flex items-center gap-2.5 text-xs">
          {/* User Account / Multi-device Sync Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium cursor-pointer transition-all ${
                currentUser
                  ? isPaper
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 hover:bg-emerald-100 shadow-xs'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-200 hover:bg-emerald-900/60'
                  : isPaper
                  ? 'bg-white border-[#dfd9ce] text-indigo-900 hover:bg-indigo-50/50 shadow-xs'
                  : 'bg-slate-900 border-slate-800 text-indigo-300 hover:bg-slate-800'
              }`}
              title={currentUser ? `Đang đăng nhập: ${currentUser.email} (Đã đồng bộ đám mây)` : 'Đăng nhập tài khoản để đồng bộ đa thiết bị'}
            >
              {currentUser ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : '✓'}
                  </span>
                  <span className="font-medium max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Tự động đồng bộ đám mây"></span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Đăng Nhập / Đồng Bộ</span>
                </>
              )}
            </button>
          )}

          {/* Eye-care Mode Toggle Button */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-medium cursor-pointer transition-colors ${
              isPaper
                ? 'bg-white border-[#dfd9ce] text-slate-700 hover:bg-amber-50/50 shadow-xs'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Nhấn để đổi giữa chế độ Giấy ngà bảo vệ mắt và Đêm dịu"
          >
            {isPaper ? (
              <>
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Giấy ngà (Dịu mắt)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chế độ: Đêm dịu</span>
              </>
            )}
          </button>

          <div className={`flex items-center gap-3 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
            <span>Chuỗi: <strong className={isPaper ? 'text-amber-700 font-mono' : 'text-amber-400 font-mono'}>{streakDays} ngày</strong></span>
            <span>·</span>
            <span>Đến hạn: <strong className={isPaper ? 'text-indigo-700 font-mono' : 'text-indigo-300 font-mono'}>{dueCount} từ</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
