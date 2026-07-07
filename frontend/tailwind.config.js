/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefcf6',
          100: '#d5f7e8',
          500: '#0f9d6f',
          600: '#0c7f5a',
          700: '#0a6448',
        },
      },
    },
  },
  plugins: [],
}
