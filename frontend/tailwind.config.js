/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ef4444', // Tailwind red-500
          dark: '#b91c1c',   // Tailwind red-700
          light: '#fee2e2',  // Tailwind red-100
        },
        background: '#fff',
      },
    },
  },
  plugins: [],
}

