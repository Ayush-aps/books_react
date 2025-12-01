/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef5ee',
          100: '#fde9d7',
          200: '#facfad',
          300: '#f7ae79',
          400: '#f38643',
          500: '#f06820',
          600: '#e14d16',
          700: '#ba3814',
          800: '#942f18',
          900: '#782916',
          950: '#41120a',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7cd4fd',
          400: '#36bffa',
          500: '#0ba5ec',
          600: '#0086c9',
          700: '#026aa2',
          800: '#065986',
          900: '#0b4a6f',
          950: '#082f49',
        },
        accent: {
          brown: '#8B7355',
          'brown-hover': '#6F5C44',
          green: '#4A5D4F',
          'green-hover': '#3A4D3F',
          taupe: '#C4B5A0',
          gold: '#C9A96E',
        },
        // Custom theme colors
        cream: '#F5F1E8',
        charcoal: '#2C2C2C',
        brown: '#8B7355',
        green: '#4A5D4F',
        taupe: '#C4B5A0',
        'text-primary': '#2C2C2C',
        'text-secondary': '#4A4A4A',
        'text-tertiary': '#6B6B6B',
        'background-secondary': '#F9F6F1',
        'border-light': '#F0EBE0',
      },
    },
  },
  plugins: [],
}
