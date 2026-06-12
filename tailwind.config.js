/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./gps/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#333',
            h1: { fontWeight: '800', color: '#111' },
            h2: { fontWeight: '800', color: '#111' },
            h3: { fontWeight: '800', color: '#111' },
            h4: { fontWeight: '800', color: '#111' },
            a: {
              color: '#e31b23',
              '&:hover': {
                color: '#000',
              },
            },
            'span[style]': {
              display: 'inline',
            },
            mark: {
              backgroundColor: 'yellow',
              color: 'black',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
