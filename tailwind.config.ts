import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0A0C",
          surface: "#111114",
          raised: "#18181C",
          light: "#FAFAF9",
          "light-surface": "#F1F0ED",
          "light-raised": "#FFFFFF",
        },
        border: {
          DEFAULT: "#232327",
          light: "#E4E2DD",
        },
        ink: {
          DEFAULT: "#EDEDF0",
          muted: "#8B8B94",
          faint: "#57575F",
          light: "#161614",
          "light-muted": "#6B6A63",
        },
        accent: {
          DEFAULT: "#6C5CE7",
          hover: "#7C6DFA",
          dim: "#2A2354",
        },
        mint: {
          DEFAULT: "#34D19A",
          dim: "#123527",
        },
        danger: {
          DEFAULT: "#FF5D5D",
          dim: "#3A1A1A",
        },
        amber: {
          DEFAULT: "#F5A623",
          dim: "#3A2A0F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        blink: "blink 1.1s step-end infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: { "50%": { opacity: "0" } },
      },
    },
  },
  plugins: [],
};

export default config;
