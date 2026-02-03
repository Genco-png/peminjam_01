/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        mountain: {
          50: '#faf5f0',
          100: '#f4e8d9',
          200: '#e8d0b3',
          300: '#d9b388',
          400: '#ca9560',
          500: '#b87a3e',
          600: '#9d6433',
          700: '#7f4f2b',
          800: '#6a4127',
          900: '#5a3723',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
