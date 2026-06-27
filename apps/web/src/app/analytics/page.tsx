"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Log = { created_at: string; readiness_score: number | null; weak_areas: string[] | null; next_actions: string[] | null; progress_snapshot: { subjects?: { subject: string; completionPercentage: number }[] } | null };
type Task = { subject_name: string | null; status: string | null };

export default function AnalyticsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [logs, setLogs] = useState<Log[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [from, setFrom] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const response = await fetch(`/api/analytics?userId=${data.session.user.id}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.logs);
        setTasks(result.tasks);
      }
    });
  }, [router, supabase]);

  const filteredLogs = from ? logs.filter((log) => log.created_at >= from) : logs;
  const lineData = filteredLogs.filter((log) => typeof log.readiness_score === "number").map((log) => ({ date: new Date(log.created_at).toLocaleDateString(), readiness: log.readiness_score }));
  const latestSubjects = [...filteredLogs].reverse().find((log) => log.progress_snapshot?.subjects)?.progress_snapshot?.subjects ?? [];
  const taskGroups = Array.from(tasks.reduce((map, task) => {
    const subject = task.subject_name ?? "General";
    const row = map.get(subject) ?? { subject, completed: 0, skipped: 0 };
    if (task.status === "completed") row.completed += 1;
    else row.skipped += 1;
    map.set(subject, row);
    return map;
  }, new Map<string, { subject: string; completed: number; skipped: number }>()).values());
  const latestAnalysis = [...filteredLogs].reverse().find((log) => log.weak_areas?.length || log.next_actions?.length);

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">Exam readiness</p><h1 className="mt-2 text-3xl font-semibold">Analytics</h1></div>
          <div><Label htmlFor="from">Date range</Label><Input id="from" type="date" className="mt-2" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card><CardHeader><CardTitle>Performance score</CardTitle><CardDescription>Last 30 days.</CardDescription></CardHeader><CardContent className="h-72"><ResponsiveContainer><LineChart data={lineData}><CartesianGrid stroke="#d8d1c2" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="readiness" stroke="#3b6f6a" strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent></Card>
          <Card><CardHeader><CardTitle>Coverage per subject</CardTitle><CardDescription>Progress snapshots.</CardDescription></CardHeader><CardContent className="h-72"><ResponsiveContainer><RadarChart data={latestSubjects}><PolarGrid /><PolarAngleAxis dataKey="subject" /><Radar dataKey="completionPercentage" stroke="#3b6f6a" fill="#3b6f6a" fillOpacity={0.25} /></RadarChart></ResponsiveContainer></CardContent></Card>
          <Card className="lg:col-span-2"><CardHeader><CardTitle>Tasks completed vs skipped</CardTitle><CardDescription>Grouped by subject.</CardDescription></CardHeader><CardContent className="h-72"><ResponsiveContainer><BarChart data={taskGroups}><CartesianGrid stroke="#d8d1c2" /><XAxis dataKey="subject" /><YAxis /><Tooltip /><Legend /><Bar dataKey="completed" fill="#3b6f6a" /><Bar dataKey="skipped" fill="#e6b3a5" /></BarChart></ResponsiveContainer></CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-[#3b6f6a]" />Analyzer Agent insights</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><p className="text-sm font-semibold">weak_areas</p><div className="mt-2 flex flex-wrap gap-2">{latestAnalysis?.weak_areas?.map((area) => <span key={area} className="rounded-md border border-[#c8d2cb] px-2 py-1 text-xs text-[#2f615c]">{area}</span>) ?? <span className="text-sm text-[#68766f]">No weak areas yet.</span>}</div></div><div><p className="text-sm font-semibold">next_actions</p><ul className="mt-2 space-y-2 text-sm text-[#4f5f57]">{latestAnalysis?.next_actions?.map((action) => <li key={action}>{action}</li>) ?? <li>No next actions yet.</li>}</ul></div></CardContent></Card>
      </section>
    </main>
  );
}

