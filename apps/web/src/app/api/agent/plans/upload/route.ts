import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "PDF upload is not implemented on this route yet. Create an uploaded_materials row and call POST /api/notes/process with its materialId."
    },
    { status: 501 }
  );
}
