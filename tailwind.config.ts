import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0f172a",
        sand: "#f8fafc",
        accent: "#6366f1",
        "accent-light": "#818cf8",
        ink: "#0b1120",
        surface: "#ffffff",
        muted: "#64748b",
      },
      boxShadow: {
        glow: "0 0 20px rgba(99, 102, 241, 0.15)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.08)",
      },
    }
  },
  plugins: [],
};

export default config;
