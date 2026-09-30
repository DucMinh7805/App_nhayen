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
import {
  getHouses,
  saveHouses,
  getHarvests,
  addHarvest,
  deleteHarvest,
  getSales,
  addSale,
  deleteSale,
  updateSaleStatus,
} from './services/api';
import { calculateInventory, exportToExcel } from './services/storage';
import { getSession, canAccessHouse, logout } from './services/auth';
import { DEFAULT_HOUSES, INITIAL_HARVESTS, INITIAL_SALES } from './data/constants';

// ─── Loading Overlay ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-100/70 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-semibold px-4 py-2.5 flex items-center justify-between">
      <span>⚠ {message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline">Thử lại</button>
      )}
    </div>
  );
}

export default function App() {
  // ─── Auth ────────────────────────────────────────────────────────────────
  const [session, setSession] = useState(() => getSession());

  // ─── Data State ──────────────────────────────────────────────────────────
  const [houses, setHouses] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeHouse, setActiveHouse] = useState(null);
  const [activeTab, setActiveTab] = useState('harvest');

  // ─── UI State ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ─── Load dữ liệu từ API (Google Sheets hoặc localStorage) ────────────────
  const loadAllData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setApiError(null);
    try {
      const [h, harv, s] = await Promise.all([getHouses(), getHarvests(), getSales()]);
      setHouses(h);
      setHarvests(harv);
      setSales(s);
      setActiveHouse((prev) => {
        if (prev && h.find((hh) => hh.id === prev.id)) return prev;
        return h[0] || DEFAULT_HOUSES[0];
      });
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      setApiError('Không thể kết nối. Kiểm tra mạng và thử lại.');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // ─── Nhà yến nhân viên được phép thấy ────────────────────────────────────
  const visibleHouses = useMemo(() => {
    if (!session) return [];
    if (!session.allowedHouses) return houses;
    return houses.filter((h) => session.allowedHouses.includes(h.id));
  }, [houses, session]);

  // ─── Tính tồn kho real-time ───────────────────────────────────────────────
  const inventoryData = useMemo(
    () => calculateInventory(houses, harvests, sales),
    [houses, harvests, sales]
  );

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleAddHarvest = async (newHarvest) => {
    if (!canAccessHouse(session, newHarvest.houseId)) {
      alert('Bạn không có quyền nhập liệu cho nhà yến này!');
      return;
    }
    try {
      await addHarvest(newHarvest);
      setHarvests((prev) => [newHarvest, ...prev]);
    } catch (err) {
      alert('Lỗi lưu phiếu thu: ' + err.message);
    }
  };

  const handleDeleteHarvest = async (id) => {
    if (!session?.canDeleteRecords) {
      alert('Bạn không có quyền xóa phiếu. Hãy liên hệ Admin!');
      return;
    }
    try {
      await deleteHarvest(id);
      setHarvests((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Lỗi xóa phiếu: ' + err.message);
    }
  };

  const handleAddSale = async (newSale) => {
    if (!canAccessHouse(session, newSale.houseId)) {
      alert('Bạn không có quyền xuất bán từ kho này!');
      return;
    }
    try {
      await addSale(newSale);
      setSales((prev) => [newSale, ...prev]);
    } catch (err) {
      alert('Lỗi lưu đơn bán: ' + err.message);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!session?.canDeleteRecords) {
      alert('Bạn không có quyền xóa đơn bán. Hãy liên hệ Admin!');
      return;
    }
    try {
      await deleteSale(id);
      setSales((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      alert('Lỗi xóa đơn: ' + err.message);
    }
  };

  const handleUpdateSaleStatus = async (id, newStatus) => {
    try {
      await updateSaleStatus(id, newStatus);
      setSales((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleSaveHouses = async (updatedHouses) => {
    try {
      await saveHouses(updatedHouses);
      setHouses(updatedHouses);
    } catch (err) {
      alert('Lỗi lưu danh sách nhà: ' + err.message);
    }
  };

  const handleTransferStock = async (fromHouseId, toHouseId, weight, note) => {
    const fromHouse = houses.find((h) => h.id === fromHouseId);
    const toHouse   = houses.find((h) => h.id === toHouseId);

    const transferOut = {
      id: 'trans_out_' + Date.now(),
      houseId: fromHouseId, houseName: fromHouse?.name || fromHouseId,
      date: new Date().toISOString().slice(0, 10),
      customerName: `Chuyển kho ➔ ${toHouse?.name || toHouseId}`,
      customerPhone: '', weight: Number(weight),
      typeId: 'tho_a', typeName: 'Tổ thô (Chuyển kho)',
      pricePer100g: 0, totalAmount: 0, status: 'paid',
      note: note || 'Luân chuyển nội bộ',
      createdAt: new Date().toISOString(),
    };
    const transferIn = {
      id: 'trans_in_' + Date.now(),
      houseId: toHouseId, houseName: toHouse?.name || toHouseId,
      date: new Date().toISOString().slice(0, 10),
      weight: Number(weight), typeId: 'tho_a',
      typeName: 'Tổ thô (Nhận chuyển kho)',
      shift: 'Chuyển kho nội bộ',
      note: `Nhận từ [${fromHouse?.name}]: ${note}`,
      staffName: session?.name || 'Hệ thống',
      createdAt: new Date().toISOString(),
    };

    try {
      await Promise.all([addSale(transferOut), addHarvest(transferIn)]);
      setSales((prev) => [transferOut, ...prev]);
      setHarvests((prev) => [transferIn, ...prev]);
      alert(`✅ Luân chuyển ${weight}g: ${fromHouse?.name} → ${toHouse?.name}`);
    } catch (err) {
      alert('Lỗi chuyển kho: ' + err.message);
    }
  };

  const handleResetData = async () => {
    if (!session?.canDeleteRecords) {
      alert('Chỉ Admin mới có thể đặt lại dữ liệu!');
      return;
    }
    if (confirm('Đặt lại dữ liệu? Thao tác này không thể hoàn tác!')) {
      localStorage.clear();
      setHouses(DEFAULT_HOUSES);
      setActiveHouse(DEFAULT_HOUSES[0]);
      setHarvests(INITIAL_HARVESTS);
      setSales(INITIAL_SALES);
      alert('Đã khôi phục dữ liệu gốc!');
    }
  };

  const handleExport = () => {
    exportToExcel(harvests, sales, inventoryData);
  };

  // ─── Màn hình Đăng nhập ───────────────────────────────────────────────────
  if (!session) {
    return <LoginScreen onLoginSuccess={(s) => { setSession(s); setActiveTab('harvest'); }} />;
  }

  // ─── Loading khi load lần đầu ─────────────────────────────────────────────
  if (loading && houses.length === 0) return <LoadingScreen />;

  // ─── Main App ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100/70 sm:py-4 flex justify-center text-slate-800">
      {apiError && <ErrorBanner message={apiError} onRetry={loadAllData} />}
      <div className="w-full max-w-md bg-slate-50 min-h-screen sm:min-h-[850px] sm:max-h-[920px] flex flex-col shadow-sm sm:shadow-xl sm:rounded-3xl sm:border border-slate-200/80 overflow-hidden">

        <Header
          activeHouse={activeHouse || visibleHouses[0] || DEFAULT_HOUSES[0]}
          setActiveHouse={setActiveHouse}
          houses={visibleHouses}
          session={session}
          onLogout={() => { logout(); setSession(null); setHouses([]); }}
          onExport={handleExport}
          harvests={harvests}
          sales={sales}
          inventoryData={inventoryData}
        />

        <main className="flex-1 p-3.5 sm:p-4 pb-8 overflow-y-auto">
          {activeTab === 'harvest' && (
            <HarvestTab
              activeHouse={activeHouse || visibleHouses[0]}
              session={session}
              harvests={harvests.filter((h) => canAccessHouse(session, h.houseId))}
              onAddHarvest={handleAddHarvest}
              onDeleteHarvest={handleDeleteHarvest}
              onNavigateToHistory={() => setActiveTab('history')}
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
            />
          )}
          {activeTab === 'houses' && (
            <HousesTab
              houses={houses}
              session={session}
              onSaveHouses={handleSaveHouses}
              onResetData={handleResetData}
            />
          )}
          {activeTab === 'users' && (
            <UserManageTab session={session} houses={houses} />
          )}
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} session={session} />
      </div>
    </div>
  );
}
