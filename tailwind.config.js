/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF6EE",
        "paper-dim": "#F3EDE0",
        card: "#FFFDF8",
        ink: "#243044",
        "ink-soft": "#5A6478",
        marigold: {
          DEFAULT: "#E8A33D",
          dark: "#8F5D0C", // darkened from #C07F1D for WCAG AA contrast
          light: "#F5D9A8",
        },
        teal: {
          DEFAULT: "#2D5F5A",
          dark: "#1F433F",
          light: "#4C8983",
        },
        stamp: "#6E6350", // darkened from #94886F for WCAG AA small-text contrast on paper
        // per-phase scene identities — tint for fills, deep for icons/text
        peach: { tint: "#F8E3D4", deep: "#C97853" },
        sky: { tint: "#DCEAF4", deep: "#5E93B8" },
        lavender: { tint: "#E8E3F2", deep: "#8078AC" },
        sage: { tint: "#E3E9D6", deep: "#75904F" },
        coral: "#E08D6D",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
        hand: ["Caveat", "cursive"],
      },
      borderRadius: {
        ticket: "1.5rem",
      },
      boxShadow: {
        card: "0 6px 24px -14px rgba(36, 48, 68, 0.22)",
        soft: "0 2px 12px -6px rgba(36, 48, 68, 0.12)",
      },
    },
  },
  plugins: [],
};
