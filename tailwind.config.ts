import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        sidebar: 'rgb(var(--c-sidebar) / <alpha-value>)',
        card: 'rgb(var(--c-card) / <alpha-value>)',
        'card-secondary': 'rgb(var(--c-card-secondary) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        primary: {
          DEFAULT: '#4F8CFF',
          dim: 'rgba(79,140,255,0.14)',
        },
        success: {
          DEFAULT: '#2ECC71',
          dim: 'rgba(46,204,113,0.14)',
        },
        warning: {
          DEFAULT: '#F39C12',
          dim: 'rgba(243,156,18,0.14)',
        },
        danger: {
          DEFAULT: '#FF4D4F',
          dim: 'rgba(255,77,79,0.14)',
        },
        purple: {
          DEFAULT: '#A855F7',
          dim: 'rgba(168,85,247,0.14)',
        },
        gold: {
          DEFAULT: '#D6A84F',
          dim: 'rgba(214,168,79,0.14)',
        },
        text: {
          DEFAULT: 'rgb(var(--c-text) / <alpha-value>)',
          sub: 'rgb(var(--c-text-sub) / <alpha-value>)',
          faint: 'rgb(var(--c-text-faint) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
        display: ['"Space Grotesk"', 'Pretendard', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        btn: '14px',
        input: '12px',
        modal: '24px',
      },
      boxShadow: {
        soft: '0 12px 40px rgba(0,0,0,.35)',
        hover: '0 18px 48px rgba(0,0,0,.45)',
      },
      backdropBlur: {
        glass: '20px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      spacing: {
        header: '72px',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.97) translateY(4px)' }, to: { opacity: '1', transform: 'scale(1) translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 160ms ease-out',
        'scale-in': 'scale-in 180ms cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
