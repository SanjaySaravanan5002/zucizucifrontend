/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
          light: '#93C5FD',
        },
        secondary: {
          DEFAULT: '#0D9488',
          dark: '#0F766E',
          light: '#5EEAD4',
        },
        accent: {
          DEFAULT: '#F97316',
          dark: '#EA580C',
          light: '#FDBA74',
        }
      }
    },
  },
  plugins: [],
};