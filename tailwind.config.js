/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7EF",
        "paper-dim": "#F3EEE2",
        ink: "#1B2333",
        "ink-soft": "#3A4256",
        marigold: {
          DEFAULT: "#E8A33D",
          dark: "#C97F1F",
          light: "#F3C877",
        },
        teal: {
          DEFAULT: "#2D5F5A",
          dark: "#1F433F",
          light: "#4C8983",
        },
        clay: "#B5654A",
        stamp: "#8A7A63",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        ticket: "1.25rem",
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(27, 35, 51, 0.25)",
        stamp: "inset 0 0 0 1.5px rgba(138,122,99,0.5)",
      },
      backgroundImage: {
        perforation:
          "radial-gradient(circle, rgba(27,35,51,0.15) 1.5px, transparent 1.5px)",
      },
    },
  },
  plugins: [],
};
