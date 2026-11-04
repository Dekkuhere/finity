/** @type {import('tailwindcss').Config} */
// Colors come from CSS variables in src/index.css so light/dark switch instantly.
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
const scale = (name, shades) => Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)]));

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        white: v('white'),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        emerald: scale('emerald', [50, 100, 200, 400, 500, 600, 700, 800, 900]),
        rose: scale('rose', [50, 400, 500, 600]),
        indigo: scale('indigo', [50, 100, 500, 600]),
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        pulseGlow: { '0%, 100%': { opacity: '0.4' }, '50%': { opacity: '0.8' } },
      },
    },
  },
  plugins: [],
};
