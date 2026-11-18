import React, { useState } from 'react';
import { Locale } from '@pantryos/i18n';
import { Ingredient, Dish, ProductionBatch } from '@pantryos/contracts';
import { PlusCircle, TrendingDown, Send } from 'lucide-react';

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
  const [plannedYieldInput, setPlannedYieldInput] = useState('3000');
  const [ondcTestResult, setOndcTestResult] = useState<string | null>(null);

  const handlePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlanBatch(selectedDishId, parseFloat(plannedYieldInput));
    alert('Production batch planned! Assigned to kitchen.');
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', overflowY: 'auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#234B3A', marginBottom: '20px' }}>
        {locale === 'kn' ? 'ಉಗ್ರಾಣ, ಬ್ಯಾಚ್ ಯೋಜನೆ ಮತ್ತು ವರದಿಗಳು' : 'Inventory, Batch Production & Variance Analytics'}
      </h2>

      {/* Row 1: Stock Status & Batch Planning */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Ingredient Stock Overview */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#234B3A', marginBottom: '12px' }}>
            {locale === 'kn' ? 'ಕಚ್ಚಾ ಪದಾರ್ಥಗಳ ದಾಸ್ತಾನು' : 'Ingredient Stock Balances'}
          </h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
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
                    <h5 style={{ fontSize: '14px', fontWeight: 600 }}>
                      {locale === 'kn' ? ing.nameKn : ing.nameEn}
                    </h5>
                    <span style={{ fontSize: '11px', color: '#6B726B' }}>
                      Category: {ing.category}
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

        {/* Plan Cooking Batch Form */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#234B3A', marginBottom: '12px' }}>
            {locale === 'kn' ? 'ಹೊಸ ಅಡುಗೆ ಬ್ಯಾಚ್ ಯೋಜನೆ' : 'Plan New Cooking Batch'}
          </h3>
          <form onSubmit={handlePlanSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Select Dish:
              </label>
              <select
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #E9E6DD',
                  backgroundColor: '#FAF8F3',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                {dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {locale === 'kn' ? d.nameKn : d.nameEn} ({d.preparationPolicy})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Planned Yield (Target Grams / ml):
              </label>
              <input
                type="number"
                value={plannedYieldInput}
                onChange={(e) => setPlannedYieldInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #E9E6DD',
                  backgroundColor: '#FAF8F3',
                  fontSize: '15px',
                  fontWeight: 700
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#234B3A',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <PlusCircle size={16} />
              {locale === 'kn' ? 'ಬ್ಯಾಚ್ ಸೃಷ್ಟಿಸಿ ಮತ್ತು ಒಲೆ ಮೀಸಲಿಡಿ' : 'Schedule Batch & Lock Stove'}
            </button>
          </form>
        </div>
      </div>

      {/* Row 2: MarketMan-Style Actual vs Theoretical Variance Analytics */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E9E6DD',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <TrendingDown color="#D97706" size={20} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#234B3A' }}>
            {locale === 'kn'
              ? 'ಕಚ್ಚಾ ಸಾಮಗ್ರಿಗಳ ಬಳಕೆ ವ್ಯತ್ಯಾಸ ವರದಿ (MarketMan-Style Variance)'
              : 'Actual vs. Theoretical Inventory Variance (MarketMan-Style)'}
          </h3>
        </div>
        <p style={{ fontSize: '12px', color: '#6B726B', marginBottom: '14px' }}>
          Formula: Variance = Physical Consumption - Theoretical Recipe Usage (Flags kitchen spillage, over-portioning & waste).
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF8F3', borderBottom: '2px solid #E9E6DD' }}>
                <th style={{ padding: '10px' }}>Ingredient</th>
                <th style={{ padding: '10px' }}>Theoretical Usage</th>
                <th style={{ padding: '10px' }}>Actual Usage</th>
                <th style={{ padding: '10px' }}>Variance (Spillage)</th>
                <th style={{ padding: '10px' }}>Variance %</th>
                <th style={{ padding: '10px' }}>Cost Impact</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E9E6DD' }}>
                <td style={{ padding: '10px', fontWeight: 600 }}>Sona Masoori Rice (ಅಕ್ಕಿ)</td>
                <td style={{ padding: '10px' }}>1,950 g</td>
                <td style={{ padding: '10px' }}>2,050 g</td>
                <td style={{ padding: '10px', color: '#C0392B', fontWeight: 700 }}>+100 g</td>
                <td style={{ padding: '10px', color: '#C0392B' }}>5.1%</td>
                <td style={{ padding: '10px', fontWeight: 700 }}>₹6.00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E9E6DD' }}>
                <td style={{ padding: '10px', fontWeight: 600 }}>Toor Dal (ತೊಗರಿ ಬೇಳೆ)</td>
                <td style={{ padding: '10px' }}>1,850 g</td>
                <td style={{ padding: '10px' }}>1,870 g</td>
                <td style={{ padding: '10px', color: '#D97706', fontWeight: 700 }}>+20 g</td>
                <td style={{ padding: '10px', color: '#D97706' }}>1.1%</td>
                <td style={{ padding: '10px', fontWeight: 700 }}>₹3.20</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', fontWeight: 600 }}>Sunflower Cooking Oil (ಎಣ್ಣೆ)</td>
                <td style={{ padding: '10px' }}>510 ml</td>
                <td style={{ padding: '10px' }}>520 ml</td>
                <td style={{ padding: '10px', color: '#D97706', fontWeight: 700 }}>+10 ml</td>
                <td style={{ padding: '10px', color: '#D97706' }}>2.0%</td>
                <td style={{ padding: '10px', fontWeight: 700 }}>₹1.30</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: ONDC RET11 Sandbox Simulator */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E9E6DD'
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#234B3A', marginBottom: '8px' }}>
          ONDC Food & Beverage (RET11) Sandbox Simulator
        </h3>
        <p style={{ fontSize: '12px', color: '#6B726B', marginBottom: '14px' }}>
          Simulates Beckn Protocol v1.2.0 search and catalog generation for local buyer networks.
        </p>

        <button
          onClick={runOndcSim}
          style={{
            padding: '10px 18px',
            backgroundColor: '#D79B52',
            color: '#181A19',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send size={15} />
          Simulate ONDC `on_search` Catalog Ping
        </button>

        {ondcTestResult && (
          <pre
            style={{
              marginTop: '14px',
              padding: '12px',
              backgroundColor: '#181A19',
              color: '#52C41A',
              borderRadius: '8px',
              fontSize: '12px',
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
