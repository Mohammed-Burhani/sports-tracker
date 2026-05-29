/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        warm: {
          base: "#F5F0E8",
          card: "#FFFFFF",
          elevated: "#FFFBF5",
          input: "#F9F5EF",
        },
        text: {
          primary: "#2D2416",
          secondary: "#6B5D4F",
          tertiary: "#9B8B7E",
        },
      },
    },
  },
  plugins: [],
};
