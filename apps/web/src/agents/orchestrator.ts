// The Orchestrator is the entry point for ALL agent requests in your app

// ---- TASK TYPES ----
// These are the only valid task types your system accepts
// "as const" tells TypeScript these are fixed values, not just any string
import { processNotesAgent } from './notesAgent'
export const TASK_TYPES = {
  GENERATE_PLAN:        'GENERATE_PLAN',
  PROCESS_NOTES:        'PROCESS_NOTES',
  ANALYZE_PERFORMANCE:  'ANALYZE_PERFORMANCE',
  GET_REVISION_QUEUE:   'GET_REVISION_QUEUE',
  TRACK_GOALS:          'TRACK_GOALS',
} as const

// This creates a type from the values above
// TaskType can only be one of those 5 exact strings — TypeScript will
// catch a typo like "GENRATE_PLAN" at compile time before it causes bugs
export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES]


// ---- REQUEST & RESPONSE SHAPES ----
// Every request to the Orchestrator must have these fields
export type AgentRequest = {
  userId:   string                   // who is asking
  taskType: TaskType                 // what they want
  payload:  Record<string, unknown>  // extra data (varies per task)
}

// Every response from the Orchestrator has this shape
export type AgentResponse = {
  success: boolean    // did it work?
  data?:   unknown    // the result (only present on success)
  error?:  string     // the problem (only present on failure)
}


// ---- THE ORCHESTRATOR FUNCTION ----
export async function orchestrate(request: AgentRequest): Promise<AgentResponse> {

  console.log(`[Orchestrator] Task: ${request.taskType} | User: ${request.userId}`)

  try {
    switch (request.taskType) {

      case TASK_TYPES.GENERATE_PLAN:
        // Day 14 — Planner Agent plugs in here
        return {
          success: true,
          data: { message: 'Planner Agent coming on Day 14' }
        }

      case TASK_TYPES.PROCESS_NOTES:
        // Days 12–13 — Notes Agent plugs in here
        return {
          success: true,
          data: { message: 'Notes Agent coming on Days 12–13' }
        }

      case TASK_TYPES.ANALYZE_PERFORMANCE:
        // Day 15 — Analyzer Agent plugs in here
        return {
          success: true,
          data: { message: 'Analyzer Agent coming on Day 15' }
        }

      case TASK_TYPES.GET_REVISION_QUEUE:
        // Day 16 — Revision Agent plugs in here
        return {
          success: true,
          data: { message: 'Revision Agent coming on Day 16' }
        }

      case TASK_TYPES.TRACK_GOALS:
        // Day 17 — Goal Tracker Agent plugs in here
        return {
          success: true,
          data: { message: 'Goal Tracker coming on Day 17' }
        }
      case TASK_TYPES.PROCESS_NOTES:
        const { materialId, pdfText } = request.payload as {
        materialId: string
        pdfText: string
        }
       return await processNotesAgent(request.userId, materialId, pdfText)

      default:
        return {
          success: false,
          error: `Unknown task type: ${request.taskType}`
        }
    }

  } catch (error) {
    // Catch ANY unexpected error and return it cleanly
    // instead of crashing the whole server
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(`[Orchestrator] Error:`, message)
    return { success: false, error: message }
  }
}