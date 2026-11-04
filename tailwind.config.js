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
          navy: '#1E3A8A', 
          teal: '#0D9488', 
          bg: '#F9FAFB',   
        }
      }
    },
  },
  plugins: [],
}