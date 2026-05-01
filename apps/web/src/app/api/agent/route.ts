import { NextRequest, NextResponse } from 'next/server'
import { orchestrate, AgentRequest, TASK_TYPES } from '../../../agents/orchestrator'

export async function POST(request: NextRequest) {
  try {
    // Read the JSON body from the incoming request
    const body = await request.json() as Partial<AgentRequest>

    // Validate that the required fields are present
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!body.taskType) {
      return NextResponse.json(
        { success: false, error: 'taskType is required' },
        { status: 400 }
      )
    }

    // Check taskType is one of the valid values
    const validTypes = Object.values(TASK_TYPES)
    if (!validTypes.includes(body.taskType)) {
      return NextResponse.json(
        { success: false, error: `taskType must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Hand off to the Orchestrator and return its response
    const result = await orchestrate({
      userId:   body.userId,
      taskType: body.taskType,
      payload:  body.payload ?? {}
    })

    return NextResponse.json(result)

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}