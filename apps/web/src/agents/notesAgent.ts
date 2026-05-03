import { createClient } from "@supabase/supabase-js"
import { generateEmbedding } from '../utils/embeddings'

// ---- CHUNKING FUNCTION ----
function splitIntoChunks(text: string, chunkSize = 2000, overlap = 200): string[] {
  const trimmed = text.trim()

  // If text is shorter than chunkSize, just return it as one chunk
  if (trimmed.length <= chunkSize) {
    return trimmed.length > 20 ? [trimmed] : []
  }

  const chunks: string[] = []
  let start = 0

  while (start < trimmed.length) {
    const end = Math.min(start + chunkSize, trimmed.length)
    const chunk = trimmed.slice(start, end).trim()
    if (chunk.length > 20) {
      chunks.push(chunk)
    }
    if (end === trimmed.length) break  // reached the end — stop
    start = end - overlap
  }

  return chunks
}

// ---- AI CALL FOR ONE CHUNK ----
// Uses global fetch (built into Next.js 14 — no import needed)
async function processChunk(chunk: string): Promise<string | null> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are an expert study notes generator. Always follow the exact output format requested.",
          },
          {
            role: "user",
            content: `Given this text chunk, generate:
1. Exactly 3 concise bullet points summarising the key ideas
2. One detailed explanation paragraph
3. One exam-style answer a student could write

Text chunk:
"""
${chunk}
"""

Respond in EXACTLY this format, with these exact headings:

BULLET POINTS:
- point 1
- point 2
- point 3

EXPLANATION:
[write your explanation paragraph here]

EXAM ANSWER:
[write your exam-style answer here]`,
          },
        ],
      }),
    })

    const data: any = await response.json()

    if (!response.ok) {
      console.error("[NotesAgent] AI error:", JSON.stringify(data))
      return null
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error("[NotesAgent] AI returned empty content")
      return null
    }

    return content

  } catch (err) {
    console.error("[NotesAgent] processChunk threw:", err)
    return null
  }
}


// ---- MAIN AGENT FUNCTION ----
export async function processNotesAgent(
  userId: string,
  materialId: string,
  text: string
) {
  try {
    console.log("[NotesAgent] Starting — text length:", text.length)

    if (!text || text.trim().length < 20) {
      return { success: false, notesCreated: 0, error: "Text too small to process" }
    }

    // 1. Split into overlapping chunks
    const chunks = splitIntoChunks(text)
    console.log(`[NotesAgent] Split into ${chunks.length} chunk(s)`)
    console.log(`[NotesAgent] Chunk 0 length:`, chunks[0]?.length ?? 'NO CHUNKS')

    // 2. Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let notesCreated = 0
    const allNotes: string[] = []

    // 3. Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[NotesAgent] Processing chunk ${i + 1}/${chunks.length}...`)

      const notes = await processChunk(chunks[i])

      if (!notes) {
        console.warn(`[NotesAgent] Chunk ${i + 1} returned no notes — skipping`)
        continue
      }

      console.log(`[NotesAgent] Chunk ${i + 1} AI response received, saving to DB...`)

      // 4. Save to Supabase
      const { error: dbError } = await supabase
        .from("notes")
        .insert({
          user_id:     userId,
          material_id: materialId,
          content:     notes,
        })

      if (dbError) {
        console.error(`[NotesAgent] DB insert failed for chunk ${i + 1}:`, dbError.message)
        continue
      }

      allNotes.push(notes)
      notesCreated++
      console.log(`[NotesAgent] ✅ Chunk ${i + 1} saved to DB`)
      // ✅ Generate and save embedding for this note
try {
  console.log(`[NotesAgent] Generating embedding for chunk ${i + 1}...`)

  // Get the note's ID that was just inserted
  const { data: savedNote } = await supabase
    .from('notes')
    .select('id')
    .eq('user_id', userId)
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (savedNote) {
    const embedding = await generateEmbedding(notes)

    const { error: embeddingError } = await supabase
      .from('notes_embeddings')
      .insert({
        note_id:   savedNote.id,
        embedding: JSON.stringify(embedding),  // pgvector accepts JSON array format
      })

    if (embeddingError) {
      console.error(`[NotesAgent] Embedding save failed:`, embeddingError.message)
    } else {
      console.log(`[NotesAgent] ✅ Embedding saved for chunk ${i + 1}`)
    }
  }
} catch (embErr) {
  // Don't fail the whole request if embedding fails
  console.error(`[NotesAgent] Embedding generation failed:`, embErr)
}

      // 5. Delay between chunks to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600))
      }
    }

    if (notesCreated === 0) {
      return { success: false, notesCreated: 0, error: "No chunks were successfully processed" }
    }

    console.log(`[NotesAgent] ✅ Done — ${notesCreated}/${chunks.length} chunks saved`)

    return {
      success: true,
      notesCreated,
      notes: allNotes.join("\n\n---\n\n"),
    }

  } catch (err) {
    console.error("[NotesAgent] Fatal error:", err)
    return {
      success: false,
      notesCreated: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}