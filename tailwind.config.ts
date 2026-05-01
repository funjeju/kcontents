import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F5EFE0",
          card: "#FBF7ED",
          elevated: "#FFFFFF",
        },
        text: {
          DEFAULT: "#1A1614",
          muted: "#5B514B",
          caption: "#8A7F77",
        },
        accent: {
          maple: "#C9302C",
          jade: "#5C8E76",
          gold: "#D4AF37",
        },
        stat: {
          intellect: "#5B514B",
          creativity: "#C9302C",
          emotion: "#A87C50",
          physique: "#5C8E76",
          sociability: "#8B5A2B",
          morality: "#D4AF37",
        },
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard", "Inter", "sans-serif"],
        serif: ["var(--font-noto-serif-kr)", "Noto Serif KR", "Noto Serif", "serif"],
      },
      spacing: {
        "card-gap": "16px",
        "screen-x": "20px",
        section: "32px",
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
      boxShadow: {
        paper: "0 1px 2px rgba(0, 0, 0, 0.04)",
        "paper-md": "0 2px 4px rgba(0, 0, 0, 0.06)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "300ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "stat-flash": "statFlash 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        statFlash: {
          "0%": { color: "inherit" },
          "40%": { color: "#C9302C" },
          "100%": { color: "inherit" },
        },
      },
      maxWidth: {
        game: "480px",
      },
    },
  },
  plugins: [typography],
};

export default config;
