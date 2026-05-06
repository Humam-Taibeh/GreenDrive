import type { Config } from 'tailwindcss'

/** Mirrors CSS @theme tokens for tooling; Tailwind v4 primary config lives in `src/index.css`. */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        onyx: '#000000',
        toxic: '#36ff97',
        'toxic-dim': '#1a8f5a',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
