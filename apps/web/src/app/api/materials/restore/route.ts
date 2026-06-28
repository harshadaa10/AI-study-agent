import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { userId, materialId } = await req.json();
 await supabaseAdmin
    .from("materials")
    .update({ deleted_at: null })
    .eq("id", materialId)
    .eq("user_id", userId);

  return Response.json({ success: true });
}