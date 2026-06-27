import { NextRequest, NextResponse } from 'next/server'
import { orchestrate, TASK_TYPES } from '../../../../agents/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string
      noteId?: string
      quality?: number
    }

    if (!body.userId || !body.noteId || typeof body.quality !== 'number') {
      return NextResponse.json(
        { success: false, error: 'userId, noteId, and numeric quality are required' },
        { status: 400 }
      )
    }

    const result = await orchestrate({
      userId: body.userId,
      taskType: TASK_TYPES.REVIEW_NOTE,
      payload: {
        noteId: body.noteId,
        quality: body.quality,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    )
  }
}
