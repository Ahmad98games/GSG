import Fuse from 'fuse.js'
import { knowledgeBase, KnowledgeEntry } from './noxis-docs'

console.log('[Sentinel] Knowledge base loaded:', knowledgeBase.length, 'entries')

const fuse = new Fuse(knowledgeBase, {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'tags', weight: 0.45 },
    { name: 'content', weight: 0.1 },
    { name: 'category', weight: 0.05 },
  ],
  threshold: 0.45,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  useExtendedSearch: false,
})

export function searchKnowledge(query: string, limit = 3): KnowledgeEntry[] {
  if (!query || query.trim().length < 2) return []
  const results = fuse.search(query.trim(), { limit })
  console.log(`[Sentinel] "${query}" → ${results.length} results`)
  return results.map(r => r.item)
}
