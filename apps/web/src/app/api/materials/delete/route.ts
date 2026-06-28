import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(req: Request) {
  const { userId, materialId } = await req.json();

  await supabaseAdmin
    .from("materials")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", materialId)
    .eq("user_id", userId);

  return NextResponse.json({ success: true });
}