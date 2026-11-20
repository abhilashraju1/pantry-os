import React from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { ChefHat, ShoppingCart, LayoutDashboard, PackageCheck, LogOut, User } from 'lucide-react';

export type AppView = 'pos' | 'kds' | 'qr' | 'admin' | 'packing';

interface NavbarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  locale: Locale;
  onLocaleChange: (loc: Locale) => void;
  currentUser?: any;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  locale,
  onLocaleChange,
  currentUser,
  onLogout
}) => {
  const dict = getDictionary(locale);
  const roles: string[] = currentUser?.roles || [];
  const isManager = roles.includes('BRANCH_MANAGER') || roles.includes('SUPER_ADMIN');
  const isCashier = roles.includes('CASHIER') || isManager;
  const isChef = roles.includes('CHEF') || isManager;
  const isPacker = roles.includes('PACKER') || isManager;

  return (
    <header
      style={{
        backgroundColor: '#234B3A',
        color: '#FFFFFF',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <img
          src="/demo-media/branding/logo.svg"
          alt="PantryOS Logo"
          style={{ width: '28px', height: '28px', borderRadius: '6px' }}
        />
        <div>
          <h1 style={{ fontSize: '15px', fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
            {dict.common.brandName}
          </h1>
          <p style={{ fontSize: '10px', color: '#D79B52', fontWeight: 500, margin: 0 }}>
            VV Puram
          </p>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '6px', flexShrink: 0, overflowX: 'auto' }}>
        {isCashier && (
          <button
            onClick={() => onViewChange('pos')}
            style={{
              backgroundColor: currentView === 'pos' ? '#D79B52' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <ShoppingCart size={14} />
            {locale === 'kn' ? 'ಕ್ಯಾಷಿಯರ್' : 'POS'}
          </button>
        )}

        {isChef && (
          <button
            onClick={() => onViewChange('kds')}
            style={{
              backgroundColor: currentView === 'kds' ? '#D79B52' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <ChefHat size={14} />
            {locale === 'kn' ? 'ಅಡುಗೆಮನೆ' : 'Kitchen'}
          </button>
        )}

        {isPacker && (
          <button
            onClick={() => onViewChange('packing')}
            style={{
              backgroundColor: currentView === 'packing' ? '#D79B52' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <PackageCheck size={14} />
            {locale === 'kn' ? 'ಪ್ಯಾಕಿಂಗ್' : 'Packing'}
          </button>
        )}

        {isManager && (
          <button
            onClick={() => onViewChange('admin')}
            style={{
              backgroundColor: currentView === 'admin' ? '#D79B52' : 'rgba(255,255,255,0.12)',
              color: '#FFFFFF',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <LayoutDashboard size={14} />
            {locale === 'kn' ? 'ಆಡಳಿತ' : 'Admin'}
          </button>
        )}
      </nav>

      {/* Controls: Language & User/Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onLocaleChange(locale === 'kn' ? 'en' : 'kn')}
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            color: '#FFFFFF',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {locale === 'kn' ? 'EN' : 'ಕನ್ನಡ'}
        </button>

        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#E8E5DD', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.fullName}
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Logout"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '4px 6px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
