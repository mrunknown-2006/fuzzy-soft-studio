/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FAF7F4',
          accent: '#C4A0A0',
          'accent-hover': '#B08888',
          heading: '#2C1810',
          body: '#5C4033',
          'alt-bg': '#F5EDE8',
          'footer-bg': '#F0E6E0',
          'copyright-bg': '#E8D8D0',
          border: '#EDE0D8',
          subtext: '#8B6F6F',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Lato', 'sans-serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
      }
    },
  },
  plugins: [],
}
