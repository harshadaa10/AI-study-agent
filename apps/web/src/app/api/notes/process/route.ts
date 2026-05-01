import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processNotesAgent } from "@/agents/notesAgent";
import PDFParser from "pdf2json";

export const runtime = "nodejs";

// ✅ PDF extraction function (MUST be outside POST)
function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      let text = "";

      pdfData.Pages.forEach((page: any) => {
        page.Texts.forEach((textItem: any) => {
          textItem.R.forEach((r: any) => {
            text += decodeURIComponent(r.T) + " ";
          });
        });
        text += "\n";
      });

      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, materialId } = body;

    if (!userId || !materialId) {
      return NextResponse.json(
        { success: false, error: "Missing userId or materialId" },
        { status: 400 }
      );
    }

    // ✅ Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ Fetch material
    const { data: materials, error } = await supabase
      .from("uploaded_materials")
      .select("file_url, user_id")
      .eq("id", materialId)
      .single();

    if (error || !materials) {
      return NextResponse.json(
        { success: false, error: "Material not found" },
        { status: 404 }
      );
    }

    const material = materials;

    // 🔐 Security check
    if (material.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ✅ Fetch PDF file
    const response = await fetch(material.file_url);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch PDF" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // ✅ Extract text
    const extractedText = await extractTextFromPDF(buffer);

    // (optional debug)
    console.log("TEXT LENGTH:", extractedText.length);
    console.log("TEXT PREVIEW:", extractedText.slice(0, 300));

    // 🤖 Send to AI agent
    const result = await processNotesAgent(
      userId,
      materialId,
      extractedText
    );

    return NextResponse.json({ success: true, result });

  } catch (err) {
    console.error("🔥 FULL ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}