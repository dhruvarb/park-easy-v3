/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brandNight: '#131419',     // Rich Black
        brandIndigo: '#1E1F26',    // Dark Card Background
        brandIris: '#6C5DD3',      // Primary Purple
        brandSky: '#3F8CFF',       // Secondary Blue
        brandSand: '#E4E4E4',      // Light Text
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 20px 60px -25px rgba(10, 21, 50, 0.8)',
      },
    },
  },
  plugins: [],
}

