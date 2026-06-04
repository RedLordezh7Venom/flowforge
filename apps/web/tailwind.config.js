
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forge: { 50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e', 950: '#082f49' },
        node: { trigger: '#FF9800', action: '#4CAF50', ai: '#10A37F', logic: '#FF5722', transform: '#2196F3', webhook: '#FF6D5A', schedule: '#00C853', communication: '#E91E63', database: '#795548', custom: '#9C27B0' }
      }
    }
  },
  plugins: []
};
