// HashTap tasarım token'ları (programmatik kullanım için).
// Tailwind preset ve runtime consumer'ların ikisi de bu dosyaya bakar.
// CSS custom property isimleri `src/styles/globals.css`'te mirrorlanır.

export const colors = {
  // Arka plan katmanları
  bg: {
    0: '#0A0E1A',
    1: '#131829',
    2: '#1D2338',
    glass: 'rgba(255, 255, 255, 0.06)',
    glassStrong: 'rgba(255, 255, 255, 0.10)',
  },
  // Light mode (opsiyonel)
  bgLight: {
    0: '#FAFBFC',
    1: '#FFFFFF',
    2: '#F5F6FA',
    glass: 'rgba(0, 0, 0, 0.03)',
    glassStrong: 'rgba(0, 0, 0, 0.06)',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.14)',
    strong: 'rgba(255, 255, 255, 0.22)',
  },
  text: {
    primary: '#F5F6FA',
    secondary: '#A6ACC0',
    muted: '#6B7089',
    inverse: '#0A0E1A',
  },
  brand: {
    400: '#FF8A5C',
    500: '#FF6B3D',
    600: '#E84F1E',
    glow: 'rgba(255, 107, 61, 0.35)',
  },
  accent: {
    400: '#7BF0DD',
    500: '#5EEAD4',
  },
  state: {
    success: '#4ADE80',
    successBg: 'rgba(74, 222, 128, 0.12)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.12)',
    danger: '#F87171',
    dangerBg: 'rgba(248, 113, 113, 0.12)',
    info: '#60A5FA',
    infoBg: 'rgba(96, 165, 250, 0.12)',
  },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const fontSize = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '22px',
  '2xl': '28px',
  '3xl': '36px',
  '4xl': '48px',
  '5xl': '64px',
} as const;

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '14px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const shadow = {
  glass: '0 8px 32px rgba(0, 0, 0, 0.24)',
  glow: '0 8px 24px rgba(255, 107, 61, 0.35)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.20)',
  md: '0 4px 16px rgba(0, 0, 0, 0.28)',
} as const;

export const ease = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy: 'cubic-bezier(0.16, 1, 0.3, 1)',
  bouncy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const duration = {
  instant: 100,
  fast: 150,
  normal: 220,
  slow: 320,
  leisurely: 500,
} as const;

export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const touchTarget = {
  minimum: 56,
  large: 72,
} as const;
