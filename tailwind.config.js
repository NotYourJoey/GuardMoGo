/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1ab1ce',
        secondary: '#4461ab',
        accent: '#c41262',
        dark: '#0a0e1a',
        'dark-secondary': '#16192c',
      },
    },
  },
  plugins: [],
}

