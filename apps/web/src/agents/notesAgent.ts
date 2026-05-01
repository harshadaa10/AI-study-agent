import fetch from "node-fetch"
import { createClient } from "@supabase/supabase-js"

export async function processNotesAgent(
  userId: string,
  materialId: string,
  text: string
) {
  try {
    if (!text || text.trim().length < 20) {
      return {
        success: false,
        notesCreated: 0,
        error: "Text too small to process",
      }
    }

    // Limit text to avoid token overflow
    const inputText = text.slice(0, 3000)

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
            content: "You are an expert note-taking assistant. Convert text into clean, structured study notes with headings and bullet points.",
          },
          {
            role: "user",
            content: `Convert this into structured notes:\n\n${inputText}`,
          },
        ],
      }),
    })

    const data: any = await response.json()

    if (!response.ok) {
      console.error("AI ERROR:", data)
      return { success: false, notesCreated: 0, error: "AI request failed" }
    }

    const notes = data.choices?.[0]?.message?.content

    if (!notes) {
      return { success: false, notesCreated: 0, error: "No notes generated" }
    }

    // ✅ Save to Supabase notes table
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: dbError } = await supabase
      .from("notes")
      .insert({
        user_id:     userId,
        material_id: materialId,
        content:     notes,
      })

    if (dbError) {
      console.error("[NotesAgent] DB insert error:", dbError)
      return {
        success: false,
        notesCreated: 0,
        error: `Database save failed: ${dbError.message}`,
      }
    }

    console.log("[NotesAgent] ✅ Notes saved to database successfully")

    return {
      success: true,
      notesCreated: 1,
      notes,
    }

  } catch (err) {
    console.error("AGENT ERROR:", err)
    return {
      success: false,
      notesCreated: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}