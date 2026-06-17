import { createClient } from '@supabase/supabase-js'

export type SM2Input = {
  quality: number
  intervalDays?: number
  easeFactor?: number
  repetitions?: number
  reviewedAt?: Date
}

export type SM2Result = {
  intervalDays: number
  easeFactor: number
  repetitions: number
  nextReviewAt: string
}

type RevisionScheduleRow = {
  id: string
  note_id: string
  interval_days: number | null
  ease_factor: number | string | null
  repetitions: number | null
  next_review_at: string
  notes:
    | {
        id: string
        material_id: string | null
        content: string | null
        created_at: string
      }
    | {
        id: string
        material_id: string | null
        content: string | null
        created_at: string
      }[]
    | null
}

type NoteRow = {
  id: string
  material_id: string | null
  content: string | null
  created_at: string
}

export type RevisionQueueItem = {
  scheduleId: string
  noteId: string
  materialId: string | null
  content: string
  intervalDays: number
  easeFactor: number
  repetitions: number
  nextReviewAt: string
  noteCreatedAt: string
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function assertQuality(quality: number) {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new Error('quality must be an integer from 0 to 5')
  }
}

export function calculateSM2({
  quality,
  intervalDays = 0,
  easeFactor = 2.5,
  repetitions = 0,
  reviewedAt = new Date(),
}: SM2Input): SM2Result {
  assertQuality(quality)

  let nextIntervalDays = intervalDays
  let nextRepetitions = repetitions
  let nextEaseFactor =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  nextEaseFactor = Math.max(1.3, Number(nextEaseFactor.toFixed(2)))

  if (quality < 3) {
    nextRepetitions = 0
    nextIntervalDays = 1
  } else {
    nextRepetitions += 1

    if (nextRepetitions === 1) {
      nextIntervalDays = 1
    } else if (nextRepetitions === 2) {
      nextIntervalDays = 6
    } else {
      nextIntervalDays = Math.max(1, Math.round(intervalDays * nextEaseFactor))
    }
  }

  const nextReview = new Date(reviewedAt)
  nextReview.setDate(nextReview.getDate() + nextIntervalDays)

  return {
    intervalDays: nextIntervalDays,
    easeFactor: nextEaseFactor,
    repetitions: nextRepetitions,
    nextReviewAt: nextReview.toISOString(),
  }
}

async function ensureRevisionSchedules(userId: string) {
  const supabase = getServiceSupabase()

  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)

  if (notesError) {
    throw new Error(`notes query failed: ${notesError.message}`)
  }

  if (!notes || notes.length === 0) return

  const noteIds = notes.map((note: { id: string }) => note.id)

  const { data: schedules, error: scheduleError } = await supabase
    .from('revision_schedule')
    .select('note_id')
    .eq('user_id', userId)
    .in('note_id', noteIds)

  if (scheduleError) {
    throw new Error(`revision_schedule query failed: ${scheduleError.message}`)
  }

  const scheduledNoteIds = new Set(
    (schedules ?? []).map((schedule: { note_id: string }) => schedule.note_id)
  )
  const missingRows = noteIds
    .filter((noteId) => !scheduledNoteIds.has(noteId))
    .map((noteId) => ({
      user_id: userId,
      note_id: noteId,
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      next_review_at: new Date().toISOString(),
    }))

  if (missingRows.length === 0) return

  const { error: insertError } = await supabase
    .from('revision_schedule')
    .insert(missingRows)

  if (insertError) {
    throw new Error(`revision_schedule insert failed: ${insertError.message}`)
  }
}

function normalizeJoinedNote(row: RevisionScheduleRow): NoteRow | null {
  if (Array.isArray(row.notes)) {
    return row.notes[0] ?? null
  }

  return row.notes
}

export async function getRevisionQueue(userId: string): Promise<{
  success: boolean
  dueCount?: number
  queue?: RevisionQueueItem[]
  error?: string
}> {
  try {
    await ensureRevisionSchedules(userId)

    const supabase = getServiceSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('revision_schedule')
      .select(`
        id,
        note_id,
        interval_days,
        ease_factor,
        repetitions,
        next_review_at,
        notes (
          id,
          material_id,
          content,
          created_at
        )
      `)
      .eq('user_id', userId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true })

    if (error) {
      throw new Error(`revision_schedule query failed: ${error.message}`)
    }

    const queue = ((data ?? []) as RevisionScheduleRow[])
      .map((row) => {
        const note = normalizeJoinedNote(row)
        if (!note) return null

        return {
          scheduleId: row.id,
          noteId: row.note_id,
          materialId: note.material_id,
          content: note.content ?? '',
          intervalDays: row.interval_days ?? 0,
          easeFactor: Number(row.ease_factor ?? 2.5),
          repetitions: row.repetitions ?? 0,
          nextReviewAt: row.next_review_at,
          noteCreatedAt: note.created_at,
        }
      })
      .filter((item): item is RevisionQueueItem => item !== null)

    return {
      success: true,
      dueCount: queue.length,
      queue,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function reviewNote(
  userId: string,
  noteId: string,
  quality: number
): Promise<{
  success: boolean
  schedule?: SM2Result & { noteId: string; reviewedAt: string }
  error?: string
}> {
  try {
    assertQuality(quality)

    const supabase = getServiceSupabase()
    const reviewedAt = new Date()

    const { data: existing, error: existingError } = await supabase
      .from('revision_schedule')
      .select('interval_days, ease_factor, repetitions')
      .eq('user_id', userId)
      .eq('note_id', noteId)
      .maybeSingle()

    if (existingError) {
      throw new Error(`revision_schedule lookup failed: ${existingError.message}`)
    }

    const nextSchedule = calculateSM2({
      quality,
      intervalDays: existing?.interval_days ?? 0,
      easeFactor: Number(existing?.ease_factor ?? 2.5),
      repetitions: existing?.repetitions ?? 0,
      reviewedAt,
    })

    const { error: upsertError } = await supabase
      .from('revision_schedule')
      .upsert(
        {
          user_id: userId,
          note_id: noteId,
          interval_days: nextSchedule.intervalDays,
          ease_factor: nextSchedule.easeFactor,
          repetitions: nextSchedule.repetitions,
          last_reviewed_at: reviewedAt.toISOString(),
          next_review_at: nextSchedule.nextReviewAt,
          updated_at: reviewedAt.toISOString(),
        },
        { onConflict: 'user_id,note_id' }
      )

    if (upsertError) {
      throw new Error(`revision_schedule update failed: ${upsertError.message}`)
    }

    return {
      success: true,
      schedule: {
        noteId,
        reviewedAt: reviewedAt.toISOString(),
        ...nextSchedule,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
