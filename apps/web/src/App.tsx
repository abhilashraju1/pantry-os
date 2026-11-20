import React, { useState, useEffect } from 'react';
import { Locale } from '@pantryos/i18n';
import { Dish, Order, ProductionBatch, Equipment, Ingredient } from '@pantryos/contracts';
import { Navbar, AppView } from './components/Navbar.js';
import { CashierPOSView } from './views/CashierPOSView.js';
import { ChefKDSView } from './views/ChefKDSView.js';
import { CustomerQRView } from './views/CustomerQRView.js';
import { AdminOverviewView } from './views/AdminOverviewView.js';
import { PackingPassView } from './views/PackingPassView.js';
import { LoginView } from './views/LoginView.js';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('pos');
  const [locale, setLocale] = useState<Locale>('kn');
  const [activeTableNumber, setActiveTableNumber] = useState('T1');
  const [tableSessionToken, setTableSessionToken] = useState<string>('token_t1_98a7f');
  const [tableSessionStatus, setTableSessionStatus] = useState<'ACTIVE' | 'BILL_REQUESTED' | 'CLOSED'>('ACTIVE');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Check current session from /api/v1/auth/me
  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data?.user) {
          setCurrentUser(res.data.user);
        }
      })
      .catch(() => {})
      .finally(() => setIsAuthChecking(false));
  }, []);

  // Read URL query parameters on initial load (e.g. ?view=qr&table=T2&token=token_t2_11b3c)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as AppView | null;
      const tableParam = params.get('table');
      const tokenParam = params.get('token') || params.get('tableToken');

      if (viewParam && ['pos', 'kds', 'qr', 'admin', 'packing'].includes(viewParam)) {
        setCurrentView(viewParam);
      }
      if (tableParam) {
        setActiveTableNumber(tableParam);
      }

      // If opening in QR mode, exchange table token for session
      if (viewParam === 'qr' || tokenParam) {
        const tok = tokenParam || (tableParam === 'T2' ? 'token_t2_11b3c' : 'token_t1_98a7f');
        fetch('/api/v1/auth/table-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableToken: tok })
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.success && res.data) {
              setTableSessionToken(res.data.sessionToken);
              setActiveTableNumber(res.data.tableNumber);
              setTableSessionStatus('ACTIVE');
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Fetch initial state from API
  const refreshData = async () => {
    try {
      const [menuRes, ordersRes, batchesRes, eqRes, ingRes] = await Promise.all([
        fetch('/api/v1/menu').then((r) => r.json()),
        fetch('/api/v1/orders').then((r) => r.json()),
        fetch('/api/v1/batches').then((r) => r.json()),
        fetch('/api/v1/equipment').then((r) => r.json()),
        fetch('/api/v1/inventory/items').then((r) => r.json())
      ]);

      if (menuRes.success) setDishes(menuRes.data.dishes);
      if (ordersRes.success) setOrders(ordersRes.data.orders);
      if (batchesRes.success) setBatches(batchesRes.data.batches);
      if (eqRes.success) setEquipment(eqRes.data.equipment);
      if (ingRes.success) setIngredients(ingRes.data.items);
    } catch (e) {
      console.warn('Backend API refresh error:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
  };

  const handleOrderCreated = async (orderPayload: any) => {
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (data.success && orderPayload.paymentMethod) {
        // Record payment for POS orders
        await fetch('/api/v1/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.data.order.id,
            amountPaise: data.data.order.totalPaise,
            method: orderPayload.paymentMethod
          })
        });
      }
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQualitySignoff = async (batchId: string, actualYield: number, tempC: number) => {
    try {
      await fetch(`/api/v1/batches/${batchId}/quality-signoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualUsableYield: actualYield,
          coreTemperatureC: tempC,
          sensoryCheckPassed: true
        })
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcquireLock = async (equipmentId: string, taskId: string, durationMinutes: number) => {
    try {
      await fetch('/api/v1/equipment/acquire-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId, taskId, durationMinutes })
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReleaseLock = async (equipmentId: string) => {
    try {
      await fetch('/api/v1/equipment/release-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equipmentId })
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlanBatch = async (dishId: string, plannedYield: number) => {
    try {
      await fetch('/api/v1/batches/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishId, plannedYield })
      });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkPacked = async (orderId: string) => {
    try {
      await fetch(`/api/v1/orders/${orderId}/packed`, { method: 'POST' });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleHandoff = async (orderId: string) => {
    try {
      await fetch(`/api/v1/orders/${orderId}/handoff`, { method: 'POST' });
      refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestBill = async () => {
    try {
      await fetch('/api/v1/orders/request-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableSessionToken })
      });
      setTableSessionStatus('BILL_REQUESTED');
    } catch (err) {
      console.error(err);
    }
  };

  // 1. If currently on QR view: render Customer QR directly (account-free, no staff navbar)
  if (currentView === 'qr') {
    return (
      <CustomerQRView
        locale={locale}
        dishes={dishes}
        activeTableNumber={activeTableNumber}
        tableOrders={orders.filter((o) => (o as any).tableNumber === activeTableNumber || (o as any).tableId)}
        onPlaceOrder={(items) =>
          handleOrderCreated({
            channel: 'QR_TABLE',
            tableSessionToken,
            tableNumber: activeTableNumber,
            items
          })
        }
        onRequestBill={handleRequestBill}
        onLocaleChange={setLocale}
        tableSessionStatus={tableSessionStatus}
      />
    );
  }

  // 2. If checking auth: show subtle loading indicator
  if (isAuthChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF8F3' }}>
        <p style={{ color: '#234B3A', fontWeight: 600 }}>Loading PantryOS...</p>
      </div>
    );
  }

  // 3. If not signed in as staff: render real LoginView
  if (!currentUser) {
    return (
      <LoginView
        locale={locale}
        onLocaleChange={setLocale}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          const r = user.roles || [];
          if (r.includes('CHEF') && !r.includes('BRANCH_MANAGER')) setCurrentView('kds');
          else if (r.includes('PACKER') && !r.includes('BRANCH_MANAGER')) setCurrentView('packing');
          else setCurrentView('pos');
        }}
      />
    );
  }

  // 4. Staff Workspace (Navbar + View)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF8F3' }}>
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        locale={locale}
        onLocaleChange={setLocale}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'pos' && (
          <CashierPOSView
            locale={locale}
            dishes={dishes}
            onOrderCreated={handleOrderCreated}
          />
        )}

        {currentView === 'kds' && (
          <ChefKDSView
            locale={locale}
            orders={orders}
            batches={batches}
            equipment={equipment}
            onQualitySignoff={handleQualitySignoff}
            onAcquireLock={handleAcquireLock}
            onReleaseLock={handleReleaseLock}
          />
        )}

        {currentView === 'admin' && (
          <AdminOverviewView
            locale={locale}
            ingredients={ingredients}
            dishes={dishes}
            batches={batches}
            onPlanBatch={handlePlanBatch}
          />
        )}

        {currentView === 'packing' && (
          <PackingPassView
            locale={locale}
            orders={orders}
            onMarkPacked={handleMarkPacked}
            onHandoff={handleHandoff}
          />
        )}
      </main>
    </div>
  );
};
