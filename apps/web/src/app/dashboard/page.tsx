"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BarChart3, BookOpen, CheckCircle2, ClipboardList, Loader2, LogOut, Repeat2, Search, Target, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Task = {
  id: string;
  task: string | null;
  topic: string | null;
  subject_name: string | null;
  duration_mins: number | null;
  priority: string | null;
  status: string | null;
};

type RevisionItem = {
  id: string;
  note_id: string;
  interval_days: number | null;
  ease_factor: number | null;
  repetitions: number | null;
  next_review_at: string;
  notes: { content: string | null } | { content: string | null }[] | null;
};

type DashboardData = {
  metrics: {
    tasksToday: number;
    streakDays: number;
    readinessScore: number | null;
    completionPercentage: number | null;
  };
  tasks: Task[];
  revisionQueue: RevisionItem[];
  analysis: { weak_areas: string[] | null; next_actions: string[] | null; readiness_score: number | null } | null;
};

function getNoteText(item: RevisionItem) {
  const note = Array.isArray(item.notes) ? item.notes[0] : item.notes;
  return note?.content ?? "Generated note";
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function loadDashboard(userId: string) {
    const response = await fetch(`/api/dashboard?userId=${userId}`);
    const result = await response.json();
    if (result.success) setData(result.data);
    setIsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data: authData } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!authData.session) {
        router.replace("/login");
        return;
      }

      setSession(authData.session);
      await loadDashboard(authData.session.user.id);
    }

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        router.replace("/login");
        return;
      }
      setSession(nextSession);
      loadDashboard(nextSession.user.id);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  useEffect(() => {
    if (!session?.user.id) return;

    const channel = supabase
      .channel("dashboard-plan-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_tasks", filter: `user_id=eq.${session.user.id}` }, () => {
        loadDashboard(session.user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user.id, supabase]);

  async function toggleTask(task: Task) {
    if (!session) return;
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    setData((current) => current ? {
      ...current,
      tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: nextStatus } : item),
    } : current);

    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, status: nextStatus }),
    });
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] text-[#17201a]"><Loader2 className="h-6 w-6 animate-spin text-[#3b6f6a]" /></main>;
  }

  const metricCards: { label: string; value: string | number; Icon: LucideIcon }[] = [
    { label: "Tasks Today", value: data?.metrics.tasksToday ?? 0, Icon: ClipboardList },
    { label: "Streak", value: `${data?.metrics.streakDays ?? 0} days`, Icon: CheckCircle2 },
    { label: "Overall Readiness", value: data?.metrics.readinessScore == null ? "No score" : `${data.metrics.readinessScore}%`, Icon: BarChart3 },
  ];
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">AI Study Agent</p>
            <h1 className="mt-2 text-3xl font-semibold">Study dashboard</h1>
            <p className="mt-1 text-sm text-[#68766f]">{session?.user.email ?? "Authenticated student"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/onboarding"><Target className="h-4 w-4" />Onboarding</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/upload"><Upload className="h-4 w-4" />Upload</Link></Button>
            <Button type="button" variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut}>{isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}Log out</Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {metricCards.map(({ label, value, Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center justify-between p-5">
                <div><p className="text-sm text-[#68766f]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
                <Icon className="h-5 w-5 text-[#3b6f6a]" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s study plan</CardTitle>
              <CardDescription>Task status updates live through Supabase Realtime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data?.tasks.length ? data.tasks.map((task) => (
                <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-[#d8d1c2] px-3 py-3">
                  <input className="mt-1 h-4 w-4" type="checkbox" checked={task.status === "completed"} onChange={() => toggleTask(task)} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{task.topic ?? task.task ?? "Study task"}</span>
                    <span className="mt-1 block text-xs text-[#68766f]">{task.subject_name ?? "Subject"} · {task.duration_mins ?? 0} min · {task.priority ?? "medium"}</span>
                  </span>
                </label>
              )) : <p className="text-sm text-[#68766f]">No study plan tasks yet.</p>}
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revision queue</CardTitle>
                <CardDescription>Notes due for review today.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data?.revisionQueue.length ? data.revisionQueue.map((item) => (
                  <div key={item.id} className="rounded-md border border-[#d8d1c2] px-3 py-3 text-sm">
                    <p className="line-clamp-3 text-[#4f5f57]">{getNoteText(item)}</p>
                    <p className="mt-2 text-xs text-[#68766f]">intervalDays {item.interval_days ?? 0} · easeFactor {item.ease_factor ?? 2.5} · repetitions {item.repetitions ?? 0}</p>
                  </div>
                )) : <p className="text-sm text-[#68766f]">No due notes.</p>}
                <Button asChild variant="outline" className="w-full"><Link href="/revision"><Repeat2 className="h-4 w-4" />Open revision</Link></Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weak areas</CardTitle>
                <CardDescription>From the Analyzer Agent.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data?.analysis?.weak_areas?.length ? data.analysis.weak_areas.map((area) => <span key={area} className="rounded-md border border-[#c8d2cb] px-2 py-1 text-xs text-[#2f615c]">{area}</span>) : <p className="text-sm text-[#68766f]">No analysis yet.</p>}
              </CardContent>
            </Card>
          </aside>
        </div>

        <nav className="grid gap-3 sm:grid-cols-4">
          <Button asChild variant="outline"><Link href="/notes"><Search className="h-4 w-4" />Generated notes</Link></Button>
          <Button asChild variant="outline"><Link href="/planner"><BookOpen className="h-4 w-4" />Planner</Link></Button>
          <Button asChild variant="outline"><Link href="/analytics"><BarChart3 className="h-4 w-4" />Analytics</Link></Button>
          <Button asChild variant="outline"><Link href="/revision"><Repeat2 className="h-4 w-4" />Revision</Link></Button>
        </nav>
      </section>
    </main>
  );
}





