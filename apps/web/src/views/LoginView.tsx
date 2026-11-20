import React, { useState } from 'react';
import { Locale, getDictionary } from '@pantryos/i18n';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  locale: Locale;
  onLocaleChange: (loc: Locale) => void;
  onLoginSuccess: (user: any) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ locale, onLocaleChange, onLoginSuccess }) => {
  const dict = getDictionary(locale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(locale === 'kn' ? 'ದಯವಿಟ್ಟು ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್‌ವರ್ಡ್ ನಮೂದಿಸಿ' : 'Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(
          data.error?.message ||
            (locale === 'kn' ? 'ತಪ್ಪಾದ ಇಮೇಲ್ ಅಥವಾ ಪಾಸ್‌ವರ್ಡ್' : 'Invalid email or password. Please try again.')
        );
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.data.user);
    } catch (err: any) {
      setError(locale === 'kn' ? 'ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಾಧ್ಯವಿಲ್ಲ' : 'Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8F3',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
      }}
    >
      {/* Language Switcher */}
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button
          onClick={() => onLocaleChange(locale === 'kn' ? 'en' : 'kn')}
          style={{
            backgroundColor: '#234B3A',
            color: '#FFFFFF',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {locale === 'kn' ? 'English' : 'ಕನ್ನಡ'}
        </button>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(35, 75, 58, 0.12)',
          padding: '32px 24px',
          border: '1px solid #E8E5DD'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img
            src="/demo-media/branding/logo.svg"
            alt="PantryOS Logo"
            style={{ width: '48px', height: '48px', marginBottom: '12px', borderRadius: '10px' }}
          />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#234B3A', margin: '0 0 6px 0' }}>
            {dict.common.brandName}
          </h1>
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
            {locale === 'kn' ? 'ಸಿಬ್ಬಂದಿ ಲಾಗಿನ್ • ವಿವಿ ಪುರಂ ಶಾಖೆ' : 'Staff Login • VV Puram Branch'}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#FDE8E8',
              color: '#9B1C1C',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label
              htmlFor="email-input"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '6px' }}
            >
              {locale === 'kn' ? 'ಇಮೇಲ್ ವಿಳಾಸ' : 'Email Address'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@pantryos.local"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid #CCC',
                  fontSize: '14px',
                  color: '#222'
                }}
              />
              <Mail size={16} color="#888" style={{ position: 'absolute', left: 12, top: 12 }} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password-input"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '6px' }}
            >
              {locale === 'kn' ? 'ಪಾಸ್‌ವರ್ಡ್' : 'Password'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 38px 10px 38px',
                  borderRadius: '6px',
                  border: '1px solid #CCC',
                  fontSize: '14px',
                  color: '#222'
                }}
              />
              <Lock size={16} color="#888" style={{ position: 'absolute', left: 12, top: 12 }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} color="#888" /> : <Eye size={16} color="#888" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isLoading ? '#8FAF9F' : '#234B3A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(35, 75, 58, 0.2)'
            }}
          >
            {isLoading
              ? locale === 'kn'
                ? 'ಪ್ರವೇಶಿಸಲಾಗುತ್ತಿದೆ...'
                : 'Signing In...'
              : locale === 'kn'
              ? 'ಲಾಗಿನ್ ಮಾಡಿ'
              : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
