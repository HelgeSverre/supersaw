const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
        mono: ["JetBrains Mono", ...defaultTheme.fontFamily.mono],
      },
      colors: {
        dark: {
          900: "rgb(var(--dark-900) / <alpha-value>)",
          800: "rgb(var(--dark-800) / <alpha-value>)",
          700: "rgb(var(--dark-700) / <alpha-value>)",
          600: "rgb(var(--dark-600) / <alpha-value>)",
          500: "rgb(var(--dark-500) / <alpha-value>)",
          400: "rgb(var(--dark-400) / <alpha-value>)",
          300: "rgb(var(--dark-300) / <alpha-value>)",
          200: "rgb(var(--dark-200) / <alpha-value>)",
          100: "rgb(var(--dark-100) / <alpha-value>)",
        },
        light: {
          DEFAULT: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          soft: "rgb(var(--text-soft) / <alpha-value>)",
        },
        accent: {
          blue: "rgb(var(--accent-blue) / <alpha-value>)",
          purple: "rgb(var(--accent-purple) / <alpha-value>)",
          green: "rgb(var(--accent-green) / <alpha-value>)",
          pink: "rgb(var(--accent-pink) / <alpha-value>)",
          red: "rgb(var(--accent-red) / <alpha-value>)",
          yellow: "rgb(var(--accent-yellow) / <alpha-value>)",
        },
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
