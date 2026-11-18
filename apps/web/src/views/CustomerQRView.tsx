import React, { useState } from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { Dish, Order } from '@pantryos/contracts';
import { formatINR } from '@pantryos/business-rules';
import { ShoppingBag, ChevronRight, X, UtensilsCrossed, CheckCircle2 } from 'lucide-react';

interface CustomerQRViewProps {
  locale: Locale;
  dishes: Dish[];
  activeTableNumber: string;
  onTableChange: (tableNum: string) => void;
  tableOrders: Order[];
  onPlaceOrder: (items: Array<{ dishVariantId: string; quantity: number }>) => void;
  onRequestBill: () => void;
}

export const CustomerQRView: React.FC<CustomerQRViewProps> = ({
  locale,
  dishes,
  activeTableNumber,
  onTableChange,
  tableOrders,
  onPlaceOrder,
  onRequestBill
}) => {
  const dict = getDictionary(locale);
  const [cart, setCart] = useState<{ [variantId: string]: number }>({});
  const [selectedDishForModal, setSelectedDishForModal] = useState<Dish | null>(null);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'READY_BATCH' | 'FRESH_ORDER'>('ALL');

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

  const filteredDishes = dishes.filter((dish) => {
    if (selectedCategory === 'ALL') return true;
    return dish.preparationPolicy === selectedCategory;
  });

  return (
    <div
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 65px)',
        backgroundColor: '#FAF8F3',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        boxShadow: '0 0 20px rgba(0,0,0,0.06)'
      }}
    >
      {/* Mobile Top Bar */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E9E6DD',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                backgroundColor: '#234B3A',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {dict.orders.tableNumber} {activeTableNumber}
            </span>
            <select
              value={activeTableNumber}
              onChange={(e) => onTableChange(e.target.value)}
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #D79B52',
                backgroundColor: '#FAF8F3',
                color: '#234B3A',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
              <option value="T4">T4</option>
              <option value="T5">T5</option>
              <option value="T6">T6</option>
            </select>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#2A2E2B', marginTop: '4px' }}>
            {dict.common.brandName}
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '11px', color: '#1B6E44', fontWeight: 700, display: 'block' }}>
            ● PURE VEGETARIAN
          </span>
          <span style={{ fontSize: '11px', color: '#6B726B' }}>
            VV Puram, Bengaluru
          </span>
        </div>
      </div>

      {/* Success Notification Alert */}
      {orderSuccessMessage && (
        <div
          style={{
            margin: '12px 16px 0',
            padding: '12px 16px',
            backgroundColor: '#EBF4F0',
            border: '1px solid #1B6E44',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#1B6E44',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={18} />
          <span>{orderSuccessMessage}</span>
        </div>
      )}

      {/* Running Table Bill Banner (Petpooja QR Pattern) */}
      {tableOrders.length > 0 && (
        <div
          style={{
            margin: '12px 16px 0',
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #A0D2BB',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#234B3A' }}>
              {locale === 'kn' ? 'ಚಾಲ್ತಿ ಟೇಬಲ್ ಆರ್ಡರ್' : 'Active Table Session'}
            </span>
            <p style={{ fontSize: '12px', color: '#2A2E2B', marginTop: '2px' }}>
              {tableOrders.length} {locale === 'kn' ? 'ಆರ್ಡರ್‌ಗಳು ಚಾಲನೆಯಲ್ಲಿವೆ' : 'orders placed'}
            </p>
          </div>
          <button
            onClick={onRequestBill}
            style={{
              padding: '8px 14px',
              backgroundColor: '#234B3A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {dict.orders.requestBill}
          </button>
        </div>
      )}

      {/* Category Pills Filter */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px 4px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        <button
          onClick={() => setSelectedCategory('ALL')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: selectedCategory === 'ALL' ? '#234B3A' : '#E9E6DD',
            color: selectedCategory === 'ALL' ? '#FFFFFF' : '#2A2E2B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {locale === 'kn' ? 'ಎಲ್ಲವೂ' : 'All Items'}
        </button>
        <button
          onClick={() => setSelectedCategory('READY_BATCH')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: selectedCategory === 'READY_BATCH' ? '#234B3A' : '#E9E6DD',
            color: selectedCategory === 'READY_BATCH' ? '#FFFFFF' : '#2A2E2B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {locale === 'kn' ? 'ಇಂದಿನ ವಿಶೇಷ (Ready)' : 'Fresh Today (Ready)'}
        </button>
        <button
          onClick={() => setSelectedCategory('FRESH_ORDER')}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: selectedCategory === 'FRESH_ORDER' ? '#234B3A' : '#E9E6DD',
            color: selectedCategory === 'FRESH_ORDER' ? '#FFFFFF' : '#2A2E2B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {locale === 'kn' ? 'ಬಿಸಿ ರೊಟ್ಟಿಗಳು (Fresh)' : 'Hot Rottis (Fresh)'}
        </button>
      </div>

      {/* Food Items List */}
      <div style={{ padding: '16px', flex: 1, paddingBottom: totalCartCount > 0 ? '90px' : '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredDishes.map((dish) => {
            const variant = dish.variants[0];
            const currentQty = cart[variant.id] || 0;

            return (
              <div
                key={dish.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '14px',
                  border: '1px solid #E9E6DD',
                  overflow: 'hidden',
                  display: 'flex',
                  gap: '12px',
                  padding: '12px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <img
                  src={dish.imageUrl}
                  alt={dish.nameEn}
                  style={{
                    width: '95px',
                    height: '95px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#2A2E2B' }}>
                      {locale === 'kn' ? dish.nameKn : dish.nameEn}
                    </h4>
                    <p style={{ fontSize: '12px', color: '#6B726B', marginTop: '2px', lineHeight: 1.3 }}>
                      {locale === 'kn' ? dish.descriptionKn : dish.descriptionEn}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A' }}>
                      {formatINR(variant.pricePaise)}
                    </span>

                    {currentQty > 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() =>
                            setCart((prev) => ({ ...prev, [variant.id]: Math.max(0, (prev[variant.id] || 0) - 1) }))
                          }
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            border: '1px solid #D79B52',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{currentQty}</span>
                        <button
                          onClick={() => handleAddToCart(variant.id)}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '4px',
                            border: '1px solid #D79B52',
                            backgroundColor: '#D79B52',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedDishForModal(dish)}
                        style={{
                          backgroundColor: '#FAF8F3',
                          border: '1px solid #D79B52',
                          color: '#D79B52',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + {locale === 'kn' ? 'ಆಯ್ಕೆ ಮಾಡಿ' : 'Add'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Cart Bar (Square & Petpooja Pattern) */}
      {totalCartCount > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E9E6DD',
            padding: '12px 16px',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
            zIndex: 40
          }}
        >
          <div
            onClick={() => setIsCartSheetOpen(true)}
            style={{
              backgroundColor: '#234B3A',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShoppingBag size={20} color="#D79B52" />
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>
                  {totalCartCount} {dict.orders.itemsCount}
                </span>
                <span style={{ margin: '0 6px', opacity: 0.6 }}>•</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#D79B52' }}>
                  {formatINR(calculateCartTotalPaise())}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700 }}>
              <span>{locale === 'kn' ? 'ಆರ್ಡರ್ ನೋಡಿ' : 'View Order'}</span>
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      )}

      {/* Item Customizer Bottom Sheet */}
      {selectedDishForModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2A2E2B' }}>
                  {locale === 'kn' ? selectedDishForModal.nameKn : selectedDishForModal.nameEn}
                </h3>
                <p style={{ fontSize: '13px', color: '#6B726B', marginTop: '2px' }}>
                  {locale === 'kn' ? selectedDishForModal.descriptionKn : selectedDishForModal.descriptionEn}
                </p>
              </div>
              <button
                onClick={() => setSelectedDishForModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} color="#6B726B" />
              </button>
            </div>

            <div style={{ margin: '20px 0' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#234B3A', marginBottom: '8px' }}>
                {locale === 'kn' ? 'ಪ್ರಮಾಣ / ಪೋರ್ಷನ್ ಆಯ್ಕೆ ಮಾಡಿ:' : 'Choose Portion Size:'}
              </label>
              {selectedDishForModal.variants.map((v) => (
                <div
                  key={v.id}
                  onClick={() => handleAddToCart(v.id)}
                  style={{
                    border: '1px solid #D79B52',
                    backgroundColor: '#FAF8F3',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700 }}>
                      {locale === 'kn' ? v.nameKn : v.nameEn}
                    </h5>
                    <span style={{ fontSize: '12px', color: '#6B726B' }}>
                      {v.portionQuantity} {v.portionUnit}
                    </span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#234B3A' }}>
                    {formatINR(v.pricePaise)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cart Summary Modal Sheet */}
      {isCartSheetOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 100
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#234B3A' }}>
                {locale === 'kn' ? 'ನಿಮ್ಮ ಆರ್ಡರ್ ದೃಢೀಕರಣ' : 'Confirm Your Table Order'}
              </h3>
              <button
                onClick={() => setIsCartSheetOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="#6B726B" />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6B726B', marginBottom: '14px' }}>
              Table: <strong>{activeTableNumber}</strong> • Pay after dining at the counter
            </p>

            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {Object.entries(cart)
                .filter(([_, qty]) => qty > 0)
                .map(([varId, qty]) => {
                  let vName = '';
                  let vPrice = 0;
                  for (const d of dishes) {
                    const v = d.variants.find((v) => v.id === varId);
                    if (v) {
                      vName = locale === 'kn' ? `${d.nameKn} (${v.nameKn})` : `${d.nameEn} (${v.nameEn})`;
                      vPrice = v.pricePaise;
                    }
                  }
                  return (
                    <div
                      key={varId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #FAF8F3'
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>
                        {qty}x {vName}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700 }}>
                        {formatINR(vPrice * qty)}
                      </span>
                    </div>
                  );
                })}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '16px',
                fontWeight: 700,
                color: '#234B3A',
                borderTop: '1px solid #E9E6DD',
                paddingTop: '10px',
                marginBottom: '20px'
              }}
            >
              <span>{dict.payments.total}:</span>
              <span>{formatINR(calculateCartTotalPaise())}</span>
            </div>

            <button
              onClick={handleCheckout}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#234B3A',
                color: '#FFFFFF',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              {dict.orders.placeOrder}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
