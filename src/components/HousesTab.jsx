import React, { useState } from 'react';
import { Plus, MapPin, Database, Trash2, Building2, Pencil, CheckCircle2, AlertCircle } from 'lucide-react';

export default function HousesTab({ houses, session, onSaveHouses, onRequestDelete }) {
  const isAdmin = session?.role === 'admin';
  const [newHouseName, setNewHouseName] = useState('');
  const [newHouseAddress, setNewHouseAddress] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingHouseId, setEditingHouseId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleAddHouse = async (e) => {
    e.preventDefault();
    if (!newHouseName.trim() || saving || !isAdmin) return;

    const newHouse = {
      id: 'h_' + Date.now(),
      name: newHouseName.trim(),
      address: newHouseAddress.trim(),
      color: 'emerald',
    };

    setSaving(true);
    setFeedback(null);
    try {
      await onSaveHouses([...houses, newHouse]);
      setNewHouseName('');
      setNewHouseAddress('');
      setIsAdding(false);
      setFeedback({ type: 'success', message: 'Đã lưu nhà yến mới lên bảng dữ liệu.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Chưa lưu được nhà yến. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (house) => {
    setEditingHouseId(house.id);
    setEditName(house.name || '');
    setEditAddress(house.address || '');
    setFeedback(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim() || saving || !isAdmin) return;
    setSaving(true);
    setFeedback(null);
    try {
      await onSaveHouses(houses.map((house) =>
        house.id === editingHouseId
          ? { ...house, name: editName.trim(), address: editAddress.trim() }
          : house
      ));
      setEditingHouseId(null);
      setFeedback({ type: 'success', message: 'Đã cập nhật thông tin nhà yến.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Chưa lưu được thay đổi. Vui lòng thử lại.' });
    } finally {
      setSaving(false);
    }
  };

  const handleBackupJson = () => {
    const parseCache = (key) => {
      try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
    };
    const backupData = {
      timestamp: new Date().toISOString(),
      houses: parseCache('nhayen_cached_houses'),
      harvests: parseCache('nhayen_cached_harvests'),
      sales: parseCache('nhayen_cached_sales'),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_nhayen_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <div role="status" aria-live="polite" className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}
      {/* ─── DANH MỤC CƠ SỞ ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" /> Danh mục cơ sở nhà yến ({houses.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Các nhà yến dùng để ghi nhận nguồn thu hoạch.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="self-start sm:self-auto px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> {isAdding ? 'Đóng form' : 'Thêm cơ sở mới'}
            </button>
          )}
        </div>

        {isAdding && (
          <form onSubmit={handleAddHouse} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-800 block">Thêm cơ sở nhà yến mới:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                aria-label="Tên nhà yến mới"
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="Tên cơ sở (VD: Nhà 4 - Kiên Giang)"
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
              />
              <input
                type="text"
                aria-label="Địa chỉ nhà yến mới"
                value={newHouseAddress}
                onChange={(e) => setNewHouseAddress(e.target.value)}
                placeholder="Địa chỉ (VD: Rạch Giá, Kiên Giang)"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu nhà yến'}
            </button>
          </form>
        )}

        {/* Grid Danh Sách Các Nhà (1 col mobile, 2-3 col desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {houses.map((house, idx) => (
            <div
              key={house.id}
              className="p-4 bg-slate-50/80 hover:bg-slate-100/70 rounded-2xl border border-slate-200/70 transition"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-800">{house.name}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {house.address || 'Chưa có địa chỉ'}
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(house)} disabled={saving} aria-label={`Sửa ${house.name}`} className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer disabled:opacity-50"><Pencil className="w-4 h-4" /></button>
                    {houses.length > 1 && <button type="button" onClick={() => onRequestDelete?.('house', house)} disabled={saving} aria-label={`Xóa ${house.name}`} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                )}
              </div>
              {editingHouseId === house.id && (
                <form onSubmit={handleSaveEdit} className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                  <label className="block text-xs font-semibold text-slate-600">Tên nhà yến<input value={editName} onChange={(e) => setEditName(e.target.value)} required className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" /></label>
                  <label className="block text-xs font-semibold text-slate-600">Địa chỉ<input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900" /></label>
                  <div className="flex gap-2"><button type="button" onClick={() => setEditingHouseId(null)} className="flex-1 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700">Hủy</button><button type="submit" disabled={saving} className="flex-1 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── DỮ LIỆU & SAO LƯU ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 lg:p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-500" /> Đồng bộ & Sao lưu an toàn
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
          Dữ liệu thu hoạch và bán hàng được đồng bộ với Google Sheet. Bạn có thể tải bản sao lưu từ dữ liệu đã đồng bộ gần nhất trên máy này.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={handleBackupJson}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            Tải bản sao lưu JSON về máy
          </button>

        </div>
      </div>
    </div>
  );
}
