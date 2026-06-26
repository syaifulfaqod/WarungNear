/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#16A34A",
        secondary: "#22C55E",
        accent: "#F59E0B",
        background: "#F8FAFC",
        text: "#0F172A",
        border: "#E2E8F0",
        success: "#10B981",
        error: "#EF4444"
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
