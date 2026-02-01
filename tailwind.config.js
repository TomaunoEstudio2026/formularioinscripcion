/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#f20d0d",
        "background-dark": "#0a0505",
        "card-dark": "#1a0d0d",
        "input-dark": "#2d1616",
        "text-muted": "#cb9090",
      },
      fontFamily: {
        "display": ["Manrope", "sans-serif"]
      }
    },
  },
  plugins: [],
}