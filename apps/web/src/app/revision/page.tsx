"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type QueueItem = {
  noteId: string;
  content: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  nextReviewAt: string;
};

export default function RevisionPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userId, setUserId] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);

  async function loadQueue(nextUserId: string) {
    const response = await fetch("/api/revision/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: nextUserId }),
    });
    const result = await response.json();
    if (result.success) setQueue(result.queue ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
      await loadQueue(data.session.user.id);
    });
  }, [router, supabase]);

  async function review(quality: number) {
    const item = queue[index];
    if (!item) return;
    setIsReviewing(true);
    await fetch("/api/revision/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, noteId: item.noteId, quality }),
    });
    setIsReviewing(false);
    setIsFlipped(false);
    setIndex((current) => current + 1);
  }

  const item = queue[index];

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f3ec] text-[#17201a]"><Loader2 className="h-6 w-6 animate-spin text-[#3b6f6a]" /></main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">Revision queue</p>
          <h1 className="mt-2 text-3xl font-semibold">Review due notes</h1>
          <p className="mt-1 text-sm text-[#68766f]">dueCount {Math.max(queue.length - index, 0)}</p>
        </header>

        {!item ? (
          <Card><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><CheckCircle2 className="h-10 w-10 text-[#28533a]" /><p className="text-lg font-semibold">All due cards reviewed.</p><p className="text-sm text-[#68766f]">Your revision queue is clear for now.</p></CardContent></Card>
        ) : (
          <>
            <button type="button" onClick={() => setIsFlipped((current) => !current)} className="min-h-80 rounded-lg border border-[#d8d1c2] bg-white p-8 text-left shadow-sm transition hover:border-[#3b6f6a]">
              <div className="flex items-center justify-between gap-4"><span className="text-sm font-semibold text-[#3b6f6a]">Card {index + 1} of {queue.length}</span><RotateCcw className="h-4 w-4 text-[#68766f]" /></div>
              <p className="mt-6 whitespace-pre-wrap text-base leading-7 text-[#4f5f57]">{isFlipped ? item.content : item.content.split("EXPLANATION:")[0] || item.content.slice(0, 240)}</p>
            </button>

            <Card>
              <CardHeader><CardTitle>Rate your recall</CardTitle><CardDescription>quality updates intervalDays, easeFactor, repetitions, and nextReviewAt.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                {[{ q: 0, label: "Forgot" }, { q: 3, label: "Hard" }, { q: 5, label: "Easy" }].map((rating) => <Button key={rating.q} type="button" variant="outline" disabled={isReviewing} onClick={() => review(rating.q)}>quality {rating.q} · {rating.label}</Button>)}
              </CardContent>
            </Card>

            <Card><CardContent className="grid gap-3 p-5 text-sm text-[#68766f] sm:grid-cols-4"><p>intervalDays {item.intervalDays}</p><p>easeFactor {item.easeFactor}</p><p>repetitions {item.repetitions}</p><p>nextReviewAt {new Date(item.nextReviewAt).toLocaleDateString()}</p></CardContent></Card>
          </>
        )}
      </section>
    </main>
  );
}

