import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Cloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  Laptop,
} from 'lucide-react';
import {
  loginWithEmail,
  registerWithEmail,
  loginWithGoogleAccount,
  logoutUser,
  getFriendlyAuthErrorMessage,
} from '../utils/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  theme: 'paper' | 'night';
  syncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastSyncTime: string | null;
  onManualSync: () => Promise<void>;
  cardCount: number;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  theme,
  syncStatus,
  lastSyncTime,
  onManualSync,
  cardCount,
}) => {
  const isPaper = theme === 'paper';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncingManual, setSyncingManual] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ địa chỉ email và mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu cần tối thiểu 6 ký tự để bảo vệ tài khoản.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
        setSuccessMessage('Đăng nhập thành công! Dữ liệu đang được đồng bộ.');
        setTimeout(() => onClose(), 1200);
      } else {
        await registerWithEmail(email, password, displayName);
        setSuccessMessage('Đăng ký tài khoản thành công! Dữ liệu học tập đã được liên kết.');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setErrorMessage(getFriendlyAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await loginWithGoogleAccount();
      setSuccessMessage('Đăng nhập Google thành công! Dữ liệu đã đồng bộ.');
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      setErrorMessage(getFriendlyAuthErrorMessage(code));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setSuccessMessage('Đã đăng xuất tài khoản an toàn.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 900);
    } catch {
      setErrorMessage('Không thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncingManual(true);
    try {
      await onManualSync();
      setSuccessMessage('Đã đồng bộ dữ liệu lên đám mây thành công!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setErrorMessage('Không thể đồng bộ lúc này. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setSyncingManual(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl p-6 transition-all duration-200 ${
          isPaper
            ? 'bg-[#fcfbf7] border-[#e8e4dc] text-slate-800'
            : 'bg-[#111726] border-slate-800 text-slate-100'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isPaper
              ? 'border-[#e4ded5] text-slate-500 hover:bg-[#f2eee5]'
              : 'border-slate-700/80 text-slate-400 hover:bg-slate-800'
          }`}
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              isPaper
                ? 'bg-amber-100 border border-amber-300/80 text-amber-900'
                : 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-300'
            }`}
          >
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-academic-serif tracking-tight">
              {currentUser ? 'Tài Khoản & Đồng Bộ Đám Mây' : 'Đăng Nhập Cá Nhân Hoá'}
            </h2>
            <p className={`text-xs ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
              Học tập liền mạch & đồng bộ dữ liệu giữa các thiết bị
            </p>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl text-xs flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl text-xs flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* IF USER IS LOGGED IN */}
        {currentUser ? (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 ${
                isPaper
                  ? 'bg-white border-[#e6e1d8] shadow-xs'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
                {currentUser.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : 'M'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">
                    {currentUser.displayName || 'Học viên Math M32'}
                  </h3>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${
                      isPaper
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    }`}
                  >
                    Đã liên kết
                  </span>
                </div>
                <p className={`text-xs truncate ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                  {currentUser.email}
                </p>
              </div>
            </div>

            {/* Sync Information Box */}
            <div
              className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                isPaper
                  ? 'bg-[#f7f4eb] border-[#e2ddd3]'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 ${isPaper ? 'text-slate-600' : 'text-slate-400'}`}>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Trạng thái đồng bộ:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {syncStatus === 'syncing' ? 'Đang tải lên...' : 'Tự động lưu'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={isPaper ? 'text-slate-600' : 'text-slate-400'}>
                  Thẻ thuật ngữ trong tài khoản:
                </span>
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  {cardCount} thẻ flashcard
                </span>
              </div>

              {lastSyncTime && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-dashed border-slate-300/60 dark:border-slate-800">
                  <span className={isPaper ? 'text-slate-500' : 'text-slate-400'}>
                    Lần cập nhật gần nhất:
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {lastSyncTime}
                  </span>
                </div>
              )}
            </div>

            {/* Cross-device reassurance banner */}
            <div
              className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                isPaper
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                  : 'bg-indigo-950/40 border-indigo-900/60 text-indigo-200'
              }`}
            >
              <div className="flex items-center gap-1 shrink-0">
                <Smartphone className="w-4 h-4" />
                <span className="text-slate-400">↔</span>
                <Laptop className="w-4 h-4" />
              </div>
              <p className="leading-relaxed">
                Tiến độ học tập và ghi nhớ SM-2 được tự động lưu. Khi bạn đăng nhập trên điện thoại, máy tính bảng hay máy tính khác, toàn bộ dữ liệu sẽ xuất hiện đầy đủ.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleTriggerSync}
                disabled={syncingManual || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isPaper
                    ? 'bg-white border-[#e0dad0] text-slate-800 hover:bg-slate-50 shadow-xs'
                    : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingManual ? 'animate-spin' : ''}`} />
                {syncingManual ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-rose-300/70 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 text-xs font-semibold cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          /* IF USER IS NOT LOGGED IN */
          <div>
            {/* Tabs: Đăng nhập vs Đăng ký */}
            <div
              className={`flex rounded-xl p-1 mb-4 border text-xs ${
                isPaper ? 'bg-[#f0ebe0] border-[#e2ddd2]' : 'bg-slate-900 border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  mode === 'signin'
                    ? isPaper
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'bg-indigo-600 text-white font-semibold'
                    : isPaper
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  mode === 'signup'
                    ? isPaper
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'bg-indigo-600 text-white font-semibold'
                    : isPaper
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Đăng Ký Mới
              </button>
            </div>

            {/* Quick Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border text-xs font-medium cursor-pointer transition-all mb-4 ${
                isPaper
                  ? 'bg-white border-[#e0dad0] text-slate-800 hover:bg-[#f6f2e9] shadow-xs'
                  : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập nhanh với Google</span>
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              <span className={`text-[11px] ${isPaper ? 'text-slate-400' : 'text-slate-500'}`}>
                hoặc dùng tài khoản có mật khẩu
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                    Tên học sinh / Học viên
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Ví dụ: Minh Khang (Lớp 7A)"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-colors outline-hidden ${
                        isPaper
                          ? 'bg-white border-[#e0dad0] text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-xs font-medium mb-1 ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                  Tài khoản Google / Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border transition-colors outline-hidden ${
                      isPaper
                        ? 'bg-white border-[#e0dad0] text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isPaper ? 'text-slate-700' : 'text-slate-300'}`}>
                  Mật khẩu bảo vệ cá nhân
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`w-full pl-9 pr-9 py-2 text-xs rounded-xl border transition-colors outline-hidden ${
                      isPaper
                        ? 'bg-white border-[#e0dad0] text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                        : 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className={`text-[10px] mt-1 ${isPaper ? 'text-slate-500' : 'text-slate-400'}`}>
                    Mật khẩu giúp bạn đăng nhập an toàn từ bất kỳ máy tính hoặc điện thoại nào.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 ${
                  isPaper
                    ? 'bg-indigo-700 text-white hover:bg-indigo-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : mode === 'signin' ? (
                  'Đăng Nhập & Đồng Bộ'
                ) : (
                  'Tạo Tài Khoản & Bắt Đầu Đồng Bộ'
                )}
              </button>
            </form>

            {/* Note about multi-device sync */}
            <div className={`mt-4 pt-3 border-t text-[11px] leading-relaxed flex items-center gap-2 ${
              isPaper ? 'border-[#ece7de] text-slate-500' : 'border-slate-800 text-slate-400'
            }`}>
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Khi đăng nhập, mọi kết quả học tập, chuỗi ngày streak và thẻ tự tạo sẽ được lưu trữ vĩnh viễn trên đám mây.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
