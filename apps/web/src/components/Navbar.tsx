import React from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { ChefHat, ShoppingCart, Smartphone, LayoutDashboard, PackageCheck, Globe, Wifi } from 'lucide-react';

export type AppView = 'pos' | 'kds' | 'qr' | 'admin' | 'packing';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  locale: Locale;
  onLocaleChange: (loc: Locale) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  locale,
  onLocaleChange
}) => {
  const dict = getDictionary(locale);

  return (
    <header
      style={{
        backgroundColor: '#234B3A',
        color: '#FFFFFF',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src="/demo-media/branding/logo.svg"
          alt="PantryOS Logo"
          style={{ width: '36px', height: '36px', borderRadius: '8px' }}
        />
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {dict.common.brandName}
          </h1>
          <p style={{ fontSize: '11px', color: '#D79B52', fontWeight: 500 }}>
            VV Puram Branch • {dict.common.tagline}
          </p>
        </div>
      </div>

      {/* Role Navigation Buttons */}
      <nav style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => onViewChange('pos')}
          style={{
            backgroundColor: currentView === 'pos' ? '#D79B52' : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ShoppingCart size={16} />
          {locale === 'kn' ? 'ಕ್ಯಾಷಿಯರ್ (POS)' : 'Cashier POS'}
        </button>

        <button
          onClick={() => onViewChange('kds')}
          style={{
            backgroundColor: currentView === 'kds' ? '#D79B52' : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <ChefHat size={16} />
          {locale === 'kn' ? 'ಅಡುಗೆಮನೆ (KDS)' : 'Chef KDS'}
        </button>

        <button
          onClick={() => onViewChange('qr')}
          style={{
            backgroundColor: currentView === 'qr' ? '#D79B52' : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Smartphone size={16} />
          {locale === 'kn' ? 'ಟೇಬಲ್ ಕ್ಯೂಆರ್ (Mobile)' : 'Table QR (Mobile)'}
        </button>

        <button
          onClick={() => onViewChange('packing')}
          style={{
            backgroundColor: currentView === 'packing' ? '#D79B52' : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <PackageCheck size={16} />
          {locale === 'kn' ? 'ಪ್ಯಾಕಿಂಗ್ ಪಾಸ್' : 'Packing Pass'}
        </button>

        <button
          onClick={() => onViewChange('admin')}
          style={{
            backgroundColor: currentView === 'admin' ? '#D79B52' : 'rgba(255,255,255,0.12)',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LayoutDashboard size={16} />
          {locale === 'kn' ? 'ನಿರ್ವಹಣೆ (Admin)' : 'Admin & Stock'}
        </button>
      </nav>

      {/* Language Switcher & Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#A0D2BB' }}>
          <Wifi size={14} color="#52C41A" />
          <span>Live Sync</span>
        </div>

        <button
          onClick={() => onLocaleChange(locale === 'kn' ? 'en' : 'kn')}
          style={{
            backgroundColor: 'transparent',
            color: '#FAF8F3',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Globe size={14} />
          {locale === 'kn' ? 'English' : 'ಕನ್ನಡ'}
        </button>
      </div>
    </header>
  );
};
