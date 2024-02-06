/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    fontFamily: {
      'sans': ['var(--font-inter)', 'var(--font-noto-sans-jp)'],
    },
    extend: {
      typography: theme => ({
        material: {
          css: {
            '--tw-prose-body': theme('colors.on-surface'),
            '--tw-prose-headings': theme('colors.on-background'),
            '--tw-prose-lead': theme('colors.on-surface'),
            '--tw-prose-links': theme('colors.primary'),
            '--tw-prose-bold': theme('colors.on-surface'),
            '--tw-prose-counters': theme('colors.on-surface'),
            '--tw-prose-bullets': theme('colors.outline'),
            '--tw-prose-hr': theme('colors.outline-variant'),
            '--tw-prose-quotes': theme('colors.on-surface'),
            '--tw-prose-quote-borders': theme('colors.outline-variant'),
            '--tw-prose-captions': theme('colors.on-surface'),
            '--tw-prose-code': theme('colors.on-surface'),
            '--tw-prose-pre-code': theme('colors.outline-variant'),
            '--tw-prose-pre-bg': theme('colors.on-surface'),
            '--tw-prose-th-borders': theme('colors.outline-variant'),
            '--tw-prose-td-borders': theme('colors.outline-variant'),
          }
        }
      }),
      gridTemplateColumns: {
        'sidebar': '220px auto'
      },
      dropShadow: {
        'image': '8px 8px 0px var(--md-sys-color-primary)'
      },
      colors: {
        'primary': 'var(--md-sys-color-primary)',
        'on-primary': 'var(--md-sys-color-on-primary)',
        'primary-container': 'var(--md-sys-color-primary-container)',
        'on-primary-container': 'var(--md-sys-color-on-primary-container)',
        'secondary': 'var(--md-sys-color-secondary)',
        'on-secondary': 'var(--md-sys-color-on-secondary)',
        'secondary-container': 'var(--md-sys-color-secondary-container)',
        'on-secondary-container': 'var(--md-sys-color-on-secondary-container)',
        'tertiary': 'var(--md-sys-color-tertiary)',
        'on-tertiary': 'var(--md-sys-color-on-tertiary)',
        'tertiary-container': 'var(--md-sys-color-tertiary-container)',
        'on-tertiary-container': 'var(--md-sys-color-on-tertiary-container)',
        'error': 'var(--md-sys-color-error)',
        'on-error': 'var(--md-sys-color-on-error)',
        'error-container': 'var(--md-sys-color-error-container)',
        'on-error-container': 'var(--md-sys-color-on-error-container)',
        'outline': 'var(--md-sys-color-outline)',
        'background': 'var(--md-sys-color-background)',
        'on-background': 'var(--md-sys-color-on-background)',
        'surface': 'var(--md-sys-color-surface)',
        'surface-container': 'var(--md-sys-color-surface-container)',
        'surface-container-lowest': 'var(--md-sys-color-surface-container-lowest)',
        'surface-container-low': 'var(--md-sys-color-surface-container-low)',
        'surface-container-high': 'var(--md-sys-color-surface-container-high)',
        'surface-container-highest': 'var(--md-sys-color-surface-container-highest)',
        'surface-1': 'var(--md-sys-color-surface-1)',
        'surface-2': 'var(--md-sys-color-surface-2)',
        'on-surface': 'var(--md-sys-color-on-surface)',
        'surface-variant': 'var(--md-sys-color-surface-variant)',
        'on-surface-variant': 'var(--md-sys-color-on-surface-variant)',
        'inverse-surface': 'var(--md-sys-color-inverse-surface)',
        'inverse-on-surface': 'var(--md-sys-color-inverse-on-surface)',
        'inverse-primary': 'var(--md-sys-color-inverse-primary)',
        'shadow': 'var(--md-sys-color-shadow)',
        'surface-tint': 'var(--md-sys-color-surface-tint)',
        'outline-variant': 'var(--md-sys-color-outline-variant)',
        'scrim': 'var(--md-sys-color-scrim)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography')
  ],
}
