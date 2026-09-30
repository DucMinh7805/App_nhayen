import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import HarvestTab from './components/HarvestTab';
import HistoryTab from './components/HistoryTab';
import InventoryTab from './components/InventoryTab';
import SalesTab from './components/SalesTab';
import HousesTab from './components/HousesTab';
import UserManageTab from './components/UserManageTab';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';

import {
  fetchAllData,
  getHouses,
  saveHouses,
  addHarvest,
  deleteHarvest,
  addSale,
  deleteSale,
  updateSaleStatus,
  loginUser,
} from './services/api';
import { calculateInventory, exportToExcel } from './services/storage';
import { getSession, canAccessHouse, logout } from './services/auth';
import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES } from './data/constants';

export default function App() {
  // ─── AUTH STATE ───────────────────────────────────────────────────────────
  const [session, setSession] = useState(() => getSession());

  // ─── DATA STATE ───────────────────────────────────────────────────────────
  const [houses, setHouses] = useState(DEFAULT_HOUSES);
  const [harvests, setHarvests] = useState(INITIAL_HARVESTS);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [activeHouse, setActiveHouse] = useState(DEFAULT_HOUSES[0]);
  const [activeTab, setActiveTab] = useState('harvest');

  // ─── UI FEEDBACK STATE (TOAST & MODAL) ────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  const showToast = (message, type = 'success', title = '') => {
    setToast({ message, type, title });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── SWR SYNC: Tải dữ liệu từ Google Sheet ────────────────────────────────
  const loadData = useCallback(async (isManual = false) => {
    if (!session) return;
    setIsRefreshing(true);
    try {
      const res = await fetchAllData();
      if (res.houses && res.houses.length > 0) setHouses(res.houses);
      if (res.harvests) setHarvests(res.harvests);
      if (res.sales) setSales(res.sales);

      if (isManual) {
        showToast('Đã đồng bộ dữ liệu mới nhất từ Google Sheet!', 'success', 'Đồng bộ hoàn tất');
      }
    } catch (err) {
      console.warn('Lỗi đồng bộ dữ liệu:', err);
      if (isManual) {
        showToast('Không thể kết nối Google Sheet lúc này. Đang dùng dữ liệu bộ nhớ đệm.', 'warning');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Cập nhật nhà yến được phân công cho nhân viên ────────────────────────
  const visibleHouses = useMemo(() => {
    if (!session) return [];
    if (!session.allowedHouses || session.allowedHouses.length === 0 || session.role === 'admin' || session.role === 'manager') {
      return houses;
    }
    const allowed = Array.isArray(session.allowedHouses)
      ? session.allowedHouses
      : String(session.allowedHouses).split(',').map((s) => s.trim());
    return houses.filter((h) => allowed.includes(h.id));
  }, [houses, session]);

  // Đồng bộ activeHouse khi visibleHouses thay đổi
  useEffect(() => {
    if (visibleHouses.length > 0 && !visibleHouses.find((h) => h.id === activeHouse?.id)) {
      setActiveHouse(visibleHouses[0]);
    }
  }, [visibleHouses, activeHouse]);

  // ─── TÍNH TOÁN TỒN KHO REAL-TIME ──────────────────────────────────────────
  const inventoryData = useMemo(
    () => calculateInventory(houses, harvests, sales),
    [houses, harvests, sales]
  );

  // ─── THAO TÁC THU HOẠCH ───────────────────────────────────────────────────
  const handleAddHarvest = async (newHarvest) => {
    if (!canAccessHouse(session, newHarvest.houseId)) {
      showToast('Bạn không có quyền nhập liệu cho nhà yến này!', 'error');
      return;
    }

    // Optimistic UI Update
    setHarvests((prev) => [newHarvest, ...prev]);
    showToast(`Đã ghi nhận +${newHarvest.weight}g vào kho [${newHarvest.houseName}]`, 'success');

    try {
      await addHarvest(newHarvest);
    } catch (err) {
      console.error(err);
      showToast('Lỗi gửi lên Google Sheet: ' + err.message, 'warning');
    }
  };

  const handleDeleteHarvest = async (id) => {
    if (!session?.canDeleteRecords) {
      showToast('Chỉ Quản trị viên mới có quyền xóa phiếu!', 'error');
      return;
    }
    setHarvests((prev) => prev.filter((i) => i.id !== id));
    showToast('Đã xóa phiếu thu hoạch', 'info');

    try {
      await deleteHarvest(id);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── THAO TÁC BÁN HÀNG ────────────────────────────────────────────────────
  const handleAddSale = async (newSale) => {
    if (!canAccessHouse(session, newSale.houseId)) {
      showToast('Bạn không có quyền xuất bán từ kho này!', 'error');
      return;
    }

    setSales((prev) => [newSale, ...prev]);
    showToast(`Đã tạo đơn bán ${newSale.weight}g cho [${newSale.customerName}]`, 'success');

    try {
      await addSale(newSale);
    } catch (err) {
      console.error(err);
      showToast('Lỗi gửi lên Google Sheet: ' + err.message, 'warning');
    }
  };

  const handleDeleteSale = async (id) => {
    if (!session?.canDeleteRecords) {
      showToast('Chỉ Quản trị viên mới có quyền xóa đơn bán!', 'error');
      return;
    }
    setSales((prev) => prev.filter((i) => i.id !== id));
    showToast('Đã xóa đơn bán hàng', 'info');

    try {
      await deleteSale(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSaleStatus = async (id, newStatus) => {
    setSales((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
    showToast(newStatus === 'paid' ? 'Đã thu tiền đơn hàng!' : 'Đã chuyển sang ghi nợ', 'success');

    try {
      await updateSaleStatus(id, newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── THAO TÁC CƠ SỞ & LUÂN CHUYỂN ─────────────────────────────────────────
  const handleSaveHouses = async (updatedHouses) => {
    setHouses(updatedHouses);
    showToast('Đã cập nhật danh sách nhà yến!', 'success');
    try {
      await saveHouses(updatedHouses);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferStock = async (fromHouseId, toHouseId, weight, note) => {
    const fromHouse = houses.find((h) => h.id === fromHouseId);
    const toHouse = houses.find((h) => h.id === toHouseId);

    const transferOut = {
      id: 'trans_out_' + Date.now(),
      houseId: fromHouseId,
      houseName: fromHouse?.name || fromHouseId,
      date: new Date().toISOString().slice(0, 10),
      customerName: `Chuyển kho ➔ ${toHouse?.name || toHouseId}`,
      customerPhone: '',
      weight: Number(weight),
      typeId: 'tho_a',
      typeName: 'Tổ thô (Chuyển kho)',
      pricePer100g: 0,
      totalAmount: 0,
      status: 'paid',
      note: note || 'Luân chuyển nội bộ',
      createdAt: new Date().toISOString(),
    };

    const transferIn = {
      id: 'trans_in_' + Date.now(),
      houseId: toHouseId,
      houseName: toHouse?.name || toHouseId,
      date: new Date().toISOString().slice(0, 10),
      weight: Number(weight),
      typeId: 'tho_a',
      typeName: 'Tổ thô (Nhận chuyển kho)',
      shift: 'Chuyển kho nội bộ',
      note: `Nhận từ [${fromHouse?.name}]: ${note}`,
      staffName: session?.name || 'Hệ thống',
      createdAt: new Date().toISOString(),
    };

    setSales((prev) => [transferOut, ...prev]);
    setHarvests((prev) => [transferIn, ...prev]);
    showToast(`Đã luân chuyển ${weight}g từ [${fromHouse?.name}] sang [${toHouse?.name}]!`, 'success');

    try {
      await Promise.all([addSale(transferOut), addHarvest(transferIn)]);
    } catch (err) {
      console.error(err);
    }
  };

  // ─── MODAL XÁC NHẬN XÓA ───────────────────────────────────────────────────
  const handleRequestDelete = (type, item) => {
    if (!session?.canDeleteRecords) {
      showToast('Chỉ Quản trị viên mới có quyền xóa dữ liệu!', 'error');
      return;
    }

    if (type === 'harvest') {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận xóa phiếu thu',
        message: `Bạn có chắc muốn xóa phiếu thu ngày ${item.date} (${item.weight}g - ${item.typeName}) tại [${item.houseName}]?`,
        confirmLabel: 'Xóa phiếu',
        variant: 'danger',
        onConfirm: () => {
          handleDeleteHarvest(item.id);
          setConfirmModal({ isOpen: false });
        },
      });
    } else if (type === 'sale') {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận xóa đơn bán',
        message: `Bạn có chắc muốn xóa đơn bán của khách hàng [${item.customerName}] (${item.weight}g - ${(item.totalAmount || 0).toLocaleString('vi-VN')} đ)?`,
        confirmLabel: 'Xóa đơn',
        variant: 'danger',
        onConfirm: () => {
          handleDeleteSale(item.id);
          setConfirmModal({ isOpen: false });
        },
      });
    } else if (type === 'house') {
      setConfirmModal({
        isOpen: true,
        title: 'Xác nhận xóa cơ sở',
        message: `Bạn có chắc muốn xóa cơ sở [${item.name}] khỏi danh mục?`,
        confirmLabel: 'Xóa cơ sở',
        variant: 'danger',
        onConfirm: () => {
          handleSaveHouses(houses.filter((h) => h.id !== item.id));
          setConfirmModal({ isOpen: false });
        },
      });
    }
  };

  const handleResetData = () => {
    if (!session?.canDeleteRecords) {
      showToast('Chỉ Quản trị viên mới có thể đặt lại dữ liệu!', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Khôi phục dữ liệu gốc',
      message: 'Thao tác này sẽ đặt lại danh sách nhà yến và các phiếu mẫu ban đầu. Bạn có chắc chắn?',
      confirmLabel: 'Khôi phục ngay',
      variant: 'warning',
      onConfirm: () => {
        localStorage.clear();
        setHouses(DEFAULT_HOUSES);
        setActiveHouse(DEFAULT_HOUSES[0]);
        setHarvests(INITIAL_HARVESTS);
        setSales(INITIAL_SALES);
        setConfirmModal({ isOpen: false });
        showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'success');
      },
    });
  };

  // ─── NẾU CHƯA ĐĂNG NHẬP ───────────────────────────────────────────────────
  if (!session) {
    return (
      <LoginScreen
        onLoginSuccess={(s) => {
          setSession(s);
          setActiveTab('harvest');
          showToast(`Chào mừng trở lại, ${s.name}!`, 'success');
        }}
      />
    );
  }

  // ─── GIAO DIỆN CHÍNH (PRO LUXURY MOBILE SHELL) ────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100/70 sm:py-4 flex justify-center text-slate-800">
      {/* Khung ứng dụng Mobile App Shell */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen sm:min-h-[860px] sm:max-h-[920px] flex flex-col shadow-sm sm:shadow-2xl sm:rounded-3xl sm:border border-slate-200/80 overflow-hidden relative">

        {/* Header trên cùng */}
        <Header
          activeHouse={activeHouse || visibleHouses[0] || DEFAULT_HOUSES[0]}
          setActiveHouse={setActiveHouse}
          houses={visibleHouses}
          session={session}
          onLogout={() => {
            logout();
            setSession(null);
            showToast('Đã đăng xuất khỏi hệ thống', 'info');
          }}
          onRefresh={() => loadData(true)}
          isRefreshing={isRefreshing}
          harvests={harvests}
          sales={sales}
          inventoryData={inventoryData}
        />

        {/* Nội dung các Tab */}
        <main className="flex-1 p-3.5 sm:p-4 pb-8 overflow-y-auto">
          {activeTab === 'harvest' && (
            <HarvestTab
              activeHouse={activeHouse || visibleHouses[0]}
              session={session}
              harvests={harvests.filter((h) => canAccessHouse(session, h.houseId))}
              onAddHarvest={handleAddHarvest}
              onDeleteHarvest={handleDeleteHarvest}
              onNavigateToHistory={() => setActiveTab('history')}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab
              houses={visibleHouses}
              harvests={harvests.filter((h) => canAccessHouse(session, h.houseId))}
              sales={sales.filter((s) => canAccessHouse(session, s.houseId))}
              inventoryData={inventoryData}
              onDeleteHarvest={handleDeleteHarvest}
              session={session}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventoryData={{
                ...inventoryData,
                byHouse: inventoryData.byHouse.filter((h) => canAccessHouse(session, h.houseId)),
              }}
              houses={visibleHouses}
              session={session}
              onTransferStock={handleTransferStock}
            />
          )}

          {activeTab === 'sales' && (
            <SalesTab
              houses={visibleHouses}
              sales={sales.filter((s) => canAccessHouse(session, s.houseId))}
              inventoryData={inventoryData}
              session={session}
              onAddSale={handleAddSale}
              onDeleteSale={handleDeleteSale}
              onUpdateSaleStatus={handleUpdateSaleStatus}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {activeTab === 'houses' && (
            <HousesTab
              houses={houses}
              session={session}
              onSaveHouses={handleSaveHouses}
              onResetData={handleResetData}
              onRequestDelete={handleRequestDelete}
            />
          )}

          {activeTab === 'users' && (
            <UserManageTab session={session} houses={houses} />
          )}
        </main>

        {/* Thanh Điều Hướng Đáy Màn Hình */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} session={session} />

        {/* Toast thông báo nổi */}
        <Toast toast={toast} onClose={() => setToast(null)} />

        {/* Modal xác nhận */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false })}
        />
      </div>
    </div>
  );
}
