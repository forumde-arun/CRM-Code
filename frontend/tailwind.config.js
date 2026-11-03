/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { brand: { 50: '#effaf4', 100: '#d7f3e3', 200: '#b0e6c9', 500: '#1fa464', 600: '#0f8a52', 700: '#0b6e42', 800: '#0a5736', 900: '#08452c' } },
      fontFamily: { sans: ['Inter', '"Segoe UI"', 'system-ui', '-apple-system', 'sans-serif'] },
    },
  },
  plugins: [],
};
