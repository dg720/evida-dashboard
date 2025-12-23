/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Space Grotesk\"", "sans-serif"],
        body: ["\"IBM Plex Sans\"", "sans-serif"],
      },
      colors: {
        ink: "#0b0f14",
        haze: "#eef2f7",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        accentDeep: "var(--accent-deep)",
      },
      boxShadow: {
        glow: "0 20px 45px -30px rgba(15, 23, 42, 0.5)",
      },
    },
  },
  plugins: [],
};
