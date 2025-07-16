/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fedac2',
          100: '#fdbc94',
          200: '#ffac7b',
          300: '#fd7f33',
          400: '#fc5d01',
          500: '#fc5d01',
          600: '#fc5d01',
          700: '#e54a00',
          800: '#cc4200',
          900: '#b33a00',
        },
      },
    },
  },
  plugins: [],
}
