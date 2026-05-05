import { NextRequest, NextResponse } from 'next/server'
import { plannerAgent, PlannerInput } from '../../../../agents/plannerAgent'

export async function POST(request: NextRequest) {
  console.log('[API /plans/generate] Request received')

  try {
    const body = await request.json()
    const { userId, subject, examDate, hoursPerDay } = body

    // ---- VALIDATION ----
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!subject || subject.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'subject is required (min 2 characters)' },
        { status: 400 }
      )
    }

    if (!examDate) {
      return NextResponse.json(
        { success: false, error: 'examDate is required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(examDate)) {
      return NextResponse.json(
        { success: false, error: 'examDate must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Make sure exam is in the future
    const examDateTime = new Date(examDate)
    if (examDateTime <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'examDate must be in the future' },
        { status: 400 }
      )
    }

    if (!hoursPerDay || hoursPerDay < 1 || hoursPerDay > 12) {
      return NextResponse.json(
        { success: false, error: 'hoursPerDay must be between 1 and 12' },
        { status: 400 }
      )
    }

    const input: PlannerInput = {
      subject:     subject.trim(),
      examDate,
      hoursPerDay: Number(hoursPerDay),
    }

    console.log('[API] Calling plannerAgent with:', input)

    const result = await plannerAgent(userId, input)

    return NextResponse.json(result)

  } catch (err) {
    console.error('[API /plans/generate] Error:', err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    )
  }
}