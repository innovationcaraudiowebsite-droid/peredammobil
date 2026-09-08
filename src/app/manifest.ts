import type { MetadataRoute } from 'next'

/**
 * Web app manifest — PWA / mobile install metadata.
 * Output URL: https://peredammobiljakarta.com/manifest.webmanifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Peredam Mobil Jakarta',
    short_name: 'PMJ',
    description: 'Portal berita peredam mobil & upgrade audio Jakarta',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f59e0b',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    categories: ['news', 'automotive'],
    lang: 'id-ID',
    dir: 'ltr',
  }
}
