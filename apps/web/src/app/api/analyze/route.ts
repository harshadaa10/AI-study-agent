import { NextRequest, NextResponse } from 'next/server'
import { orchestrate, TASK_TYPES } from '../../../agents/orchestrator'

export async function POST(request: NextRequest) {
  console.log('[API /analyze] Request received')

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const result = await orchestrate({
      userId,
      taskType: TASK_TYPES.ANALYZE_PERFORMANCE,
      payload: {},
    })

    return NextResponse.json(result)

  } catch (err) {
    console.error('[API /analyze] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}
