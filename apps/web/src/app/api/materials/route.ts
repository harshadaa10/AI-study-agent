import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from("uploaded_materials")
      .select("id, file_name, file_url, created_at, notes ( id )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      materials: (data ?? []).map((material) => ({
        id: material.id,
        file_name: material.file_name,
        file_url: material.file_url,
        created_at: material.created_at,
        notesCreated: Array.isArray(material.notes) ? material.notes.length : 0,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

