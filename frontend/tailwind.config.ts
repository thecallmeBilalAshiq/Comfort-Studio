import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { 
          DEFAULT: '#1a2d36', // comfort-secondary
          dark: '#0c576d',    // comfort-primary
        },
        accent: { 
          DEFAULT: '#d69730', // comfort-accent
          hover: '#c08422',
        },
        'comfort-primary': '#0c576d',
        'comfort-secondary': '#1a2d36',
        'comfort-accent': '#d69730',
        'comfort-bg': '#fcfbf9',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
