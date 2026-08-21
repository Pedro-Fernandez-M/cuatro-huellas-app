import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://cuatrohuellas.cl/sitemap.xml',
    host: 'https://cuatrohuellas.cl',
  }
}
