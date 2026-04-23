// Paylaşılan Tailwind preset — consumer app'ler bunu extend eder.
// Token renkleri src/tokens.ts ile senkronize.

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          0: '#0A0E1A',
          1: '#131829',
          2: '#1D2338',
        },
        brand: {
          400: '#FF8A5C',
          500: '#FF6B3D',
          600: '#E84F1E',
        },
        accent: {
          400: '#7BF0DD',
          500: '#5EEAD4',
        },
        state: {
          success: '#4ADE80',
          warning: '#FBBF24',
          danger: '#F87171',
          info: '#60A5FA',
        },
        textc: {
          primary: '#F5F6FA',
          secondary: '#A6ACC0',
          muted: '#6B7089',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '36px',
        '4xl': '48px',
        '5xl': '64px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '14px',
        xl: '20px',
        '2xl': '24px',
      },
      spacing: {
        touch: '56px',
        'touch-lg': '72px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.24)',
        glow: '0 8px 24px rgba(255, 107, 61, 0.35)',
      },
      backdropBlur: {
        xs: '4px',
        glass: '20px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        snappy: 'cubic-bezier(0.16, 1, 0.3, 1)',
        bouncy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '150ms',
        normal: '220ms',
        slow: '320ms',
        leisurely: '500ms',
      },
      backgroundImage: {
        'page-gradient':
          'radial-gradient(ellipse at top left, #1A2040 0%, #0A0E1A 60%)',
      },
    },
  },
  plugins: [],
};
