/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark charcoal + gold theme — deep warm charcoal, not pure black,
        // with three elevation levels: panel (darkest, nav/login chrome) <
        // parchment (page background) < surface (cards, elevated above the page).
        panel: '#0F0B08',
        parchment: '#171310',
        surface: '#221C17',
        // "ink" is now the primary TEXT color (light, warm off-white) —
        // opacity variants (text-ink/50, border-ink/15, bg-ink/5) naturally
        // become subtle light-on-dark tones, which is exactly right for
        // muted text and card borders in a dark UI. Only literal `bg-ink`
        // (full opacity, used as a background) needed switching to `panel`
        // across the app — see Sidebar/Login/Header/Signup.
        ink: '#F2ECE2',
        brand: {
          50: '#FFF8E5',
          100: '#FDEBB8',
          300: '#F8C955',
          500: '#F5B400',
          600: '#F0A500',
          700: '#D48F00',
        },
        brass: {
          50: '#F5FBE0',
          100: '#E8F5B8',
          400: '#C5E85C',
          500: '#B5DE00',
          600: '#94B800',
        },
        rust: {
          50: '#FCEBEA',
          100: '#F5C2BE',
          400: '#E86A5B',
          500: '#E14A3A',
          600: '#C23624',
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
