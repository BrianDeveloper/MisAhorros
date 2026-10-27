/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['Quicksand', 'Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'cream': '0 10px 40px -12px rgba(249, 115, 22, 0.22)',
        'soft': '0 12px 45px -14px rgba(168, 85, 247, 0.22)',
        'bubble': '0 8px 30px -10px rgba(251, 146, 60, 0.18)',
      }
    },
  },
  plugins: [],
}
