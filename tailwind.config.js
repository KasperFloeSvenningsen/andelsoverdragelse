/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blomfelt: {
          // Primære
          green:    '#2C403A',   // BLOMFELT GREEN – primær brandfarve
          yellow:   '#FDF6E1',   // BLOMFELT YELLOW – primær lys
          // Sekundære
          black:    '#000000',
          white:    '#FFFFFF',
          // Accentfarver
          blue:     '#AFD0E7',   // BRIGHT BLUE
          coral:    '#FFA899',   // CORAL
          sunny:    '#F9C271',   // SUNNY
          lavender: '#E5C8F8',   // LAVENDER
          // Mørkere green-toner til hover/interaktion
          'green-dark':  '#1e2d28',
          'green-light': '#3d5a52',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
