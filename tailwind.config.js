/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#00e0c6',
        'accent-dim': 'rgba(0, 224, 198, 0.15)',
      },
    },
  },
  plugins: [],
};