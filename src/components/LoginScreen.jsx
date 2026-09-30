import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Eye, EyeOff, Feather, LoaderCircle, ShieldCheck } from 'lucide-react';
import { loginUser } from '../services/api';
import { logout } from '../services/auth';

export default function LoginScreen({ onLoginSuccess }) {
  const [appName] = useState(() => {
    try { return localStorage.getItem('nhayen_public_app_name') || 'Quản lý Yến sào Minh Triều'; }
    catch { return 'Quản lý Yến sào Minh Triều'; }
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    if (!username.trim() || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    if (/^[a-f0-9]{64}$/i.test(password)) {
      setError('Đây có vẻ là mã băm trong Google Sheet, không phải mật khẩu. Hãy nhập mật khẩu bạn đã đặt.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const session = await loginUser(username.trim(), password, rememberMe);
      if (!session?.token || !session?.userId || !['admin', 'staff'].includes(session.role)) {
        logout();
        throw new Error('Chưa nhận được phiên đăng nhập hợp lệ. Vui lòng thử lại.');
      }
      onLoginSuccess(session);
    } catch (cause) {
      const message = cause?.message || '';
      setError(/failed to fetch|networkerror|load failed/i.test(message)
        ? 'Không kết nối được với hệ thống. Hãy kiểm tra mạng rồi thử lại.'
        : message || 'Đăng nhập chưa thành công. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-dvh items-start justify-center overflow-hidden bg-[#f3f8f4] px-3 py-4 sm:items-center sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="page-enter relative w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-emerald-950/10 bg-white shadow-[0_24px_80px_rgba(16,74,55,0.10)] sm:rounded-[2rem] lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative overflow-hidden bg-[#075e4b] px-6 pb-7 pt-7 text-white sm:px-9 lg:flex lg:min-h-[34rem] lg:flex-col lg:justify-between lg:px-10 lg:py-10">
          <div aria-hidden="true" className="absolute -right-12 -top-16 h-52 w-52 rounded-full border-[34px] border-white/[0.06]" />
          <div aria-hidden="true" className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full border-[32px] border-white/[0.05]" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/25 bg-white/15 shadow-inner">
              <Feather size={22} strokeWidth={2.1} aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-wide text-emerald-50">YẾN SÀO MINH TRIỀU</span>
          </div>

          <div className="relative mt-8 lg:mt-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Sổ quản lý gia đình</p>
            <h1 className="mt-2 max-w-sm text-[1.75rem] font-extrabold leading-tight tracking-tight sm:text-[2.1rem] lg:text-[2.7rem]">
              {appName}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-emerald-50/85">
              Ghi sản lượng, theo dõi bán hàng và xem kho chung trong một nơi dễ dùng.
            </p>
          </div>

          <div className="relative mt-6 hidden items-center gap-2 border-t border-white/15 pt-5 text-xs text-emerald-50/80 lg:flex">
            <ShieldCheck size={17} aria-hidden="true" />
            Dữ liệu được lưu vào Google Sheet của gia đình
          </div>
        </div>

        <div className="px-6 pb-7 pt-7 sm:px-9 sm:py-10 lg:flex lg:flex-col lg:justify-center lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Chào mừng trở lại</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Đăng nhập</h2>
            <p className="mt-1.5 text-sm leading-5 text-slate-500">Dùng tài khoản do chủ nhà cấp để bắt đầu.</p>
          </div>

          {error && (
            <div id="login-error" role="alert" className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-800">
              <AlertCircle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} aria-busy={loading} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-sm font-semibold text-slate-700">Tên đăng nhập</label>
              <div>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  placeholder="Nhập tên đăng nhập"
                  className="field min-h-12"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-slate-700">Mật khẩu</label>
              <div className="flex gap-2">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'login-error' : undefined}
                  placeholder="Nhập mật khẩu"
                  className="field min-h-12 min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={loading}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  aria-pressed={showPassword}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#d6e4dc] bg-[#fbfdfb] text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-800 motion-reduce:transition-none"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <p className="text-xs leading-5 text-slate-500">Không dùng chuỗi ở cột “Mã băm mật khẩu” trong Google Sheet để đăng nhập.</p>

            <label className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                disabled={loading}
                className="h-4 w-4 shrink-0 accent-emerald-700"
              />
              Ghi nhớ đăng nhập trên thiết bị này
            </label>

            <button type="submit" disabled={loading} className="btn-primary flex min-h-12 w-full items-center justify-center gap-2.5">
              {loading ? <LoaderCircle size={18} aria-hidden="true" className="animate-spin" /> : <ArrowRight size={18} aria-hidden="true" />}
              {loading ? 'Đang đăng nhập…' : 'Vào ứng dụng'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">Chưa có tài khoản? Hãy liên hệ chủ nhà để được cấp quyền.</p>
        </div>
      </div>
    </main>
  );
}
