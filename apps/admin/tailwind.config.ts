import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        sidebar: {
          bg:         '#111827',
          hover:      '#1f2937',
          active:     '#1f2937',
          text:       '#9ca3af',
          activeText: '#f9fafb',
          border:     '#1f2937',
        },
      },
      fontFamily: {
        sans: ['var(--font-sarabun)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        thai: ['var(--font-sarabun)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.08)',
        brand:   '0 4px 20px -2px rgba(249,115,22,0.35)',
        sidebar: '-4px 0 24px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-in': 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':  'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)',    opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config
