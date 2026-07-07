/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#16231F',
        parchment: '#F3EFE3',
        // "brand" kept as the key name so existing brand-* classes pick up
        // the new palette automatically — this IS the survey-green scale.
        brand: {
          50: '#EAF3EE',
          100: '#CFE4D8',
          300: '#8FBFA0',
          500: '#2F6B4F',
          600: '#255A41',
          700: '#1D4834',
        },
        brass: {
          50: '#FBF3E4',
          100: '#F3E0B8',
          400: '#C79A4B',
          500: '#B8863B',
          600: '#9C6F2E',
        },
        rust: {
          50: '#F7E9E4',
          100: '#EBC7B9',
          400: '#C15A3D',
          500: '#A6432B',
          600: '#8A3521',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
