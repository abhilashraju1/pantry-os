import React, { useState, useEffect } from 'react';
import { Locale } from '@pantryos/i18n';
import { Ingredient, Dish, ProductionBatch } from '@pantryos/contracts';
import { formatINR } from '@pantryos/business-rules';
import { PlusCircle, TrendingDown, Send, BarChart3, Package, Layers } from 'lucide-react';

interface AdminOverviewViewProps {
  locale: Locale;
  ingredients: Ingredient[];
  dishes: Dish[];
  batches: ProductionBatch[];
  onPlanBatch: (dishId: string, yieldVal: number) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  locale,
  ingredients,
  dishes,
  onPlanBatch
}) => {
  const [selectedDishId, setSelectedDishId] = useState(dishes[0]?.id || '');
  const [plannedYieldInput, setPlannedYieldInput] = useState('');
  const [ondcTestResult, setOndcTestResult] = useState<string | null>(null);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [varianceReport, setVarianceReport] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Load live database reports
  useEffect(() => {
    fetch('/api/v1/reports/sales')
      .then((r) => r.json())
      .then((d) => d.success && setSalesReport(d.data))
      .catch(() => {});

    fetch('/api/v1/reports/variance')
      .then((r) => r.json())
      .then((d) => d.success && setVarianceReport(d.data.variance))
      .catch(() => {});
  }, []);

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishId || !plannedYieldInput) return;
    onPlanBatch(selectedDishId, parseFloat(plannedYieldInput));
    setNotification(
      locale === 'kn' ? 'ಉತ್ಪಾದನಾ ಬ್ಯಾಚ್ ಯಶಸ್ವಿಯಾಗಿ ಯೋಜಿಸಲಾಗಿದೆ!' : 'Production batch planned successfully!'
    );
    setPlannedYieldInput('');
    setTimeout(() => setNotification(null), 4000);
  };

  const runOndcSim = async () => {
    try {
      const res = await fetch('/api/v1/integrations/ondc/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: `txn_${Date.now()}` })
      });
      const data = await res.json();
      setOndcTestResult(JSON.stringify(data.context, null, 2));
    } catch {
      setOndcTestResult('Failed to ping local ONDC RET11 mock');
    }
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#234B3A', marginBottom: '16px' }}>
        {locale === 'kn' ? 'ಉಗ್ರಾಣ, ಬ್ಯಾಚ್ ಯೋಜನೆ ಮತ್ತು ವರದಿಗಳು' : 'Inventory, Batch Production & Variance Analytics'}
      </h2>

      {notification && (
        <div
          style={{
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          {notification}
        </div>
      )}

      {/* Row 1: Stock Status & Batch Planning */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Ingredient Stock Overview */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Package size={16} />
            {locale === 'kn' ? 'ಕಚ್ಚಾ ಪದಾರ್ಥಗಳ ದಾಸ್ತಾನು' : 'Ingredient Stock Balances'}
          </h3>
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {ingredients.map((ing) => {
              const isLow = ing.currentStock <= ing.reorderLevel;
              return (
                <div
                  key={ing.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: '1px solid #FAF8F3'
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
                      {locale === 'kn' ? ing.nameKn : ing.nameEn}
                    </h5>
                    <span style={{ fontSize: '11px', color: '#6B726B' }}>
                      {ing.category}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: isLow ? '#C0392B' : '#234B3A'
                      }}
                    >
                      {ing.currentStock} {ing.baseUnit}
                    </span>
                    {isLow && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          color: '#C0392B',
                          fontWeight: 700
                        }}
                      >
                        ⚠️ REORDER
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Batch Planning Form */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} />
            {locale === 'kn' ? 'ಹೊಸ ಬ್ಯಾಚ್ ಯೋಜನೆ' : 'Plan Production Batch'}
          </h3>
          <form onSubmit={handlePlanSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                {locale === 'kn' ? 'ತಿನಿಸು ಆಯ್ಕೆ ಮಾಡಿ' : 'Select Dish'}
              </label>
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #CCC',
                  fontSize: '13px'
                }}
              >
                {dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {locale === 'kn' ? d.nameKn : d.nameEn} ({d.preparationPolicy})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                {locale === 'kn' ? 'ಯೋಜಿತ ಇಳುವರಿ (ಗ್ರಾಂ/ಮಿಲಿ)' : 'Planned Yield (grams/ml)'}
              </label>
              <input
                type="number"
                value={plannedYieldInput}
                onChange={(e) => setPlannedYieldInput(e.target.value)}
                placeholder="e.g. 3000"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #CCC',
                  fontSize: '13px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={!plannedYieldInput}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: !plannedYieldInput ? '#999' : '#234B3A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: !plannedYieldInput ? 'not-allowed' : 'pointer'
              }}
            >
              {locale === 'kn' ? 'ಬ್ಯಾಚ್ ಬಿಡುಗಡೆ ಮಾಡಿ' : 'Fire Production Batch'}
            </button>
          </form>
        </div>
      </div>

      {/* Row 2: Live Sales & Actual vs Theoretical Variance Analytics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Sales Performance */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart3 size={16} />
            {locale === 'kn' ? 'ದೈನಂದಿನ ಮಾರಾಟ ಕಾರ್ಯಕ್ಷಮತೆ' : 'Daily Sales Performance'}
          </h3>
          {salesReport ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F1EC' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>{locale === 'kn' ? 'ಒಟ್ಟು ಆರ್ಡರ್‌ಗಳು' : 'Total Orders'}</span>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>{salesReport.totalOrders}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F1EC' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>{locale === 'kn' ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Sales'}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#234B3A' }}>{formatINR(salesReport.totalSalesPaise)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F3F1EC' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>{locale === 'kn' ? 'ಪಾವತಿಸಿದ ಮೊತ್ತ' : 'Paid Amount'}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#03543F' }}>{formatINR(salesReport.paidSalesPaise)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span style={{ fontSize: '13px', color: '#666' }}>GST (5%)</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatINR(salesReport.totalTaxPaise)}</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#888' }}>{locale === 'kn' ? 'ವರದಿ ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Loading sales report...'}</p>
          )}
        </div>

        {/* MarketMan Actual vs Theoretical Variance */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <TrendingDown size={16} />
            {locale === 'kn' ? 'ಪದಾರ್ಥಗಳ ಬಳಕೆ ಮತ್ತು ವ್ಯತ್ಯಾಸ (MarketMan)' : 'Actual vs Theoretical Usage Variance'}
          </h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {varianceReport.length > 0 ? (
              varianceReport.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: '1px solid #F9F8F5',
                    fontSize: '12px'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.nameEn}</span>
                  <span style={{ color: '#555' }}>
                    Used: {item.actualUsage} {item.unit} • Waste: {item.wasteQuantity} {item.unit}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '12px', color: '#888' }}>{locale === 'kn' ? 'ಯಾವುದೇ ವ್ಯತ್ಯಾಸ ದಾಖಲಾಗಿಲ್ಲ' : 'No variance data available'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: ONDC RET11 Mock Simulator */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E9E6DD' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A', marginBottom: '8px' }}>
          {locale === 'kn' ? 'ONDC RET11 ನೆಟ್‌ವರ್ಕ್ ಸಿಮ್ಯುಲೇಟರ್' : 'ONDC RET11 Network Simulator (Mock Adapter)'}
        </h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
          Simulates Beckn protocol `on_search` catalog discovery and incoming multi-channel order deduplication.
        </p>
        <button
          onClick={runOndcSim}
          style={{
            padding: '8px 14px',
            backgroundColor: '#D79B52',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {locale === 'kn' ? 'ONDC RET11 ಕ್ಯಾಟಲಾಗ್ ಪಿಂಗ್ ಮಾಡಿ' : 'Ping ONDC RET11 Catalog'}
        </button>
        {ondcTestResult && (
          <pre
            style={{
              marginTop: '12px',
              padding: '10px',
              backgroundColor: '#1E1E1E',
              color: '#4AF626',
              borderRadius: '6px',
              fontSize: '11px',
              overflowX: 'auto'
            }}
          >
            {ondcTestResult}
          </pre>
        )}
      </div>
    </div>
  );
};
