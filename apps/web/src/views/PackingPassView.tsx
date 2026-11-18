import React from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { Order } from '@pantryos/contracts';
import { Package, CheckCheck, MapPin, User, Phone } from 'lucide-react';

interface PackingPassViewProps {
  locale: Locale;
  orders: Order[];
  onMarkPacked: (orderId: string) => void;
  onHandoff: (orderId: string) => void;
}

export const PackingPassView: React.FC<PackingPassViewProps> = ({
  locale,
  orders,
  onMarkPacked,
  onHandoff
}) => {
  const dict = getDictionary(locale);

  const activeOrders = orders.filter(
    (o) => o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY_FOR_PACKING' || o.status === 'PACKED'
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Package size={24} color="#234B3A" />
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#234B3A' }}>
          {locale === 'kn' ? 'ಪ್ಯಾಕಿಂಗ್ ಮತ್ತು ಹಸ್ತಾಂತರ ಕೌಂಟರ್' : 'Packing Pass & Customer Handoff'}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {activeOrders.length === 0 ? (
          <p style={{ color: '#6B726B' }}>No orders currently in packing queue.</p>
        ) : (
          activeOrders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E9E6DD',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#234B3A' }}>
                    {order.orderNumber}
                  </span>
                  <span
                    style={{
                      backgroundColor: order.status === 'PACKED' ? '#EBF4F0' : '#FAF8F3',
                      color: order.status === 'PACKED' ? '#1B6E44' : '#D79B52',
                      border: `1px solid ${order.status === 'PACKED' ? '#A0D2BB' : '#D79B52'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: '#6B726B', marginBottom: '12px' }}>
                  {order.channel} {order.tableNumber ? `• Table ${order.tableNumber}` : ''}
                </p>

                <div style={{ marginBottom: '14px', borderTop: '1px solid #FAF8F3', paddingTop: '8px' }}>
                  <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#2A2E2B', marginBottom: '6px' }}>
                    Items to Pack:
                  </h5>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '13px', color: '#2A2E2B', padding: '2px 0' }}>
                      • {item.quantity}x {locale === 'kn' ? item.dishNameKn : item.dishNameEn} ({item.variantNameEn})
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {order.status !== 'PACKED' ? (
                  <button
                    onClick={() => onMarkPacked(order.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#234B3A',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Mark as Packed
                  </button>
                ) : (
                  <button
                    onClick={() => onHandoff(order.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#1B6E44',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <CheckCheck size={16} />
                    Complete Handoff
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
