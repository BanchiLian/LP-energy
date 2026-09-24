/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        'energy-red': '#CA3236',
        'energy-wine': '#A03A3B',
        'energy-red-lt': '#E8595C',
        'ink-0': '#0B0B0C',
        'ink-1': '#111111',
        'ink-2': '#060607',
        'line': '#4D4D4D',
        'muted': '#A1A1AA'
      },
      fontFamily: {
        display: ['Oswald', 'system-ui', 'sans-serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display': ['clamp(2.75rem, 7vw, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.02em' }],
        'h1': ['clamp(2.25rem, 5.5vw, 4.5rem)', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        'h2': ['clamp(1.875rem, 4vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'h3': ['clamp(1.375rem, 2.2vw, 1.875rem)', { lineHeight: '1.2' }],
        'body-lg': ['clamp(1.0625rem, 1.4vw, 1.25rem)', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.65' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }]
      },
      spacing: {
        'section-y': 'clamp(5rem, 9vw, 9rem)',
        'gutter': 'clamp(1.25rem, 4vw, 3rem)'
      },
      maxWidth: {
        'grid': '80rem'
      },
      borderRadius: {
        'card': '1rem'
      }
    }
  },
  plugins: []
};
