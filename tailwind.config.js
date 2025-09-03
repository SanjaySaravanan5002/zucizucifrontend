/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E40AF',
          dark: '#1E3A8A',
          light: '#3B82F6',
        },
        secondary: {
          DEFAULT: '#0891B2',
          dark: '#0E7490',
          light: '#06B6D4',
        },
        accent: {
          DEFAULT: '#059669',
          dark: '#047857',
          light: '#10B981',
        },
        wash: {
          blue: '#1E40AF',
          cyan: '#0891B2',
          emerald: '#059669',
          amber: '#D97706',
          red: '#DC2626',
        }
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in-up': 'fade-in-up 0.6s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'wash-cycle': 'wash-cycle 3s linear infinite',
        'drop-fall': 'drop-fall 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 20px rgba(30, 64, 175, 0.5)',
      }
    },
  },
  plugins: [],
};