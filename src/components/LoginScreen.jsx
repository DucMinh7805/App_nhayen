import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle, Sparkles, CheckSquare, Square } from 'lucide-react';
import { loginUser } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (u = username, p = password) => {
    if (!u.trim() || !p) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await loginUser(u.trim(), p, rememberMe);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản hoặc kết nối mạng.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  // Quick 1-tap login
  const handleQuickLogin = (roleUser, rolePass) => {
    setUsername(roleUser);
    setPassword(rolePass);
    handleLogin(roleUser, rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 sm:py-10 flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-700 px-6 py-7 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-white font-black text-2xl mx-auto mb-2.5 shadow-inner">
            Y
          </div>
          <h1 className="font-extrabold text-lg tracking-tight">Yến Sào Manager</h1>
          <p className="text-emerald-100 text-xs mt-0.5 opacity-90">Hệ thống quản lý sản lượng & tồn kho chuyên nghiệp</p>
          <div className="inline-flex items-center gap-1.5 bg-emerald-950/30 border border-emerald-400/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-emerald-200 mt-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Kết nối Google Sheet Cloud
          </div>
        </div>

        {/* Login Form */}
        <div className="px-6 py-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Đăng nhập tài khoản</h2>
            <p className="text-[11px] text-slate-400">Nhập thông tin hoặc chọn đăng nhập nhanh</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-3">
            {/* Username */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin / quanly / nhanvien1"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none"
              >
                {rememberMe ? (
                  <CheckSquare className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
                <span>Duy trì đăng nhập</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Đang kết nối Google Sheet...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Quick 1-tap Login Buttons */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 1-Chạm đăng nhập nhanh:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl text-left transition cursor-pointer active:scale-95"
              >
                <div className="text-[11px] font-bold text-emerald-900">Admin</div>
                <div className="text-[9px] text-emerald-700">Chủ nhà</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('quanly', 'quanly123')}
                className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl text-left transition cursor-pointer active:scale-95"
              >
                <div className="text-[11px] font-bold text-blue-900">Quản lý</div>
                <div className="text-[9px] text-blue-700">Xem tài chính</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('nhanvien1', 'nv123456')}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-left transition cursor-pointer active:scale-95"
              >
                <div className="text-[11px] font-bold text-slate-800">Nhân viên</div>
                <div className="text-[9px] text-slate-500">Nhập phiếu</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
