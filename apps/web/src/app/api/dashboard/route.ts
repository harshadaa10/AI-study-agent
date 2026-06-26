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
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const [tasksResult, revisionResult, analysisResult] = await Promise.all([
      supabase
        .from("plan_tasks")
        .select("id, task, topic, subject_id, duration_mins, priority, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("revision_schedule")
        .select("id, note_id, interval_days, ease_factor, repetitions, next_review_at, notes ( content )")
        .eq("user_id", userId)
        .lte("next_review_at", today.toISOString())
        .order("next_review_at", { ascending: true })
        .limit(5),
      supabase
        .from("performance_logs")
        .select("weak_areas, readiness_score, next_actions, created_at")
        .eq("user_id", userId)
        .not("readiness_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      
    ]);

   if (tasksResult.error) {
  console.error("Tasks Error:", tasksResult.error);
  throw new Error(tasksResult.error.message);
}

if (revisionResult.error) {
  console.error("Revision Error:", revisionResult.error);
  throw new Error(revisionResult.error.message);
}

if (analysisResult.error) {
  console.error("Analysis Error:", analysisResult.error);
  throw new Error(analysisResult.error.message);
}


    const tasks = tasksResult.data ?? [];
    const completedTasks = tasks.filter((task) => task.status === "completed").length;
    const readinessScore = analysisResult.data?.readiness_score ?? null;
   

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          tasksToday: tasks.filter((task) => task.status !== "completed").length,
          streakDays: completedTasks > 0 ? 1 : 0,
          readinessScore,
          completionPercentage: null,
        },
        tasks,
        revisionQueue: revisionResult.data ?? [],
        analysis: analysisResult.data ?? null,
      },
    });
  } catch (error) {
  console.error("Dashboard API Error:", error);

  return NextResponse.json(
    {
      success: false,
      error: error instanceof Error ? error.message : "Server error",
    },
    { status: 500 }
  );
}
  }


