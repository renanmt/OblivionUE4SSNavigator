/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'theme-darkest': '#080a11',
        'theme-darker': '#0d101b',
        'theme-dark': '#0f121e',
        'theme-mid': '#111422',
        'theme-light': '#15192b',
        'theme-accent': '#3a4577',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}; 