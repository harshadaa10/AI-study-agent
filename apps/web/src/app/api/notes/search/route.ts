import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch } from '../../../../utils/search'

export async function POST(request: NextRequest) {
  console.log('[API /notes/search] Request received')

  try {
    const body = await request.json()
    const { query, userId, limit } = body

    if (!query || !userId) {
      return NextResponse.json(
        { success: false, error: 'query and userId are required' },
        { status: 400 }
      )
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Query too short — minimum 3 characters' },
        { status: 400 }
      )
    }

    const matchLimit =
      typeof limit === 'number' && Number.isInteger(limit)
        ? Math.min(Math.max(limit, 1), 20)
        : 5

    const results = await semanticSearch(query, userId, matchLimit)

    return NextResponse.json({
      success: true,
      query,
      resultsCount: results.length,
      results,
    })

  } catch (err) {
    console.error('[API /notes/search] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Search failed' },
      { status: 500 }
    )
  }
}
