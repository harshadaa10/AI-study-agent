"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { BarChart3, BookOpen, CheckCircle2, ClipboardList, Loader2, LogOut, Repeat2, Search, Target, Upload, User, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Task = {
  id: string;
  task: string | null;
  topic: string | null;
  subject_id: string | null;
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] text-[#17201a]">
        <div className="flex items-center gap-3 rounded-lg border border-[#d8d1c2] bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-[#3b6f6a]" />
          Loading study workspace
        </div>
      </main>
    );
  }

  const metricCards: { label: string; value: string | number; Icon: LucideIcon }[] = [
    { label: "Tasks Today", value: data?.metrics.tasksToday ?? 0, Icon: ClipboardList },
    { label: "Streak", value: `${data?.metrics.streakDays ?? 0} days`, Icon: CheckCircle2 },
    { label: "Overall Readiness", value: data?.metrics.readinessScore == null ? "No score" : `${data.metrics.readinessScore}%`, Icon: BarChart3 },
  ];
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#17201a]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <header className="overflow-hidden rounded-lg border border-[#d8d1c2] bg-white shadow-sm">
          <div className="flex flex-col gap-6 border-b border-[#e7dfd2] px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-7">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">AI Study Agent</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17201a]">Study dashboard</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4f5f57]">
                Plan, learn, revise, and track exam readiness in one focused workspace.
              </p>
              <p className="mt-3 text-sm text-[#68766f]">{session?.user.email ?? "Authenticated student"}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <Button asChild variant="outline" size="sm" className="bg-[#f7f3ec]">
                <Link href="/onboarding"><Target className="h-4 w-4" />Onboarding</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-[#f7f3ec]">
                <Link href="/upload"><Upload className="h-4 w-4" />Upload</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="bg-[#f7f3ec]">
                <Link href="/profile"><User className="h-4 w-4" />Profile</Link>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleSignOut} disabled={isSigningOut} className="bg-[#f7f3ec]">
                {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}Log out
              </Button>
            </div>
          </div>
          <div className="grid gap-0 sm:grid-cols-3">
            {metricCards.map(({ label, value, Icon }) => (
              <div key={label} className="flex items-center justify-between border-b border-[#e7dfd2] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-6">
                <div>
                  <p className="text-sm text-[#68766f]">{label}</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-[#c8d2cb] bg-[#eef8f1] text-[#2f615c]">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-[#eee6da] p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">Today&apos;s study plan</CardTitle>
                  <CardDescription className="mt-2">Task status updates live through Supabase Realtime.</CardDescription>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#c8d2cb] bg-[#f7f3ec] px-3 py-2 text-sm font-semibold text-[#2f615c]">
                  <ClipboardList className="h-4 w-4" />
                  {data?.metrics.tasksToday ?? 0} next actions
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data?.tasks.length ? (
                <div className="divide-y divide-[#eee6da]">
                  {data.tasks.map((task) => (
                    <label key={task.id} className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 px-5 py-4 transition hover:bg-[#fbf8f1] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:px-6">
                      <input className="mt-1 h-4 w-4 rounded border-[#c8d2cb] accent-[#3b6f6a] sm:mt-0" type="checkbox" checked={task.status === "completed"} onChange={() => toggleTask(task)} aria-label={`Mark ${task.topic ?? task.task ?? "study task"} as ${task.status === "completed" ? "pending" : "completed"}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#17201a] group-hover:text-[#2f615c]">{task.topic ?? task.task ?? "Study task"}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#68766f]">
                          <span>{task.subject_id ?? "Subject"}</span>
                          <span aria-hidden="true">/</span>
                          <span>{task.duration_mins ?? 0} min</span>
                          <span aria-hidden="true">/</span>
                          <span>{task.priority ?? "medium"} priority</span>
                        </span>
                      </span>
                      <span className="col-start-2 w-fit rounded-md border border-[#d8d1c2] bg-white px-2.5 py-1 text-xs font-semibold text-[#4f5f57] sm:col-start-auto">
                        {task.status ?? "pending"}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center sm:px-6">
                  <ClipboardList className="mx-auto h-8 w-8 text-[#3b6f6a]" />
                  <p className="mt-3 text-sm font-semibold">No study plan tasks yet.</p>
                  <p className="mt-1 text-sm text-[#68766f]">Generate a plan to fill today&apos;s queue.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <aside className="grid gap-4">
            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[#eee6da] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">Revision queue</CardTitle>
                    <CardDescription className="mt-2">Notes due for review today.</CardDescription>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#c8d2cb] bg-[#eef8f1] text-[#2f615c]">
                    <Repeat2 className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                {data?.revisionQueue.length ? data.revisionQueue.map((item) => (
                  <div key={item.id} className="rounded-md border border-[#d8d1c2] bg-[#fbf8f1] px-3 py-3 text-sm">
                    <p className="line-clamp-3 leading-6 text-[#4f5f57]">{getNoteText(item)}</p>
                    <p className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#68766f]">
                      <span>intervalDays {item.interval_days ?? 0}</span>
                      <span aria-hidden="true">/</span>
                      <span>easeFactor {item.ease_factor ?? 2.5}</span>
                      <span aria-hidden="true">/</span>
                      <span>repetitions {item.repetitions ?? 0}</span>
                    </p>
                  </div>
                )) : (
                  <div className="rounded-md border border-dashed border-[#c8d2cb] bg-[#fbf8f1] px-3 py-6 text-center">
                    <p className="text-sm font-semibold">No due notes.</p>
                    <p className="mt-1 text-sm text-[#68766f]">Your revision queue is clear.</p>
                  </div>
                )}
                <Button asChild variant="outline" className="w-full bg-white">
                  <Link href="/revision"><Repeat2 className="h-4 w-4" />Open revision</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="border-b border-[#eee6da] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">Weak areas</CardTitle>
                    <CardDescription className="mt-2">From the Analyzer Agent.</CardDescription>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#c8d2cb] bg-[#eef8f1] text-[#2f615c]">
                    <BarChart3 className="h-5 w-5" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {data?.analysis?.weak_areas?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {data.analysis.weak_areas.map((area) => <span key={area} className="rounded-md border border-[#c8d2cb] bg-[#eef8f1] px-2.5 py-1.5 text-xs font-semibold text-[#2f615c]">{area}</span>)}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-[#c8d2cb] bg-[#fbf8f1] px-3 py-6 text-center text-sm text-[#68766f]">No analysis yet.</p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        <nav className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Study workspace">
          <Button asChild variant="outline" className="h-12 justify-start bg-white px-4"><Link href="/notes"><Search className="h-4 w-4" />Generated notes</Link></Button>
          <Button asChild variant="outline" className="h-12 justify-start bg-white px-4"><Link href="/planner"><BookOpen className="h-4 w-4" />Planner</Link></Button>
          <Button asChild variant="outline" className="h-12 justify-start bg-white px-4"><Link href="/analytics"><BarChart3 className="h-4 w-4" />Analytics</Link></Button>
          <Button asChild variant="outline" className="h-12 justify-start bg-white px-4"><Link href="/revision"><Repeat2 className="h-4 w-4" />Revision</Link></Button>
        </nav>
      </section>
    </main>
  );
}





