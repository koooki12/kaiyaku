import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#f54a00",
          light: "#ff7a3c",
          dark: "#d63a00",
        },
      },
    },
  },
  plugins: [],
};

export default config;
