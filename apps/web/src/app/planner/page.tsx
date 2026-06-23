"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Task = { id: string; day_number: number | null; task: string | null; topic: string | null; subject_name: string | null; duration_mins: number | null; priority: string | null; status: string | null };
type Plan = { id: string; subject: string | null; exam_date: string | null; hours_per_day: number | null; plan_data: { overview?: string; examTips?: string[] } | null };

export default function PlannerPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userId, setUserId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function loadPlanner(nextUserId: string) {
    const response = await fetch(`/api/planner?userId=${nextUserId}`);
    const result = await response.json();
    if (result.success) {
      setTasks(result.tasks);
      setPlans(result.plans);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
      await loadPlanner(data.session.user.id);
    });
  }, [router, supabase]);

  async function markComplete(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: task.status === "completed" ? "pending" : "completed" }),
    });
    await loadPlanner(userId);
  }

  async function regeneratePlan() {
    const latest = plans[0];
    if (!latest?.subject || !latest.exam_date || !latest.hours_per_day) return;
    setIsRegenerating(true);
    await fetch("/api/plans/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subjects: latest.subject.split(",").map((subject) => subject.trim()), examDate: latest.exam_date, hoursPerDay: latest.hours_per_day }),
    });
    setIsRegenerating(false);
    await loadPlanner(userId);
  }

  const currentPlan = plans[0];
  const days = Array.from({ length: 7 }, (_, index) => index + 1);
  const completedDays = new Set(tasks.filter((task) => task.status === "completed").map((task) => task.day_number));

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">Study plan</p><h1 className="mt-2 text-3xl font-semibold">Planner calendar</h1></div>
          <Button type="button" onClick={regeneratePlan} disabled={isRegenerating || !currentPlan}>{isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}Regenerate Plan</Button>
        </header>

        {currentPlan ? <Card><CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_260px]"><p className="text-sm leading-6 text-[#4f5f57]">{currentPlan.plan_data?.overview ?? "Study strategy"}</p><div className="text-sm text-[#68766f]"><p>subjects {currentPlan.subject}</p><p>examDate {currentPlan.exam_date}</p><p>hoursPerDay {currentPlan.hours_per_day}</p></div></CardContent></Card> : null}

        <div className="grid gap-3 md:grid-cols-7">
          {days.map((day) => (
            <Card key={day} className={completedDays.has(day) ? "border-[#a9cdb9]" : ""}>
              <CardHeader className="p-4 pb-0"><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4 text-[#3b6f6a]" />Day {day}</CardTitle></CardHeader>
              <CardContent className="space-y-2 p-4">
                {tasks.filter((task) => task.day_number === day).map((task) => (
                  <button key={task.id} type="button" onClick={() => setSelectedTask(task)} className={`w-full rounded-md border px-2 py-2 text-left text-xs ${task.status === "completed" ? "border-[#a9cdb9] bg-[#eef8f1]" : "border-[#d8d1c2] bg-white"}`}>
                    <span className="block font-semibold">{task.subject_name ?? "Subject"}</span>
                    <span className="mt-1 block text-[#68766f]">{task.topic ?? task.task}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTask ? <Card><CardHeader><CardTitle>{selectedTask.topic ?? selectedTask.task}</CardTitle><CardDescription>{selectedTask.subject_name} · {selectedTask.duration_mins ?? 0} min · {selectedTask.priority}</CardDescription></CardHeader><CardContent><Button type="button" variant="outline" onClick={() => markComplete(selectedTask)}>{selectedTask.status === "completed" ? "Mark pending" : "Mark complete"}</Button></CardContent></Card> : null}

        <Card><CardHeader><CardTitle>Monthly summary</CardTitle><CardDescription>Days with completed sessions.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{days.map((day) => <span key={day} className={`rounded-md border px-3 py-2 text-sm ${completedDays.has(day) ? "border-[#a9cdb9] bg-[#eef8f1] text-[#28533a]" : "border-[#d8d1c2] text-[#68766f]"}`}>Day {day}</span>)}</CardContent></Card>
      </section>
    </main>
  );
}

