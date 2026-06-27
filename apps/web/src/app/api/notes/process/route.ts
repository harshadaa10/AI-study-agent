import { NextRequest, NextResponse } from "next/server"
import { orchestrate, TASK_TYPES } from "@/agents/orchestrator"
import PDFParser from "pdf2json"
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs"

type PdfParserError = Error | {
  parserError: Error
}

type PdfTextRun = {
  T: string
}

type PdfTextItem = {
  R: PdfTextRun[]
}

type PdfPage = {
  Texts: PdfTextItem[]
}

type PdfData = {
  Pages: PdfPage[]
}

type ProcessNotesBody = {
  userId?: string
  materialId?: string
}

// ---- PDF EXTRACTION ----
function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser()

    pdfParser.on("pdfParser_dataError", (errData: PdfParserError) => {
      reject(errData instanceof Error ? errData : errData.parserError)
    })

    pdfParser.on("pdfParser_dataReady", (pdfData: PdfData) => {
      let text = ""
      pdfData.Pages.forEach((page) => {
        page.Texts.forEach((textItem) => {
          textItem.R.forEach((r) => {
            text += decodeURIComponent(r.T) + " "
          })
        })
        text += "\n"
      })
      resolve(text)
    })

    pdfParser.parseBuffer(buffer)
  })
}


// ---- API ROUTE ----
export async function POST(request: NextRequest) {
  console.log("[API /notes/process] Request received")

  try {
    const body = await request.json() as ProcessNotesBody
    console.log("[API /notes/process] Body:", body)

    const { userId, materialId } = body

    if (!userId || !materialId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or materialId" },
        { status: 400 }
      )
    }

  

    // Fetch material record
    const { data: material, error: materialError } = await supabaseAdmin
      .from("uploaded_materials")
      .select("file_url, user_id")
      .eq("id", materialId)
      .single()

    if (materialError || !material) {
      console.error("[API] Material fetch error:", materialError)
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      )
    }

    console.log("[API] Material found:", material.file_url)

    // Security check
    if (material.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Download PDF
    console.log("[API] Downloading PDF from:", material.file_url)
    const pdfResponse = await fetch(material.file_url)

    if (!pdfResponse.ok) {
      console.error("[API] PDF download failed:", pdfResponse.status)
      return NextResponse.json(
        { success: false, error: "Failed to fetch PDF" },
        { status: 500 }
      )
    }

    const buffer = Buffer.from(await pdfResponse.arrayBuffer())
    console.log("[API] PDF downloaded, size:", buffer.length, "bytes")

    // Extract text
    console.log("[API] Extracting text from PDF...")
    const extractedText = await extractTextFromPDF(buffer)
    console.log("[API] TEXT LENGTH:", extractedText.length)
    console.log("[API] TEXT PREVIEW:", extractedText.slice(0, 300))

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { success: false, error: "Could not extract text from PDF" },
        { status: 400 }
      )
    }

    // Call Notes Agent through the Orchestrator, matching the other API handlers.
    console.log("[API] Calling orchestrator notes flow...")
    const result = await orchestrate({
      userId,
      taskType: TASK_TYPES.PROCESS_NOTES,
      payload: {
        materialId,
        pdfText: extractedText,
      },
    })
    console.log("[API] orchestrator notes result:", JSON.stringify(result, null, 2))

    return NextResponse.json(result)

  } catch (err) {
    console.error("[API] 🔥 FULL ERROR:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
