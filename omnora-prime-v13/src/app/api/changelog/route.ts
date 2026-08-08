import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-static'

export function GET() {
  try {
    const changelog = readFileSync(
      join(process.cwd(), 'CHANGELOG.md'),
      'utf-8'
    )
    return NextResponse.json({ changelog })
  } catch {
    return NextResponse.json(
      { changelog: '' }
    )
  }
}
