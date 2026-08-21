import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://cuatrohuellas.cl'
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/reservar`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ]
}
