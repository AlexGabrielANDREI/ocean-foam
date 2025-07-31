/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: "#19baa8",
          500: "#19baa8",
          600: "#17a99a",
          700: "#15988c",
        },
        secondary: {
          300: "#783376",
          400: "#783376",
          500: "#783376",
          600: "#6a2d68",
          700: "#5c275a",
        },
        accent: {
          green: "#19baa8",
          teal: "#19baa8",
          pink: "#e04288",
          blue: "#024b86",
          purple: "#783376",
        },
        pink: {
          400: "#e04288",
          500: "#e04288",
          600: "#d63384",
          700: "#c22577",
        },
        blue: {
          400: "#024b86",
          500: "#024b86",
          600: "#024280",
          700: "#023a7a",
        },
        purple: {
          400: "#783376",
          500: "#783376",
          600: "#6a2d68",
          700: "#5c275a",
        },
        teal: {
          400: "#19baa8",
          500: "#19baa8",
          600: "#17a99a",
          700: "#15988c",
        },
        card: "rgba(30, 41, 59, 0.8)",
        border: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        sans: [
          "Sharp Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      animation: {
        "gradient-shift": "gradientShift 15s ease infinite",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "slide-in-left": "slideInLeft 0.6s ease-out",
      },
      keyframes: {
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        fadeInUp: {
          from: {
            opacity: "0",
            transform: "translateY(30px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideInLeft: {
          from: {
            opacity: "0",
            transform: "translateX(-30px)",
          },
          to: {
            opacity: "1",
            transform: "translateX(0)",
          },
        },
      },
    },
  },
  plugins: [],
};
