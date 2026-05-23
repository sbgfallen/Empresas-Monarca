import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          900: "#000000",
          800: "#0a0a0a",
          700: "#141414",
          600: "#1f1f1f",
          500: "#333333",
          50: "#fefcf5",
        },
        cream: {
          50: "#fef7ed",
          100: "#fef3c7",
          200: "#fde68a",
        },
      },
    },
  },
  plugins: [],
};

export default config;