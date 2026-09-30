import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ToggleLeft, ToggleRight, AlertCircle, Check, KeyRound, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import {
  getAppUsersRemote,
  addAppUserRemote,
  changePasswordRemote,
  setUserActiveRemote,
} from '../services/api';

const ROLE_LABELS = {
  admin: { label: 'Chủ nhà', color: 'text-amber-800 bg-amber-50 border-amber-200', icon: ShieldCheck },
  manager: { label: 'Quản lý', color: 'text-sky-800 bg-sky-50 border-sky-200', icon: ShieldCheck },
  staff: { label: 'Nhân viên', color: 'text-slate-700 bg-slate-100 border-slate-200', icon: UserCheck },
};

const isUserActive = (user) => user.isActive !== false && String(user.isActive).toUpperCase() !== 'FALSE';
const assignedHouseIds = (value) => Array.isArray(value)
  ? value
  : String(value || '').split(',').map((id) => id.trim()).filter(Boolean);

export default function UserManageTab({ session, houses }) {
  const isAdmin = session?.role === 'admin';
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(isAdmin);
  const [usersError, setUsersError] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [feedback, setFeedback] = useState(null); // {type: 'success'|'error', msg: ''}

  // Danh sách tài khoản luôn đọc từ Sheet; lỗi kết nối không được thay bằng dữ liệu mẫu.
  const refreshUsers = async () => {
    setLoadingUsers(true);
    setUsersError('');
    try {
      const u = await getAppUsersRemote();
      if (!Array.isArray(u)) throw new Error('Dữ liệu tài khoản không hợp lệ.');
      setUsers(u);
      return u;
    } catch (err) {
      setUsersError(err.message || 'Không tải được danh sách tài khoản.');
      throw err;
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) refreshUsers().catch(() => {});
    });
    return () => { mounted = false; };
  }, [isAdmin]);

  // Form thêm người dùng
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [newAllowedHouses, setNewAllowedHouses] = useState([]);

  // Form đổi mật khẩu
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword || !newName) {
      showFeedback('error', 'Vui lòng điền đầy đủ thông tin tài khoản!');
      return;
    }
    if (newPassword.length < 8) {
      showFeedback('error', 'Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }
    if (newRole === 'staff' && newAllowedHouses.length === 0) {
      showFeedback('error', 'Hãy chọn ít nhất một nhà yến cho nhân viên.');
      return;
    }
    setLoading(true);
    try {
      await addAppUserRemote({
        id: 'u_' + Date.now(),
        username: newUsername.trim().toLowerCase(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        allowedHouses: newRole === 'staff' && newAllowedHouses.length > 0 ? newAllowedHouses : null,
      });
      setIsAddingUser(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('staff');
      setNewAllowedHouses([]);
      try {
        await refreshUsers();
        showFeedback('success', `Đã tạo tài khoản ${newUsername.trim().toLowerCase()}.`);
      } catch {
        showFeedback('error', 'Tài khoản đã được tạo, nhưng chưa tải lại được danh sách. Hãy bấm Tải lại.');
      }
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (user) => {
    if (pendingUserId || user.role === 'admin') return;
    setPendingUserId(user.id);
    try {
      const nextActive = !isUserActive(user);
      const savedUser = await setUserActiveRemote(user.id, nextActive);
      setUsers((current) => current.map((item) => item.id === user.id
        ? { ...item, ...(savedUser || {}), isActive: nextActive }
        : item
      ));
      try {
        await refreshUsers();
        showFeedback('success', nextActive ? `Đã mở lại tài khoản ${user.name}.` : `Đã khóa tài khoản ${user.name}.`);
      } catch {
        showFeedback('success', 'Đã cập nhật tài khoản trên bảng dữ liệu. Hãy bấm Tải lại để xem danh sách mới nhất.');
      }
    } catch (err) {
      showFeedback('error', err.message || 'Chưa cập nhật được tài khoản.');
    } finally {
      setPendingUserId(null);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      showFeedback('error', 'Mật khẩu xác nhận không khớp!');
      return;
    }
    if (pwNew.length < 8) {
      showFeedback('error', 'Mật khẩu mới phải có ít nhất 8 ký tự!');
      return;
    }
    setLoading(true);
    try {
      await changePasswordRemote(session.userId, pwOld, pwNew);
      setIsChangingPw(false);
      setPwOld('');
      setPwNew('');
      setPwConfirm('');
      showFeedback('success', 'Đã đổi mật khẩu thành công!');
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleHouseSelection = (houseId) => {
    setNewAllowedHouses((prev) =>
      prev.includes(houseId) ? prev.filter((id) => id !== houseId) : [...prev, houseId]
    );
  };

  return (
    <div className="space-y-5">
      {/* Feedback Toast */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-800 text-white'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Grid 2 Cột trên Desktop (Tài khoản của tôi & Quyền hạn) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ─── CARD 1: TÀI KHOẢN CỦA TÔI & ĐỔI MẬT KHẨU ──────────────────────── */}
        <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-700" /> Tài khoản cá nhân
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Thông tin đăng nhập hiện tại của bạn</p>
            </div>
            <button
              onClick={() => setIsChangingPw(!isChangingPw)}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
            >
              {isChangingPw ? 'Đóng form' : 'Đổi mật khẩu'}
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {isAdmin ? <ShieldCheck className="w-5 h-5 text-amber-700" /> : <UserCheck className="w-5 h-5 text-slate-700" />}
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block">{session?.name}</span>
                <span className="text-xs text-slate-400 font-mono">@{session?.username}</span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${ROLE_LABELS[session?.role]?.color || ROLE_LABELS.staff.color}`}>
              {ROLE_LABELS[session?.role]?.label || 'Nhân viên'}
            </span>
          </div>

          {isChangingPw && (
            <form onSubmit={handleChangePassword} className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/70 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-800 block">Đổi mật khẩu mới:</span>
              <input
                type="password"
                value={pwOld}
                onChange={(e) => setPwOld(e.target.value)}
                placeholder="Mật khẩu hiện tại"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none"
              />
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                minLength={8}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none"
              />
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsChangingPw(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl disabled:opacity-60 shadow-xs"
                >
                  {loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ─── CARD 2: BẢNG QUYỀN HẠN CỦA HỆ THỐNG ─────────────────────────── */}
        <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-700" /> Quyền sử dụng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Mỗi người chỉ thấy những công việc phù hợp.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <strong className="text-amber-900">Chủ nhà</strong>
              <p className="mt-1 text-slate-600 leading-relaxed">Quản lý nhà yến, tài khoản, thu hoạch, bán hàng và xem toàn bộ báo cáo.</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <strong className="text-emerald-900">Nhân viên</strong>
              <p className="mt-1 text-slate-600 leading-relaxed">Nhập thu hoạch và bán hàng tại những nhà yến được phân công.</p>
            </div>
          </div>

          {assignedHouseIds(session?.allowedHouses).length > 0 && (
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              Nhà yến bạn được phân công:{' '}
              <strong className="text-emerald-950 font-bold">{assignedHouseIds(session.allowedHouses).map((id) => houses.find((house) => house.id === id)?.name || id).join(', ')}</strong>
            </div>
          )}
        </div>
      </div>

      {/* ─── CARD 3: QUẢN LÝ TÀI KHOẢN NHÂN VIÊN (CHỈ ADMIN) ───────────────── */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" /> Quản lý danh sách tài khoản ({users.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Tạo tài khoản, phân công nhà yến và khóa khi cần.</p>
            </div>
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="self-start sm:self-auto px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> {isAddingUser ? 'Đóng form' : 'Thêm nhân viên'}
            </button>
          </div>

          {/* Form thêm tài khoản mới */}
          {isAddingUser && (
            <form onSubmit={handleAddUser} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <span className="text-sm font-bold text-slate-800 block">Tạo tài khoản mới</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Họ và tên đầy đủ *"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm font-semibold outline-none"
                />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Tên đăng nhập (VD: nhanvien2) *"
                  autoCapitalize="none"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm font-mono outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu (ít nhất 8 ký tự) *"
                  minLength={8}
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm outline-none"
                />
              </div>

              {/* Vai trò */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Vai trò hệ thống</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base sm:text-sm font-bold text-slate-800 outline-none"
                  >
                    <option value="staff">Nhân viên</option>
                    <option value="admin">Chủ nhà</option>
                  </select>
                </div>

                {/* Phân công nhà yến */}
                {newRole === 'staff' && (
                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">
                      Nhà yến được phân công (chọn ít nhất một):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {houses.map((h) => {
                        const isSelected = newAllowedHouses.includes(h.id);
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => toggleHouseSelection(h.id)}
                            aria-pressed={isSelected}
                            className={`px-3 py-2.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {h.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none py-2.5 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-xs disabled:opacity-60"
                >
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          )}

          {usersError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              <span>{usersError}</span>
              <button type="button" onClick={() => refreshUsers().catch(() => {})} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 font-semibold text-rose-800 border border-rose-200">
                <RefreshCw className="h-4 w-4" /> Tải lại
              </button>
            </div>
          )}
          {loadingUsers && <p role="status" className="text-sm text-slate-500">Đang tải danh sách tài khoản...</p>}
          {!loadingUsers && !usersError && users.length === 0 && <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">Chưa có tài khoản nào trong bảng dữ liệu.</p>}

          {/* Danh sách người dùng, đọc từ Google Sheet. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.staff;
              const active = isUserActive(u);
              const allowedHouseNames = assignedHouseIds(u.allowedHouses)
                .map((id) => houses.find((house) => house.id === id)?.name || id);
              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition ${
                    active
                      ? 'bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/70'
                      : 'bg-slate-100/50 border-slate-200/70'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{u.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5 break-all">
                      @{u.username}
                      {allowedHouseNames.length > 0 && (
                        <span className="text-xs mt-1 text-slate-500 font-sans block">
                          Nhà yến: {allowedHouseNames.join(', ')}
                        </span>
                      )}
                      {!active && <span className="mt-1 block text-xs font-semibold text-rose-700">Đang khóa</span>}
                    </div>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleToggle(u)}
                      disabled={pendingUserId !== null || loadingUsers}
                      aria-label={active ? `Khóa tài khoản ${u.name}` : `Mở lại tài khoản ${u.name}`}
                      title={active ? 'Khóa tài khoản' : 'Mở lại tài khoản'}
                      className="min-w-11 min-h-11 inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-white transition cursor-pointer disabled:opacity-50"
                    >
                      {pendingUserId === u.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
