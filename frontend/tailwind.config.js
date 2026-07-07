/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#0D0D0D',       // OS2 brand black
        parchment: '#F7F7F5', // neutral light background, not cream/paper
        // "brand" = OS2 gold #F0A500, kept as the key name so all existing
        // brand-* classes across the app pick this up automatically.
        brand: {
          50: '#FDF4E0',
          100: '#FBE7B8',
          300: '#F5C563',
          500: '#F0A500',
          600: '#CC8B00',
          700: '#A66F00',
        },
        // "brass" = OS2 secondary lime #B5DE00
        brass: {
          50: '#F5FBE0',
          100: '#E8F5B8',
          400: '#C5E85C',
          500: '#B5DE00',
          600: '#94B800',
        },
        // kept for error/destructive states — not a brand color, functional only
        rust: {
          50: '#FCEBEA',
          100: '#F5C2BE',
          400: '#E0574A',
          500: '#D6362A',
          600: '#B32B21',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
