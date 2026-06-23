import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
  }

  try {
    const supabase = getServiceSupabase();
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [logsResult, tasksResult] = await Promise.all([
      supabase
        .from("performance_logs")
        .select("log_type, weak_areas, readiness_score, next_actions, progress_snapshot, created_at")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true }),
      supabase
        .from("plan_tasks")
        .select("subject_name, status")
        .eq("user_id", userId),
    ]);

    const error = logsResult.error || tasksResult.error;
    if (error) throw new Error(error.message);

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

