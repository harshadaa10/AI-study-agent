import { NextRequest, NextResponse } from 'next/server'
import { orchestrate, TASK_TYPES } from '../../../../agents/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { userId?: string }

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const result = await orchestrate({
      userId: body.userId,
      taskType: TASK_TYPES.TRACK_GOALS,
      payload: {},
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
