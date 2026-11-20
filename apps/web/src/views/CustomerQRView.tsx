import React, { useState } from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { Dish, Order } from '@pantryos/contracts';
import { formatINR } from '@pantryos/business-rules';
import { ShoppingBag, ChevronRight, X, UtensilsCrossed, CheckCircle2, Clock, Receipt } from 'lucide-react';

interface CustomerQRViewProps {
  locale: Locale;
  dishes: Dish[];
  activeTableNumber: string;
  tableOrders: Order[];
  onPlaceOrder: (items: Array<{ dishVariantId: string; quantity: number }>) => void;
  onRequestBill: () => Promise<void> | void;
  onLocaleChange: (loc: Locale) => void;
  tableSessionStatus?: 'ACTIVE' | 'BILL_REQUESTED' | 'CLOSED';
}

export const CustomerQRView: React.FC<CustomerQRViewProps> = ({
  locale,
  dishes,
  activeTableNumber,
  tableOrders,
  onPlaceOrder,
  onRequestBill,
  onLocaleChange,
  tableSessionStatus = 'ACTIVE'
}) => {
  const dict = getDictionary(locale);
  const [cart, setCart] = useState<{ [variantId: string]: number }>({});
  const [selectedDishForModal, setSelectedDishForModal] = useState<Dish | null>(null);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'READY_BATCH' | 'FRESH_ORDER'>('ALL');
  const [billRequested, setBillRequested] = useState(tableSessionStatus === 'BILL_REQUESTED');

  const totalCartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const calculateCartTotalPaise = () => {
    let sum = 0;
    for (const [varId, qty] of Object.entries(cart)) {
      for (const d of dishes) {
        const v = d.variants.find((v) => v.id === varId);
        if (v) sum += v.pricePaise * qty;
      }
    }
    return sum;
  };

  const handleAddToCart = (variantId: string) => {
    if (tableSessionStatus === 'CLOSED') return;
    setCart((prev) => ({
      ...prev,
      [variantId]: (prev[variantId] || 0) + 1
    }));
    setSelectedDishForModal(null);
  };

  const handleCheckout = () => {
    const items = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([dishVariantId, quantity]) => ({ dishVariantId, quantity }));

    if (items.length === 0) return;
    onPlaceOrder(items);
    setCart({});
    setIsCartSheetOpen(false);
    setOrderSuccessMessage(
      locale === 'kn'
        ? `ಆರ್ಡರ್ ಯಶಸ್ವಿಯಾಗಿ ಕಳುಹಿಸಲಾಗಿದೆ! ಟೇಬಲ್ ${activeTableNumber} ಗೆ ಅಡುಗೆಮನೆಯಿಂದ ಬರಲಿದೆ.`
        : `Order placed successfully! Sent to kitchen for Table ${activeTableNumber}.`
    );
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  const handleBillRequest = async () => {
    setBillRequested(true);
    await onRequestBill();
  };

  const filteredDishes = dishes.filter((dish) => {
    if (selectedCategory === 'ALL') return true;
    return dish.preparationPolicy === selectedCategory;
  });

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        backgroundColor: '#FAF8F3',
        minHeight: '100vh',
        boxShadow: '0 0 20px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {/* Dedicated Guest Customer Header */}
      <header
        style={{
          backgroundColor: '#234B3A',
          color: '#FFFFFF',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/demo-media/branding/logo.svg"
            alt="PantryOS Logo"
            style={{ width: '28px', height: '28px', borderRadius: '6px' }}
          />
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
              {dict.common.brandName}
            </h1>
            <p style={{ fontSize: '10px', color: '#D79B52', margin: 0 }}>
              VV Puram Traditional Pantry
            </p>
          </div>
        </div>

        {/* Read-Only Table Badge & Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              backgroundColor: '#D79B52',
              color: '#FFFFFF',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700
            }}
          >
            Table {activeTableNumber}
          </span>
          <button
            onClick={() => onLocaleChange(locale === 'kn' ? 'en' : 'kn')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              color: '#FFFFFF',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {locale === 'kn' ? 'English' : 'ಕನ್ನಡ'}
          </button>
        </div>
      </header>

      {/* Session Closed Banner */}
      {tableSessionStatus === 'CLOSED' && (
        <div
          style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: 600,
            textAlign: 'center',
            borderBottom: '1px solid #FDE68A'
          }}
        >
          {locale === 'kn'
            ? 'ಈ ಟೇಬಲ್‌ನ ಸೇಶನ್ ಮುಕ್ತಾಯಗೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಹೊಸ ಸೇಶನ್‌ಗಾಗಿ QR ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'
            : 'This table session has ended. Please scan the table QR code to start a new dining session.'}
        </div>
      )}

      {/* Bill Requested Alert */}
      {billRequested && (
        <div
          style={{
            backgroundColor: '#DEF7EC',
            color: '#03543F',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid #BCF0DA'
          }}
        >
          <Receipt size={16} />
          <span>
            {locale === 'kn'
              ? 'ಬಿಲ್ ವಿನಂತಿಸಲಾಗಿದೆ! ಕ್ಯಾಷಿಯರ್ ನಿಮ್ಮ ಟೇಬಲ್‌ಗೆ ಬಿಲ್ ತರಲಿದ್ದಾರೆ.'
              : 'Bill requested! Cashier will present the bill at your table shortly.'}
          </span>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '16px', paddingBottom: totalCartCount > 0 ? '80px' : '24px' }}>
        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', en: 'All Specialties', kn: 'ಎಲ್ಲಾ ತಿನಿಸುಗಳು' },
            { id: 'READY_BATCH', en: 'Hot Ready Pots', kn: 'ಸಿದ್ಧ ಬಿಸಿ ಪಾತ್ರೆಗಳು' },
            { id: 'FRESH_ORDER', en: 'Crispy Fresh Tawa', kn: 'ಗರಿಗರಿ ತಾಜಾ ಹಂಚು' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              style={{
                backgroundColor: selectedCategory === cat.id ? '#234B3A' : '#FFFFFF',
                color: selectedCategory === cat.id ? '#FFFFFF' : '#444',
                border: '1px solid #D5D0C5',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {locale === 'kn' ? cat.kn : cat.en}
            </button>
          ))}
        </div>

        {/* Dish List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredDishes.map((dish) => {
            const variant = dish.variants[0];
            const isSoldOut = (dish as any).isSoldOut;

            return (
              <div
                key={dish.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '12px',
                  border: '1px solid #EAE6DC',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                <img
                  src={dish.imageUrl}
                  alt={dish.nameEn}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    backgroundColor: '#F3EFE6'
                  }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A', margin: 0 }}>
                      {locale === 'kn' ? dish.nameKn : dish.nameEn}
                    </h3>
                  </div>
                  <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 6px 0', lineHeight: 1.3 }}>
                    {locale === 'kn' ? dish.descriptionKn : dish.descriptionEn}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#2A2E2B' }}>
                      {variant ? formatINR(variant.pricePaise) : ''}
                    </span>

                    {isSoldOut ? (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#DC2626' }}>
                        {locale === 'kn' ? 'ಖಾಲಿಯಾಗಿದೆ' : 'Sold Out'}
                      </span>
                    ) : (
                      <button
                        disabled={tableSessionStatus === 'CLOSED'}
                        onClick={() => variant && handleAddToCart(variant.id)}
                        style={{
                          backgroundColor: tableSessionStatus === 'CLOSED' ? '#CCC' : '#234B3A',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: tableSessionStatus === 'CLOSED' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {locale === 'kn' ? '+ ಸೇರಿಸಿ' : '+ Add'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Existing Table Orders / Bill Section */}
        {tableOrders.length > 0 && (
          <div
            style={{
              marginTop: '24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '10px',
              padding: '14px',
              border: '1px solid #EAE6DC'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#234B3A', margin: 0 }}>
                {locale === 'kn' ? `ಟೇಬಲ್ ${activeTableNumber} ಆರ್ಡರ್‌ಗಳು` : `Table ${activeTableNumber} Orders`}
              </h3>
              <span style={{ fontSize: '11px', color: '#888' }}>
                {tableOrders.length} {tableOrders.length === 1 ? 'round' : 'rounds'}
              </span>
            </div>

            {tableOrders.map((ord, idx) => (
              <div
                key={ord.id}
                style={{
                  borderTop: idx > 0 ? '1px dashed #E5E5E5' : 'none',
                  paddingTop: idx > 0 ? '8px' : '0',
                  marginTop: idx > 0 ? '8px' : '0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
                  <span>Round {idx + 1} ({ord.orderNumber})</span>
                  <span>{formatINR(ord.totalPaise)}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  Status: {ord.status} • Payment: {ord.paymentStatus}
                </div>
              </div>
            ))}

            <div style={{ borderTop: '1px solid #DDD', marginTop: '12px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                {locale === 'kn' ? 'ಒಟ್ಟು ಮೊತ್ತ' : 'Total Bill'}:
              </span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A' }}>
                {formatINR(tableOrders.reduce((sum, o) => sum + o.totalPaise, 0))}
              </span>
            </div>

            {!billRequested && tableSessionStatus !== 'CLOSED' && (
              <button
                onClick={handleBillRequest}
                style={{
                  width: '100%',
                  marginTop: '12px',
                  padding: '10px',
                  backgroundColor: '#D79B52',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {locale === 'kn' ? 'ಬಿಲ್ ವಿನಂತಿಸಿ (Request Bill)' : 'Request Bill from Cashier'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Sticky Cart Bar */}
      {totalCartCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#234B3A',
            color: '#FFFFFF',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
            zIndex: 50,
            maxWidth: '480px',
            margin: '0 auto'
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#D79B52', fontWeight: 600 }}>
              {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700 }}>
              {formatINR(calculateCartTotalPaise())}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            style={{
              backgroundColor: '#D79B52',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{locale === 'kn' ? 'ಆರ್ಡರ್ ಮಾಡಿ' : 'Place Order'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
