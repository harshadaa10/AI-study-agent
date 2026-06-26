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
    const [plansResult, tasksResult] = await Promise.all([
      supabase
        .from("study_plans")
        .select("id, subject, exam_date, hours_per_day, plan_data, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("plan_tasks")
        .select( "id, plan_id, day_number, task, topic, subject_id, duration_mins, priority, status, created_at")
        .eq("user_id", userId)
        .order("day_number", { ascending: true }),
    ]);

    if (plansResult.error) {
  console.error("Study Plans Error:", plansResult.error);
  throw new Error(plansResult.error.message);
}

if (tasksResult.error) {
  console.error("Plan Tasks Error:", tasksResult.error);
  throw new Error(tasksResult.error.message);
}

    return NextResponse.json({
      success: true,
      plans: plansResult.data ?? [],
      tasks: tasksResult.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}

