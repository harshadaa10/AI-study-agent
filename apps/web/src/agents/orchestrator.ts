import { analyzerAgent } from './analyzerAgent'
import { goalTrackerAgent } from './goalTrackerAgent'
import { processNotesAgent } from './notesAgent'
import { plannerAgent } from './plannerAgent'
import { getRevisionQueue, reviewNote } from './revisionAgent'

export const TASK_TYPES = {
  GENERATE_PLAN: 'GENERATE_PLAN',
  PROCESS_NOTES: 'PROCESS_NOTES',
  ANALYZE_PERFORMANCE: 'ANALYZE_PERFORMANCE',
  GET_REVISION_QUEUE: 'GET_REVISION_QUEUE',
  REVIEW_NOTE: 'REVIEW_NOTE',
  TRACK_GOALS: 'TRACK_GOALS',
} as const

export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES]

export type AgentRequest = {
  userId: string
  taskType: TaskType
  payload: Record<string, unknown>
}

export type AgentResponse = {
  success: boolean
  data?: unknown
  error?: string
}

export async function orchestrate(request: AgentRequest): Promise<AgentResponse> {
  console.log(`[Orchestrator] Task: ${request.taskType} | User: ${request.userId}`)

  try {
    switch (request.taskType) {
      case TASK_TYPES.GENERATE_PLAN: {
        const { subjects, examDate, hoursPerDay } = request.payload as {
          subjects: string[]
          examDate: string
          hoursPerDay: number
        }

        return await plannerAgent(request.userId, { subjects, examDate, hoursPerDay })
      }

      case TASK_TYPES.PROCESS_NOTES: {
        const { materialId, pdfText } = request.payload as {
          materialId: string
          pdfText: string
        }

        return await processNotesAgent(request.userId, materialId, pdfText)
      }

      case TASK_TYPES.ANALYZE_PERFORMANCE:
        return await analyzerAgent(request.userId)

      case TASK_TYPES.GET_REVISION_QUEUE: {
        return await getRevisionQueue(request.userId)
      }

      case TASK_TYPES.REVIEW_NOTE: {
        const { noteId, quality } = request.payload as {
          noteId?: string
          quality?: number
        }

        if (!noteId || typeof quality !== 'number') {
          return {
            success: false,
            error: 'noteId and numeric quality are required for REVIEW_NOTE',
          }
        }

        return await reviewNote(request.userId, noteId, quality)
      }

      case TASK_TYPES.TRACK_GOALS:
        return await goalTrackerAgent(request.userId)

      default:
        return {
          success: false,
          error: `Unknown task type: ${request.taskType}`,
        }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('[Orchestrator] Error:', message)
    return { success: false, error: message }
  }
}
