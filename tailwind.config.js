/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        dark: 'var(--dark)',
        'dark-secondary': 'var(--dark-secondary)',
        'dark-hover': 'var(--dark-hover)',
        light: 'var(--light)',
        'light-secondary': 'var(--light-secondary)',
      },
      opacity: {
        '15': '0.15',
        '35': '0.35',
        '65': '0.65',
      },
      gridTemplateColumns: {
        'auto-fill-200': 'repeat(auto-fill, minmax(200px, 1fr))',
        'auto-fill-250': 'repeat(auto-fill, minmax(250px, 1fr))',
        'auto-fill-300': 'repeat(auto-fill, minmax(300px, 1fr))',
      },
      height: {
        'screen-navbar': 'calc(100vh - 64px)',
      },
      maxHeight: {
        'screen-navbar': 'calc(100vh - 64px)',
      },
    },
  },
  plugins: [],
} 