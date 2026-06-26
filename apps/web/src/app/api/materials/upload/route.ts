import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orchestrate, TASK_TYPES } from "@/agents/orchestrator";
import PDFParser from "pdf2json";

export const runtime = "nodejs";

const MATERIALS_BUCKET = "study-materials";

type PdfParserError = Error | { parserError: Error };
type PdfData = { Pages: { Texts: { R: { T: string }[] }[] }[] };

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function decodePdfText(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: PdfParserError) => {
      reject(errData instanceof Error ? errData : errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: PdfData) => {
      const text = pdfData.Pages.map((page) =>
        page.Texts.map((textItem) =>
          textItem.R.map((run) => decodePdfText(run.T)).join("")
        ).join(" ")
      ).join("\n");

      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = String(formData.get("userId") ?? "");
    const file = formData.get("file");

    if (!userId || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "userId and PDF file are required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Only PDF uploads are supported" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: buckets } = await supabase.storage.listBuckets();

    if (!buckets?.some((bucket) => bucket.name === MATERIALS_BUCKET)) {
      await supabase.storage.createBucket(MATERIALS_BUCKET, { public: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${userId}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
  console.error("Storage Upload Error:", uploadError);
  throw new Error(`Upload failed: ${uploadError.message}`);
}

    const { data: publicUrlData } = supabase.storage.from(MATERIALS_BUCKET).getPublicUrl(filePath);
    const { data: material, error: materialError } = await supabase
      .from("uploaded_materials")
      .insert({
        user_id: userId,
        file_name: file.name,
        file_url: publicUrlData.publicUrl,
      })
      .select("id, file_name, file_url")
      .single();

   if (materialError) {
  console.error("Material Insert Error:", materialError);
  throw new Error(`Material insert failed: ${materialError.message}`);
}

    const pdfText = await extractTextFromPDF(buffer);

    if (!pdfText || pdfText.trim().length < 20) {
      return NextResponse.json(
        { success: false, material, error: "Could not extract text from PDF" },
        { status: 400 }
      );
    }

    const result = (await orchestrate({
      userId,
      taskType: TASK_TYPES.PROCESS_NOTES,
      payload: { materialId: material.id, pdfText },
    })) as { success: boolean; notesCreated?: number; notes?: string; error?: string };

    return NextResponse.json({
      success: result.success,
      material,
      notesCreated: result.notesCreated,
      notes: result.notes,
      error: result.error,
    });
  } catch (error) {
    console.error("Materials Upload API Error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

