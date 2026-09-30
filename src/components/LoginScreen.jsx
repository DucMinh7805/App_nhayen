import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { loginUser } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const session = await loginUser(username, password);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 sm:py-10 flex justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-emerald-700 px-6 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-2xl mx-auto mb-3 shadow-inner">
            Y
          </div>
          <h1 className="text-white font-extrabold text-lg tracking-tight">Yến Sào Manager</h1>
          <p className="text-emerald-200 text-xs mt-1">Hệ thống quản lý nhà yến chuyên nghiệp</p>
        </div>

        {/* Login Form */}
        <div className="px-6 py-6 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Đăng nhập hệ thống</h2>
            <p className="text-[11px] text-slate-400">Nhập tài khoản được cấp bởi quản trị viên</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  placeholder="VD: admin / nhanvien1"
                  autoCapitalize="none"
                  autoCorrect="off"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Demo accounts hint */}
          <div className="border-t border-slate-100 pt-4 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Tài khoản demo:
            </p>
            <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-600 font-mono">
              <div className="flex justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-500">Admin (toàn quyền)</span>
                <span className="font-semibold text-slate-800">admin / admin123</span>
              </div>
              <div className="flex justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-500">Quản lý</span>
                <span className="font-semibold text-slate-800">quanly / quanly123</span>
              </div>
              <div className="flex justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                <span className="text-slate-500">Nhân viên (h1, h2)</span>
                <span className="font-semibold text-slate-800">nhanvien1 / nv123456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
