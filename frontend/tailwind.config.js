/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        sans:   ['Inter', 'Open Sans', 'sans-serif']
      },
      colors: {
        // Brand
        gold:        '#ECA72C',
        'gold-soft': '#F4C46A',
        'gold-deep': '#C58A1E',
        purple:      '#44355B',
        'purple-light': '#5C4A78',

        // Backgrounds — estética Hevy (más oscuros y neutros)
        dark:           '#0F0D10',  // body
        'dark-soft':    '#15131A',  // hover
        card:           '#1A171F',  // cards
        'card-hover':   '#221E27',  // card hover
        deep:           '#1A171F',  // alias compatibilidad
        'deep-light':   '#221E27',

        // Semánticos
        success: '#37D6A5',
        warning: '#FFB547',
        danger:  '#FF6B6B',
        info:    '#5BA0F2'
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(0,0,0,0.3)',
        'card-hover': '0 4px 16px -2px rgba(0,0,0,0.5)',
        'gold':       '0 0 0 3px rgba(236,167,44,0.15)',
        'inner-soft': 'inset 0 1px 0 0 rgba(255,255,255,0.04)'
      },
      backgroundImage: {
        'gradient-gold':   'linear-gradient(135deg, #F4C46A 0%, #ECA72C 100%)',
        'gradient-card':   'linear-gradient(180deg, #1F1B26 0%, #1A171F 100%)'
      },
      animation: {
        'fade-in':       'fadeIn 0.2s ease-out',
        'fade-up':       'fadeUp 0.25s ease-out',
        'scale-in':      'scaleIn 0.15s ease-out',
        'pulse-soft':    'pulseSoft 2s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s linear infinite'
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp:  { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
        pulseSoft: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } }
      }
    }
  }
}
