/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          navy: '#0B162C', // The new Deep Premium Navy to match the side panel
          teal: '#0f766e', // A slightly richer teal to pop against the dark navy
          bg: '#F8FAFC',   // A modern slate-50 background instead of flat gray
        }
      }
    },
  },
  plugins: [],
}