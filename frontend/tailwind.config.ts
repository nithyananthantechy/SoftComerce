import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          400: "#748ffc",
          500: "#5c7cfa",
          600: "#4c6ef5",
          700: "#3b5bdb",
          800: "#2c3e9e",
          900: "#1e2a6e",
        },
        dark: {
          900: "#0a0d14",
          800: "#0f1320",
          700: "#141827",
          600: "#1a1f2e",
          500: "#232838",
          400: "#2d3448",
        },
        violet: {
          500: "#9775fa",
          600: "#7950f2",
          700: "#6741d9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(92,124,250,0.2) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(121,80,242,0.12) 0%, transparent 60%)",
        "card-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "brand-gradient": "linear-gradient(135deg, #4c6ef5 0%, #7950f2 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(92,124,250,0.25)",
        "glow-sm": "0 0 20px rgba(92,124,250,0.2)",
        card: "0 8px 32px rgba(0,0,0,0.4)",
        "card-hover": "0 16px 48px rgba(0,0,0,0.5), 0 0 24px rgba(92,124,250,0.15)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.45s ease forwards",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
