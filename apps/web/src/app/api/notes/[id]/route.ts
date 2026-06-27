import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const { data: material, error: materialError } = await supabase
      .from("uploaded_materials")
      .select("id, file_name, file_url, created_at")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();
      
if (materialError || !material) {
  return NextResponse.json(
    {
      success: false,
      error: "Material not found",
    },
    { status: 404 }
  );
}

    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, content, created_at")
      .eq("material_id", params.id)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (notesError) throw new Error(notesError.message);

    return NextResponse.json({ success: true, material, notes: notes ?? [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

