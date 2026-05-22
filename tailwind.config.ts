import type { Config } from "tailwindcss";

/** Scoped utilities for the Dispatch module only — preflight off so BOF global CSS stays intact. */
const config: Config = {
  corePlugins: {
    preflight: false,
  },
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bof: {
          teal: {
            DEFAULT: "#0d9488",
            50: "#f0fdfa",
            100: "#ccfbf1",
            500: "#14b8a6",
            600: "#0d9488",
            700: "#0f766e",
            800: "#115e59",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
