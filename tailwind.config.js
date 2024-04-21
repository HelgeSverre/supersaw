const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        dark: {
          900: "hsl(249, 9%, 10%)",
          800: "hsl(249, 9%, 12%)",
          700: "hsl(249, 9%, 15%)",
          600: "hsl(247, 9%, 17%)",
          500: "hsl(244, 9%, 22%)",
          400: "hsl(244, 9%, 24%)",
          300: "hsl(244, 9%, 23%)",
          200: "hsl(244, 9%, 29%)",
          100: "hsl(246, 9%, 44%)",
        },
        light: {
          DEFAULT: "hsl(0,0%,92%)",
          secondary: "hsl(0,0%,85%)",
          soft: "hsl(150,1%,44%)",
        },
        accent: {
          blue: "#4f7fff",
          purple: "#9876f9",
          green: "#74d19a",
          pink: "#e674ce",
          red: "#fe5c5b",
          yellow: "#fade6a",
        },
        black: {
          100: "#101010",
          200: "#171718",
          300: "#242426",
        },
      },
    },
  },
  plugins: [],
};
