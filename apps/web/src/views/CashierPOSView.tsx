import React, { useState } from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { Dish, OrderChannel } from '@pantryos/contracts';
import { formatINR, calculateOrderTotals } from '@pantryos/business-rules';
import { Plus, Minus, Trash2, Printer, CreditCard, Banknote, QrCode } from 'lucide-react';

interface CashierPOSViewProps {
  locale: Locale;
  dishes: Dish[];
  onOrderCreated: (orderData: any) => void;
}

interface CartItem {
  dish: Dish;
  variantId: string;
  variantName: string;
  pricePaise: number;
  quantity: number;
}

export const CashierPOSView: React.FC<CashierPOSViewProps> = ({ locale, dishes, onOrderCreated }) => {
  const dict = getDictionary(locale);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<OrderChannel>('WALK_IN_POS');
  const [selectedTable, setSelectedTable] = useState('T1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [discountPaise, setDiscountPaise] = useState(0);

  const subtotalPaise = cart.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
  const packagingFee = selectedChannel === 'PHONE_PICKUP' ? cart.length * 500 : 0;
  const totals = calculateOrderTotals({
    itemSubtotalPaise: subtotalPaise,
    packagingFeePaise: packagingFee,
    discountPaise
  });

  const addToCart = (dish: Dish) => {
    const variant = dish.variants[0];
    const existingIndex = cart.findIndex((item) => item.dish.id === dish.id);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          dish,
          variantId: variant.id,
          variantName: locale === 'kn' ? variant.nameKn : variant.nameEn,
          pricePaise: variant.pricePaise,
          quantity: 1
        }
      ]);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      updated.splice(index, 1);
    }
    setCart(updated);
  };

  const handleCheckout = (paymentMethod: string) => {
    const payload = {
      channel: selectedChannel,
      customerName: customerName || (selectedChannel === 'QR_TABLE' ? `Table ${selectedTable}` : 'Counter Customer'),
      customerPhone,
      tableNumber: selectedChannel === 'QR_TABLE' ? selectedTable : null,
      items: cart.map((c) => ({
        dishVariantId: c.variantId,
        quantity: c.quantity
      })),
      paymentMethod,
      totalPaise: totals.totalPaise
    };

    onOrderCreated(payload);
    setCart([]);
    setIsPaymentModalOpen(false);
    alert(`Order placed & paid successfully via ${paymentMethod}! Total: ${formatINR(totals.totalPaise)}`);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
      {/* Left Menu Area (65%) */}
      <div style={{ flex: '1 1 65%', padding: '20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#234B3A' }}>
            {locale === 'kn' ? 'ಮೆನು ಮತ್ತು ಪದಾರ್ಥಗಳು' : 'Pantry Menu Items'}
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setSelectedChannel('WALK_IN_POS')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedChannel === 'WALK_IN_POS' ? '#234B3A' : '#E9E6DD',
                color: selectedChannel === 'WALK_IN_POS' ? '#FFFFFF' : '#2A2E2B',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {locale === 'kn' ? 'ಕೌಂಟರ್ ವಾಕ್-ಇನ್' : 'Counter Walk-In'}
            </button>
            <button
              onClick={() => setSelectedChannel('QR_TABLE')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedChannel === 'QR_TABLE' ? '#234B3A' : '#E9E6DD',
                color: selectedChannel === 'QR_TABLE' ? '#FFFFFF' : '#2A2E2B',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {locale === 'kn' ? 'ಟೇಬಲ್ ಡೈನ್-ಇನ್' : 'Table Dine-In'}
            </button>
            <button
              onClick={() => setSelectedChannel('PHONE_PICKUP')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: selectedChannel === 'PHONE_PICKUP' ? '#234B3A' : '#E9E6DD',
                color: selectedChannel === 'PHONE_PICKUP' ? '#FFFFFF' : '#2A2E2B',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {locale === 'kn' ? 'ಫೋನ್ ಪಿಕಪ್' : 'Phone Pickup'}
            </button>
          </div>
        </div>

        {/* Dish Tile Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {dishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => addToCart(dish)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E9E6DD',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease'
              }}
            >
              <img
                src={dish.imageUrl}
                alt={dish.nameEn}
                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
              />
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#1B6E44',
                      display: 'inline-block'
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#1B6E44', fontWeight: 700 }}>
                    100% PURE VEG
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2A2E2B', marginBottom: '2px' }}>
                  {locale === 'kn' ? dish.nameKn : dish.nameEn}
                </h3>
                <p style={{ fontSize: '12px', color: '#6B726B', marginBottom: '10px' }}>
                  {locale === 'kn' ? dish.descriptionKn : dish.descriptionEn}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#234B3A' }}>
                    {formatINR(dish.variants[0].pricePaise)}
                  </span>
                  <span
                    style={{
                      backgroundColor: '#FAF8F3',
                      border: '1px solid #D79B52',
                      color: '#D79B52',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}
                  >
                    + {locale === 'kn' ? 'ಸೇರಿಸಿ' : 'Add'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Cart & Checkout Pane (35%) */}
      <div
        style={{
          flex: '1 1 35%',
          backgroundColor: '#FFFFFF',
          borderLeft: '1px solid #E9E6DD',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E9E6DD' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#234B3A' }}>
            {dict.orders.cart}
          </h3>
          <p style={{ fontSize: '12px', color: '#6B726B' }}>
            Channel: <strong>{selectedChannel}</strong>
          </p>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '60px', color: '#8C928C' }}>
              <p style={{ fontSize: '15px' }}>{locale === 'kn' ? 'ಆರ್ಡರ್ ಬುಟ್ಟಿ ಖಾಲಿಯಾಗಿದೆ' : 'Cart is empty'}</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                {locale === 'kn' ? 'ಪದಾರ್ಥ ಸೇರಿಸಲು ಎಡಭಾಗದ ಮೆನು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Tap menu items to add to order'}
              </p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px dashed #E9E6DD'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>
                    {locale === 'kn' ? item.dish.nameKn : item.dish.nameEn}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#6B726B' }}>
                    {item.variantName} • {formatINR(item.pricePaise)}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => updateQuantity(index, -1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      border: '1px solid #E9E6DD',
                      backgroundColor: '#FAF8F3',
                      cursor: 'pointer'
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(index, 1)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '4px',
                      border: '1px solid #E9E6DD',
                      backgroundColor: '#FAF8F3',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} />
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: '8px', minWidth: '60px', textAlign: 'right' }}>
                    {formatINR(item.pricePaise * item.quantity)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Checkout Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '16px 20px', backgroundColor: '#FAF8F3', borderTop: '1px solid #E9E6DD' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>Subtotal:</span>
              <span>{formatINR(totals.subtotalPaise)}</span>
            </div>
            {totals.packagingFeePaise > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>Packaging:</span>
                <span>{formatINR(totals.packagingFeePaise)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span>GST (5%):</span>
              <span>{formatINR(totals.taxPaise)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '18px',
                fontWeight: 700,
                color: '#234B3A',
                borderTop: '1px solid #E9E6DD',
                paddingTop: '8px',
                marginBottom: '14px'
              }}
            >
              <span>{dict.payments.total}:</span>
              <span>{formatINR(totals.totalPaise)}</span>
            </div>

            <button
              onClick={() => setIsPaymentModalOpen(true)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#234B3A',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CreditCard size={18} />
              {locale === 'kn' ? 'ಪಾವತಿ & ಮುಕ್ತಾಯ' : 'Collect Payment & Place Order'}
            </button>
          </div>
        )}
      </div>

      {/* Payment Selection Modal */}
      {isPaymentModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px', color: '#234B3A' }}>
              {dict.payments.confirmPayment}
            </h3>
            <p style={{ fontSize: '13px', color: '#6B726B', marginBottom: '16px' }}>
              Amount: <strong style={{ color: '#2A2E2B' }}>{formatINR(totals.totalPaise)}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => handleCheckout('CASH')}
                style={{
                  padding: '12px',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #D79B52',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <Banknote color="#234B3A" />
                {dict.payments.cash} (Cash Drawer)
              </button>

              <button
                onClick={() => handleCheckout('UPI_QR')}
                style={{
                  padding: '12px',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #D79B52',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <QrCode color="#234B3A" />
                {dict.payments.upi} (Scan & Pay)
              </button>

              <button
                onClick={() => handleCheckout('CARD')}
                style={{
                  padding: '12px',
                  backgroundColor: '#FAF8F3',
                  border: '1px solid #D79B52',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <CreditCard color="#234B3A" />
                {dict.payments.card} (POS Terminal)
              </button>
            </div>

            <button
              onClick={() => setIsPaymentModalOpen(false)}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '16px',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#6B726B',
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
