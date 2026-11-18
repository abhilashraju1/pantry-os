import React, { useState } from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { Order, ProductionBatch, Equipment } from '@pantryos/contracts';
import { Clock, CheckCircle2, Flame, Volume2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ChefKDSViewProps {
  locale: Locale;
  orders: Order[];
  batches: ProductionBatch[];
  equipment: Equipment[];
  onQualitySignoff: (batchId: string, yieldVal: number, tempC: number) => void;
  onAcquireLock: (eqId: string, taskId: string, mins: number) => void;
  onReleaseLock: (eqId: string) => void;
}

export const ChefKDSView: React.FC<ChefKDSViewProps> = ({
  locale,
  orders,
  batches,
  equipment,
  onQualitySignoff,
  onAcquireLock,
  onReleaseLock
}) => {
  const dict = getDictionary(locale);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [selectedBatchForSignoff, setSelectedBatchForSignoff] = useState<ProductionBatch | null>(null);
  const [actualYieldInput, setActualYieldInput] = useState('2500');
  const [coreTempInput, setCoreTempInput] = useState('78');

  // Aggregated All-Day Item Counts across active orders (Toast KDS pattern)
  const itemCounts: Record<string, { nameEn: string; nameKn: string; count: number }> = {};
  for (const o of orders) {
    if (o.status !== 'COMPLETED' && o.status !== 'CANCELLED') {
      for (const item of o.items) {
        if (!itemCounts[item.dishNameEn]) {
          itemCounts[item.dishNameEn] = {
            nameEn: item.dishNameEn,
            nameKn: item.dishNameKn,
            count: 0
          };
        }
        itemCounts[item.dishNameEn].count += item.quantity;
      }
    }
  }

  const speakInstruction = (text: string) => {
    if (!speechEnabled || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale === 'kn' ? 'kn-IN' : 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const handleSignoffSubmit = () => {
    if (!selectedBatchForSignoff) return;
    const yieldNum = parseFloat(actualYieldInput);
    const tempNum = parseFloat(coreTempInput);

    if (tempNum < 60) {
      alert('FSSAI Food Safety Violation: Food must be >= 60°C to be released for warm holding service.');
      return;
    }

    onQualitySignoff(selectedBatchForSignoff.id, yieldNum, tempNum);
    setSelectedBatchForSignoff(null);
    speakInstruction(locale === 'kn' ? 'ಆಹಾರ ಗುಣಮಟ್ಟ ಅನುಮೋದಿಸಲಾಗಿದೆ' : 'Batch approved for service');
  };

  return (
    <div
      style={{
        backgroundColor: '#181A19',
        color: '#FAF8F3',
        minHeight: 'calc(100vh - 65px)',
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      {/* Top Controls & Voice Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame size={24} color="#D79B52" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#FAF8F3' }}>
            {dict.kitchen.kdsTitle}
          </h2>
          <span
            style={{
              backgroundColor: '#234B3A',
              color: '#A0D2BB',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Live Kitchen Display
          </span>
        </div>

        <button
          onClick={() => {
            setSpeechEnabled(!speechEnabled);
            speakInstruction(speechEnabled ? 'Voice muted' : 'Voice enabled');
          }}
          style={{
            backgroundColor: speechEnabled ? '#234B3A' : '#333734',
            color: speechEnabled ? '#FAF8F3' : '#8C928C',
            border: '1px solid #D79B52',
            padding: '8px 16px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Volume2 size={16} />
          {speechEnabled
            ? locale === 'kn'
              ? 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ ಆನ್'
              : 'Voice Guidance ON'
            : locale === 'kn'
            ? 'ಧ್ವನಿ ಮಾರ್ಗದರ್ಶನ ಆಫ್'
            : 'Voice Guidance OFF'}
        </button>
      </div>

      {/* All-Day Display Summary Ribbon (Toast KDS Benchmark Pattern) */}
      <div
        style={{
          backgroundColor: '#222524',
          borderRadius: '10px',
          padding: '12px 18px',
          border: '1px solid #333734',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#D79B52', textTransform: 'uppercase' }}>
          {locale === 'kn' ? 'ಒಟ್ಟು ಬೇಡಿಕೆ (All-Day Summary):' : 'All-Day Total Demand:'}
        </span>
        {Object.values(itemCounts).map((item, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#181A19',
              border: '1px solid #3E4340',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'flex',
              gap: '6px'
            }}
          >
            <span style={{ color: '#D79B52' }}>{item.count}x</span>
            <span>{locale === 'kn' ? item.nameKn : item.nameEn}</span>
          </div>
        ))}
      </div>

      {/* Equipment Station Locks Bar */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#A0D2BB', marginBottom: '10px' }}>
          {locale === 'kn' ? 'ಒಲೆ ಮತ್ತು ಉಪಕರಣಗಳ ಮೀಸಲಾತಿ ಸ್ಥಿತಿ' : 'Stove & Equipment Exclusive Lock Status'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {equipment.map((eq) => (
            <div
              key={eq.id}
              style={{
                backgroundColor: '#222524',
                border: eq.status === 'OCCUPIED' ? '1px solid #D97706' : '1px solid #333734',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700 }}>
                  {locale === 'kn' ? eq.nameKn : eq.nameEn}
                </h4>
                <p style={{ fontSize: '11px', color: '#8C928C' }}>
                  {eq.stationNameEn}
                </p>
              </div>
              <span
                style={{
                  backgroundColor: eq.status === 'OCCUPIED' ? '#D97706' : '#1B6E44',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {eq.status === 'OCCUPIED' ? 'LOCKED' : 'AVAILABLE'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Kitchen Tickets Grid */}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FAF8F3', marginBottom: '14px' }}>
        {locale === 'kn' ? 'ಪ್ರಸ್ತುತ ಅಡುಗೆ ಕಾರ್ಯಗಳು ಮತ್ತು ಆರ್ಡರ್‌ಗಳು' : 'Active Kitchen Cooking Tickets'}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '16px'
        }}
      >
        {orders
          .filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
          .map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#222524',
                borderRadius: '12px',
                border: '1px solid #3E4340',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#D79B52' }}>
                    {order.orderNumber}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#181A19',
                      border: '1px solid #D79B52',
                      color: '#D79B52',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {order.channel} {order.tableNumber ? `• Table ${order.tableNumber}` : ''}
                  </span>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '14px',
                        padding: '4px 0',
                        borderBottom: '1px solid #2B302D'
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {item.quantity}x {locale === 'kn' ? item.dishNameKn : item.dishNameEn}
                      </span>
                      <span style={{ color: '#8C928C', fontSize: '12px' }}>
                        {item.variantNameEn}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => {
                    const batch = batches.find((b) => b.status === 'COOKING' || b.status === 'READY');
                    if (batch) setSelectedBatchForSignoff(batch);
                    else alert('No pending quality check batch at this moment.');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#D79B52',
                    color: '#181A19',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ShieldCheck size={16} />
                  {dict.kitchen.qualityCheckRequired}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Food Safety & Actual Yield Quality Signoff Modal */}
      {selectedBatchForSignoff && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              backgroundColor: '#222524',
              border: '1px solid #D79B52',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '90%',
              color: '#FAF8F3'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#D79B52', marginBottom: '8px' }}>
              {dict.kitchen.qualityCheckRequired}
            </h3>
            <p style={{ fontSize: '12px', color: '#A0D2BB', marginBottom: '16px' }}>
              FSSAI Standard: Core temperature must be verified ≥ 60°C. Actual yield determines usable portions.
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                {dict.kitchen.actualYield} ({selectedBatchForSignoff.yieldUnit}):
              </label>
              <input
                type="number"
                value={actualYieldInput}
                onChange={(e) => setActualYieldInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #3E4340',
                  backgroundColor: '#181A19',
                  color: '#FAF8F3',
                  fontSize: '16px',
                  fontWeight: 700
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 600 }}>
                {dict.kitchen.coreTemp}:
              </label>
              <input
                type="number"
                value={coreTempInput}
                onChange={(e) => setCoreTempInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #3E4340',
                  backgroundColor: '#181A19',
                  color: '#FAF8F3',
                  fontSize: '16px',
                  fontWeight: 700
                }}
              />
            </div>

            <button
              onClick={handleSignoffSubmit}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1B6E44',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              {dict.kitchen.approveRelease}
            </button>

            <button
              onClick={() => setSelectedBatchForSignoff(null)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#8C928C',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {dict.common.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
