import Fuse from 'fuse.js'
import { knowledgeBase, KnowledgeEntry } from './noxis-docs'

// Verify on module load
console.log('[AskNoxis] Knowledge base loaded:', knowledgeBase.length, 'entries')

if (knowledgeBase.length === 0) {
  console.error('[AskNoxis] EMPTY! Import failed.')
}

const fuse = new Fuse(knowledgeBase, {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'tags', weight: 0.4 },
    { name: 'content', weight: 0.2 },
  ],
  threshold: 0.5,      // More permissive (0=exact, 1=anything)
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
  useExtendedSearch: false,
})

export function searchKnowledge(
  query: string,
  limit = 8
): KnowledgeEntry[] {
  if (!query || query.trim().length < 2) return []
  
  console.log('[AskNoxis] Searching:', query)
  const results = fuse.search(query.trim(), { limit })
  console.log('[AskNoxis] Found:', results.length)
  
  return results.map(r => r.item)
}

export function getContextualHelp(
  pathname: string
): KnowledgeEntry[] {
  // Return top 3 entries relevant to current page
  const routeMap: Record<string, string[]> = {
    '/inventory': ['inv-add-sku', 'inv-adjust-stock', 'inv-reorder'],
    '/khata': ['khata-entry', 'khata-party-balance'],
    '/karigars': ['kar-add', 'kar-attendance', 'kar-peshgi'],
    '/invoices': ['inv-create', 'inv-send-whatsapp'],
    '/payroll': ['pay-run', 'kar-peshgi'],
    '/reports': ['rep-pnl', 'rep-tax'],
    '/cctv': ['cctv-add'],
    '/settings': ['set-theme', 'set-language'],
    '/generators': ['gen-payslip', 'gen-qr'],
    '/lens': ['lens-scan'],
    '/pairing': ['pair-device'],
  }
  
  const ids = routeMap[pathname] ||
    routeMap[Object.keys(routeMap).find(
      k => pathname.startsWith(k)
    ) || ''] || []
  
  return ids
    .map(id => knowledgeBase.find(e => e.id === id))
    .filter(Boolean) as KnowledgeEntry[]
}
