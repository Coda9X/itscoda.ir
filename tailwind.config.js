/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        accent: '#f59e0b',
      },
      fontFamily: {
        iran: ['IRANSans', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

