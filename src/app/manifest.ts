import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vocaloid Rankings',
    short_name: 'VocaRankings',
    description: 'Explore vocal synthesizer songs that are ranked based on their total view counts with powerful filtering capabilities.',
    start_url: '/',
    display: 'standalone',
    background_color: 'var(--md-sys-color-background)',
    theme_color: 'var(--md-sys-color-primary)',
    icons: [
      {
        src: '/github-mark-white.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  }
}