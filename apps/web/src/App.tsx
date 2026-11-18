import React, { useState, useEffect } from 'react';
import { Locale } from '@pantryos/i18n';
import { Dish, Order, ProductionBatch, Equipment, Ingredient } from '@pantryos/contracts';
import { Navbar, AppView } from './components/Navbar.js';
import { CashierPOSView } from './views/CashierPOSView.js';
import { ChefKDSView } from './views/ChefKDSView.js';
import { CustomerQRView } from './views/CustomerQRView.js';
import { AdminOverviewView } from './views/AdminOverviewView.js';
import { PackingPassView } from './views/PackingPassView.js';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('pos');
  const [locale, setLocale] = useState<Locale>('kn');
  const [activeTableNumber, setActiveTableNumber] = useState('T1');
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Read URL query parameters on initial load (e.g. from QR scan: ?view=qr&table=T2)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view') as AppView | null;
      const tableParam = params.get('table');

      if (viewParam && ['pos', 'kds', 'qr', 'admin', 'packing'].includes(viewParam)) {
        setCurrentView(viewParam);
      }
      if (tableParam) {
        setActiveTableNumber(tableParam);
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
      console.warn('Backend API offline or unreachable, using live memory fallbacks');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleOrderCreated = async (orderPayload: any) => {
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();
      if (data.success && orderPayload.paymentMethod) {
        // Record payment immediately for POS orders
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        locale={locale}
        onLocaleChange={setLocale}
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

        {currentView === 'qr' && (
          <CustomerQRView
            locale={locale}
            dishes={dishes}
            activeTableNumber={activeTableNumber}
            onTableChange={setActiveTableNumber}
            tableOrders={orders.filter((o) => o.tableNumber === activeTableNumber)}
            onPlaceOrder={(items) =>
              handleOrderCreated({
                channel: 'QR_TABLE',
                tableSessionToken: `sess_token_${activeTableNumber.toLowerCase()}`,
                tableNumber: activeTableNumber,
                items
              })
            }
            onRequestBill={() =>
              alert(`Bill requested for Table ${activeTableNumber}! Cashier will present bill at your table.`)
            }
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
