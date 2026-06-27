import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";



export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [logsResult, tasksResult] = await Promise.all([
      supabase
        .from("performance_logs")
        .select(`weak_areas,readiness_score,next_actions,analysis_data,created_at`)
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("plan_tasks")
        .select("subject_id, status")
        .eq("user_id", userId),
    ]);

    if (logsResult.error) {
  console.error("Performance Logs Error:", logsResult.error);
  throw new Error(logsResult.error.message);
}

if (tasksResult.error) {
  console.error("Tasks Error:", tasksResult.error);
  throw new Error(tasksResult.error.message);
}
    return NextResponse.json({
      success: true,
      logs: logsResult.data ?? [],
      tasks: tasksResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

