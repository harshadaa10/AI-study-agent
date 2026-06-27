import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "userId is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = supabaseAdmin;

    const { data, error } = await supabase
      .from("plan_tasks")
      .select("*")
      .eq("user_id", userId)
      .order("day_number", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      tasks: data ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Server error",
      },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as { userId?: string; status?: string };

    if (!body.userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    if (body.status !== "pending" && body.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "status must be pending or completed" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin;
    const { data, error } = await supabase
      .from("plan_tasks")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("user_id", body.userId)
      .select("id, status")
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, task: data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

