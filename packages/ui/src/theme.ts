export const WarmPantryColors = {
  canvas: '#FAF8F3',         // Warm cream background
  surface: '#FFFFFF',        // Container cards
  surfaceMuted: '#F5F2EB',   // Subtle grey/cream
  border: '#E9E6DD',         // Hairline borders
  primary: '#234B3A',        // Karnataka Forest Green
  primaryHover: '#1B3B2E',
  accent: '#D79B52',         // Mysore Sandalwood / Turmeric Amber
  accentHover: '#C48A43',
  textPrimary: '#2A2E2B',    // Charcoal slate
  textMuted: '#6B726B',      // Secondary text
  urgencyRed: '#C0392B',     // Overdue timer / error
  warningAmber: '#D97706',   // Warning / prep
  successGreen: '#1B6E44',   // Food ready / paid
  kdsBackground: '#181A19',  // High-contrast dark KDS background
  kdsCard: '#222524'
} as const;

export const Typography = {
  fontSans: 'Inter, system-ui, -apple-system, sans-serif',
  fontKannada: '"Noto Sans Kannada", "Kannada Sangam MN", sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace'
} as const;
