import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ToggleLeft, ToggleRight, AlertCircle, Check, KeyRound, ShieldCheck, UserCheck, Lock } from 'lucide-react';
import {
  getAppUsersRemote,
  addAppUserRemote,
  changePasswordRemote,
} from '../services/api';
import { toggleUserActive } from '../services/auth';

const ROLE_LABELS = {
  admin: { label: 'Chủ nhà (Admin)', color: 'text-amber-800 bg-amber-50 border-amber-200', icon: ShieldCheck },
  staff: { label: 'Nhân viên', color: 'text-slate-700 bg-slate-100 border-slate-200', icon: UserCheck },
};

export default function UserManageTab({ session, houses }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type: 'success'|'error', msg: ''}

  // Load danh sách người dùng từ Google Sheet / Local
  const refreshUsers = async () => {
    try {
      const u = await getAppUsersRemote();
      setUsers(u);
    } catch (err) {
      console.error('Lỗi tải người dùng:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

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
    if (newPassword.length < 6) {
      showFeedback('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }
    setLoading(true);
    try {
      await addAppUserRemote({
        id: 'u_' + Date.now(),
        username: newUsername,
        password: newPassword,
        name: newName,
        role: newRole,
        allowedHouses: newRole === 'staff' && newAllowedHouses.length > 0 ? newAllowedHouses : null,
      });
      await refreshUsers();
      setIsAddingUser(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('staff');
      setNewAllowedHouses([]);
      showFeedback('success', `Đã tạo tài khoản [${newUsername}] thành công!`);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (userId) => {
    const updated = toggleUserActive(userId);
    setUsers(updated);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwNew !== pwConfirm) {
      showFeedback('error', 'Mật khẩu xác nhận không khớp!');
      return;
    }
    if (pwNew.length < 6) {
      showFeedback('error', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
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

  const isAdmin = session?.role === 'admin';

  return (
    <div className="space-y-5">
      {/* Feedback Toast */}
      {feedback && (
        <div
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

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between">
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
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
              />
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                placeholder="Mật khẩu mới (ít nhất 6 ký tự)"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
              />
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                placeholder="Xác nhận mật khẩu mới"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
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
              <Shield className="w-4 h-4 text-emerald-700" /> Bảng phân quyền 2 cấp
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Admin (Toàn quyền) & Nhân viên (Nhập liệu)</p>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Nhập thu hoạch & Đơn xuất bán', admin: true, staff: true },
              { label: 'Xem doanh thu & Định giá kho hàng', admin: true, staff: false },
              { label: 'Xuất file báo cáo Excel (.xlsx)', admin: true, staff: false },
              { label: 'Xóa phiếu thu hoạch & Đơn bán', admin: true, staff: false },
              { label: 'Quản lý tài khoản nhân viên & cơ sở', admin: true, staff: false },
            ].map((perm) => (
              <div
                key={perm.label}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs"
              >
                <span className="font-medium text-slate-700">{perm.label}</span>
                <div className="flex items-center gap-2 font-bold text-[10px]">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                    Admin: ✓
                  </span>
                  <span className={`px-2 py-0.5 rounded-md border ${perm.staff ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-slate-200/80 text-slate-400 border-slate-200'}`}>
                    Nhân viên: {perm.staff ? '✓' : '✕'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {session?.allowedHouses && (
            <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              Cơ sở bạn được phép nhập liệu:{' '}
              <strong className="text-emerald-950 font-bold">{session.allowedHouses.join(', ')}</strong>
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
              <p className="text-xs text-slate-400 mt-0.5">Tạo tài khoản mới, phân công nhà yến hoặc khóa tài khoản</p>
            </div>
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="self-start sm:self-auto px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-700/20 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" /> {isAddingUser ? 'Đóng form' : 'Thêm nhân viên'}
            </button>
          </div>

          {/* Form thêm tài khoản mới */}
          {isAddingUser && (
            <form onSubmit={handleAddUser} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-800 block">Tạo tài khoản nhân viên mới:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Họ và tên đầy đủ *"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                />
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Tên đăng nhập (VD: nhanvien2) *"
                  autoCapitalize="none"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu (≥6 ký tự) *"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* Vai trò */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Vai trò hệ thống</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="staff">Nhân viên (Chỉ nhập liệu cơ sở được gán)</option>
                    <option value="admin">Admin (Toàn quyền quản trị)</option>
                  </select>
                </div>

                {/* Phân công nhà yến */}
                {newRole === 'staff' && (
                  <div>
                    <label className="text-[11px] text-slate-500 font-bold block mb-1">
                      Nhà yến được phép thao tác (để trống = tất cả):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {houses.map((h) => {
                        const isSelected = newAllowedHouses.includes(h.id);
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => toggleHouseSelection(h.id)}
                            className={`px-3 py-1 rounded-xl border text-xs font-semibold transition cursor-pointer ${
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
                  className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          )}

          {/* Grid Danh sách người dùng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.staff;
              const RoleIcon = roleInfo.icon;
              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                    u.isActive
                      ? 'bg-slate-50/80 hover:bg-slate-100/70 border-slate-200/70'
                      : 'bg-slate-100/50 border-slate-200/40 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">{u.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      @{u.username}
                      {u.allowedHouses && (
                        <span className="text-[10px] ml-1.5 text-slate-500 font-sans block sm:inline">
                          (Nhà: {u.allowedHouses.join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggle(u.id)}
                      title={u.isActive ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                      {u.isActive ? (
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
