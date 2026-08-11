/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090c15",
        panel: "rgba(18, 24, 38, 0.75)",
        primary: "#f97316",
        accent: "#f59e0b",
        muted: "#94a3b8",
        tmcOrange: "#f97316",
        tmcYellow: "#f59e0b",
      },
      backdropBlur: {
        glass: "16px",
      }
    },
  },
  plugins: [],
}
