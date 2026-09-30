import React, { useState } from 'react';
import { Users, UserPlus, Shield, ToggleLeft, ToggleRight, AlertCircle, Check, KeyRound } from 'lucide-react';
import {
  getAppUsers,
  addAppUser,
  toggleUserActive,
  changePassword,
} from '../services/auth';
import { DEFAULT_HOUSES } from '../data/constants';

const ROLE_LABELS = {
  admin: { label: 'Admin (Chủ nhà)', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  manager: { label: 'Quản lý', color: 'text-blue-800 bg-blue-50 border-blue-200' },
  staff: { label: 'Nhân viên', color: 'text-slate-700 bg-slate-100 border-slate-200' },
};

export default function UserManageTab({ session, houses }) {
  const [users, setUsers] = useState(getAppUsers());
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // {type: 'success'|'error', msg: ''}

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
      const updated = await addAppUser({
        username: newUsername,
        password: newPassword,
        name: newName,
        role: newRole,
        allowedHouses: newRole === 'staff' && newAllowedHouses.length > 0 ? newAllowedHouses : null,
      });
      setUsers(updated);
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
      await changePassword(session.userId, pwOld, pwNew);
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
    <div className="space-y-3.5 max-w-md mx-auto">
      {/* Feedback toast */}
      {feedback && (
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
            feedback.type === 'success'
              ? 'bg-emerald-700 text-white'
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

      {/* Đổi mật khẩu của bản thân */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-700" /> Tài khoản của tôi
            </h3>
            <p className="text-[11px] text-slate-400">
              Đang đăng nhập: <strong className="text-slate-700">{session?.name}</strong>{' '}
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${ROLE_LABELS[session?.role]?.color}`}>
                {ROLE_LABELS[session?.role]?.label}
              </span>
            </p>
          </div>
          <button
            onClick={() => setIsChangingPw(!isChangingPw)}
            className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200/60 hover:bg-emerald-100 transition"
          >
            Đổi mật khẩu
          </button>
        </div>

        {isChangingPw && (
          <form onSubmit={handleChangePassword} className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] font-bold text-slate-700 block">Đổi mật khẩu đăng nhập:</span>
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
                className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-60"
              >
                {loading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Quản lý người dùng (chỉ Admin) */}
      {isAdmin && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-700" /> Quản lý người dùng ({users.length})
              </h3>
              <p className="text-[11px] text-slate-400">Thêm, vô hiệu hoá tài khoản nhân viên</p>
            </div>
            <button
              onClick={() => setIsAddingUser(!isAddingUser)}
              className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-700 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-xl transition"
            >
              <UserPlus className="w-3.5 h-3.5" /> Thêm
            </button>
          </div>

          {/* Form thêm tài khoản */}
          {isAddingUser && (
            <form onSubmit={handleAddUser} className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[11px] font-bold text-slate-700 block">Tạo tài khoản mới:</span>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Họ và tên đầy đủ"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Tên đăng nhập"
                  autoCapitalize="none"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu (≥6 ký tự)"
                  required
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">Vai trò</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="staff">Nhân viên (Staff)</option>
                  <option value="manager">Quản lý (Manager)</option>
                </select>
              </div>

              {/* Phân công nhà yến (chỉ khi chọn Staff) */}
              {newRole === 'staff' && (
                <div>
                  <label className="text-[11px] text-slate-500 font-medium block mb-1">
                    Nhà yến được phép nhập liệu (để trống = tất cả):
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {houses.map((h) => {
                      const isSelected = newAllowedHouses.includes(h.id);
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => toggleHouseSelection(h.id)}
                          className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-medium text-left transition ${
                            isSelected
                              ? 'bg-emerald-700 text-white border-emerald-700'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {h.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl disabled:opacity-60"
                >
                  {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          )}

          {/* Danh sách người dùng */}
          <div className="space-y-1.5">
            {users.map((u) => {
              const roleInfo = ROLE_LABELS[u.role] || ROLE_LABELS.staff;
              return (
                <div
                  key={u.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                    u.isActive
                      ? 'bg-slate-50/70 border-slate-200/60'
                      : 'bg-slate-100/50 border-slate-200/40 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-800">{u.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      {!u.isActive && (
                        <span className="text-[10px] text-rose-600 font-medium">Bị vô hiệu</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      @{u.username}
                      {u.allowedHouses && (
                        <span className="text-[10px] ml-1.5 text-slate-500">
                          (Nhà: {u.allowedHouses.join(', ')})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Không cho phép tắt tài khoản Admin */}
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleToggle(u.id)}
                      title={u.isActive ? 'Vô hiệu hoá tài khoản' : 'Kích hoạt lại'}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition"
                    >
                      {u.isActive ? (
                        <ToggleRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-400" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thông tin quyền hạn của bản thân */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" /> Quyền hạn của tôi
        </h3>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {[
            { label: 'Xem tài chính & giá trị kho', value: session?.canViewFinance },
            { label: 'Xuất Excel báo cáo', value: session?.canExport },
            { label: 'Xóa phiếu dữ liệu', value: session?.canDeleteRecords },
            { label: 'Quản lý người dùng', value: session?.canManageUsers },
          ].map((p) => (
            <div
              key={p.label}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${
                p.value
                  ? 'bg-emerald-50/70 border-emerald-200/60 text-emerald-900'
                  : 'bg-slate-50/70 border-slate-200/60 text-slate-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${p.value ? 'bg-emerald-600' : 'bg-slate-300'}`} />
              <span className="font-medium">{p.label}</span>
            </div>
          ))}
        </div>
        {session?.allowedHouses && (
          <div className="text-[11px] text-slate-500 px-1 pt-1">
            Chỉ được nhập liệu cho:{' '}
            <strong className="text-slate-700">{session.allowedHouses.join(', ')}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
