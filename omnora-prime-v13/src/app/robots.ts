import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/portal/',
          '/api/',
          '/dashboard',
          '/admin',
        ],
      },
      // Allow AI crawlers (for citations)
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      

      // Block tech stack scrapers
      // These tools reveal your dependencies to competitors
      {
        userAgent: 'Wappalyzer',
        disallow: '/',
      },
      {
        userAgent: 'BuiltWith',
        disallow: '/',
      },
      {
        userAgent: 'WhatRuns',
        disallow: '/',
      },
      {
        userAgent: 'SimilarTech',
        disallow: '/',
      },
    ],
    sitemap: 'https://noxishub.app/sitemap.xml',
  }
}
