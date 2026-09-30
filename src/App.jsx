import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import Header from './components/Header';
import DesktopSidebar from './components/DesktopSidebar';
import BottomNav from './components/BottomNav';
import DashboardTab from './components/DashboardTab';
import HarvestTab from './components/HarvestTab';
import SalesTab from './components/SalesTab';
import InventoryTab from './components/InventoryTab';
import HistoryTab from './components/HistoryTab';
import HousesTab from './components/HousesTab';
import SettingsTab from './components/SettingsTab';
import UserManageTab from './components/UserManageTab';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import {
  fetchAllData, addHarvest, deleteHarvest, addSale, deleteSale,
  updateSaleStatus, saveHouses, saveConfiguration,
} from './services/api';
import { calculateInventory } from './services/storage';
import { getSession, canAccessHouse, logout } from './services/auth';
import { NEST_TYPES } from './data/constants';

const DEFAULT_APP_NAME = 'Quản lý Yến sào Minh Triều';

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [houses, setHouses] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [sales, setSales] = useState([]);
  const [nestTypes, setNestTypes] = useState(NEST_TYPES);
  const [products, setProducts] = useState([]);
  const [tags, setTags] = useState([]);
  const [settings, setSettings] = useState({});
  const [activeHouseId, setActiveHouseId] = useState('');
  const [activeTab, setActiveTab] = useState(() => getSession()?.role === 'admin' ? 'dashboard' : 'harvest');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('loading');
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const loadingData = useRef(null);
  const scrollArea = useRef(null);

  const selectTab = useCallback((tab) => {
    setActiveTab(tab);
    scrollArea.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, []);

  const showToast = useCallback((message, type = 'success', title = '') => {
    setToast({ message, type, title });
  }, []);

  const loadData = useCallback(async (manual = false, background = false) => {
    if (!session) return;
    if (!background) setIsRefreshing(true);
    const request = loadingData.current || fetchAllData({ retryOnTimeout: !background });
    loadingData.current = request;
    try {
      const data = await request;
      if (getSession()?.token !== session.token) return;
      setHouses(data.houses || []);
      setHarvests(data.harvests || []);
      setSales(data.sales || []);
      setNestTypes(data.nestTypes?.length ? data.nestTypes : NEST_TYPES);
      setProducts(data.products || []);
      setTags(data.tags || []);
      setSettings(data.settings || {});
      setSyncStatus('ready');
      setLastSyncedAt(new Date());
      if (manual) showToast('Đã cập nhật dữ liệu mới nhất từ Google Sheet.');
    } catch (error) {
      if (getSession()?.token !== session.token) return;
      setSyncStatus('offline');
      if (!background) {
        const reason = String(error.message || 'Lỗi không xác định').replace(/[.!?]+$/, '');
        showToast(`Không thể đồng bộ: ${reason}. Dữ liệu đang hiển thị chưa được cập nhật.`, 'warning');
      }
    } finally {
      if (loadingData.current === request) loadingData.current = null;
      if (!background) setIsRefreshing(false);
    }
  }, [session, showToast]);

  useEffect(() => {
    loadData();
    const refreshInBackground = () => {
      if (document.visibilityState === 'visible') loadData(false, true);
    };
    const timer = window.setInterval(refreshInBackground, 30_000);
    document.addEventListener('visibilitychange', refreshInBackground);
    window.addEventListener('focus', refreshInBackground);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshInBackground);
      window.removeEventListener('focus', refreshInBackground);
    };
  }, [loadData]);

  const visibleHouses = useMemo(() => {
    if (!session) return [];
    return houses.filter((house) => canAccessHouse(session, house.id));
  }, [houses, session]);
  const activeHouse = visibleHouses.find((house) => house.id === activeHouseId) || visibleHouses[0];
  const inventoryData = useMemo(
    () => calculateInventory(houses, harvests, sales, nestTypes),
    [houses, harvests, sales, nestTypes]
  );
  const appName = settings.appName?.trim() || DEFAULT_APP_NAME;

  const addHarvestRecord = async (record) => {
    if (!canAccessHouse(session, record.houseId)) throw new Error('Bạn không có quyền nhập cho nhà yến này.');
    const saved = await addHarvest(record);
    setHarvests((current) => [saved, ...current]);
    showToast(`Đã lưu ${Number(saved.weight).toLocaleString('vi-VN')} g thu hoạch vào Sheet.`);
    return saved;
  };
  const addSaleRecord = async (record) => {
    const saved = await addSale(record);
    setSales((current) => [saved, ...current]);
    showToast('Đã lưu đơn bán và cập nhật kho.');
    return saved;
  };
  const deleteHarvestRecord = async (id) => {
    if (session?.role !== 'admin') throw new Error('Chỉ chủ nhà được xóa phiếu.');
    await deleteHarvest(id);
    setHarvests((current) => current.filter((item) => item.id !== id));
    showToast('Đã xóa phiếu thu hoạch.', 'info');
  };
  const deleteSaleRecord = async (id) => {
    if (session?.role !== 'admin') throw new Error('Chỉ chủ nhà được xóa đơn.');
    await deleteSale(id);
    setSales((current) => current.filter((item) => item.id !== id));
    showToast('Đã xóa đơn bán.', 'info');
  };
  const changeSaleStatus = async (id, status) => {
    await updateSaleStatus(id, status);
    setSales((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    showToast(status === 'paid' ? 'Đã ghi nhận thu tiền.' : 'Đã chuyển sang ghi nợ.');
  };
  const saveHouseList = async (nextHouses) => {
    const saved = await saveHouses(nextHouses);
    setHouses(saved);
    showToast('Đã lưu danh sách nhà yến vào Sheet.');
    return saved;
  };
  const saveAppConfiguration = async (configuration) => {
    const saved = await saveConfiguration(configuration);
    setNestTypes(saved.nestTypes);
    setProducts(saved.products);
    setTags(saved.tags);
    setSettings(saved.settings);
    showToast('Đã lưu danh mục và tên gọi vào Sheet.');
    return saved;
  };
  const requestDelete = (kind, item) => {
    if (session?.role !== 'admin') return;
    const isHarvest = kind === 'harvest';
    const isHouse = kind === 'house';
    setConfirmModal({
      isOpen: true,
      title: isHouse ? 'Ngừng sử dụng nhà yến?' : isHarvest ? 'Xóa phiếu thu hoạch?' : 'Xóa đơn bán?',
      message: isHouse
        ? `Nhà ${item.name} sẽ ẩn khỏi danh sách nhập liệu. Các phiếu cũ vẫn được giữ trong Google Sheet.`
        : isHarvest
        ? `Phiếu ${Number(item.weight).toLocaleString('vi-VN')} g ngày ${item.date} sẽ bị xóa khỏi Google Sheet.`
        : `Đơn của ${item.customerName} ngày ${item.date} sẽ bị xóa khỏi Google Sheet.`,
      confirmLabel: isHouse ? 'Ngừng sử dụng' : 'Xóa',
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          if (isHouse) await saveHouseList(houses.filter((house) => String(house.id) !== String(item.id)));
          else if (isHarvest) await deleteHarvestRecord(item.id);
          else await deleteSaleRecord(item.id);
        } catch (error) {
          showToast(`Chưa xóa được: ${error.message}`, 'error');
        } finally {
          setIsDeleting(false);
          setConfirmModal({ isOpen: false });
        }
      },
    });
  };
  const signOut = () => {
    logout();
    loadingData.current = null;
    setSession(null);
    setHouses([]);
    setHarvests([]);
    setSales([]);
    setProducts([]);
    setTags([]);
    setSettings({});
    setSyncStatus('loading');
    setLastSyncedAt(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab houses={visibleHouses} harvests={harvests.filter((item) => canAccessHouse(session, item.houseId))} sales={sales} inventoryData={inventoryData} session={session} />;
      case 'harvest':
        return <HarvestTab activeHouse={activeHouse} houses={visibleHouses} onSelectHouse={(house) => setActiveHouseId(house?.id || '')} session={session} harvests={harvests.filter((item) => canAccessHouse(session, item.houseId))} nestTypes={nestTypes} tags={tags} onAddHarvest={addHarvestRecord} onNavigateToHistory={() => selectTab('history')} onRequestDelete={requestDelete} />;
      case 'sales':
        return <SalesTab sales={sales} inventoryData={inventoryData} products={products} nestTypes={nestTypes} tags={tags} session={session} onAddSale={addSaleRecord} onUpdateSaleStatus={changeSaleStatus} onRequestDelete={requestDelete} />;
      case 'inventory':
        return <InventoryTab inventoryData={inventoryData} nestTypes={nestTypes} session={session} />;
      case 'history':
        return <HistoryTab houses={visibleHouses} harvests={harvests.filter((item) => canAccessHouse(session, item.houseId))} sales={sales} inventoryData={inventoryData} nestTypes={nestTypes} products={products} tags={tags} session={session} onRequestDelete={requestDelete} />;
      case 'houses':
        return session?.role === 'admin' ? <HousesTab houses={houses} session={session} onSaveHouses={saveHouseList} onRequestDelete={requestDelete} /> : null;
      case 'settings':
        return session?.role === 'admin' ? <SettingsTab nestTypes={nestTypes} products={products} tags={tags} settings={settings} onSaveConfiguration={saveAppConfiguration} /> : null;
      case 'users':
        return <UserManageTab session={session} houses={visibleHouses} />;
      default:
        return null;
    }
  };

  if (!session) {
    return <LoginScreen onLoginSuccess={(nextSession) => {
      setSession(nextSession);
      setActiveTab(nextSession.role === 'admin' ? 'dashboard' : 'harvest');
      setSyncStatus('loading');
      showToast(`Xin chào ${nextSession.name}.`);
    }} />;
  }

  return (
    <div className="app-shell">
      <DesktopSidebar activeTab={activeTab} setActiveTab={selectTab} session={session} onLogout={signOut} appName={appName} settings={settings} sales={sales} />
      <div className="mobile-main-column min-w-0 flex-1">
        <Header activeTab={activeTab} appName={appName} settings={settings} session={session} onRefresh={() => loadData(true)} isRefreshing={isRefreshing} syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} />
        <main ref={scrollArea} id="main-content" className="mobile-scroll-area mobile-content mx-auto w-full max-w-7xl px-3 pt-3 sm:px-5 lg:px-8 lg:pb-10 lg:pt-0">
          {renderContent()}
        </main>
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={selectTab} session={session} onLogout={signOut} settings={settings} />
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} variant={confirmModal.variant} loading={isDeleting} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
    </div>
  );
}
