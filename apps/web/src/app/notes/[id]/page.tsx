"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Note = { id: string; content: string | null; created_at: string };

type Material = { id: string; file_name: string | null; created_at: string };

function sectionFrom(content: string, start: string, end?: string) {
  const startIndex = content.indexOf(start);
  if (startIndex < 0) return content;
  const from = startIndex + start.length;
  const to = end ? content.indexOf(end, from) : -1;
  return content.slice(from, to > -1 ? to : undefined).trim();
}

export default function NoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [material, setMaterial] = useState<Material | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tab, setTab] = useState<"concise" | "detailed" | "exam">("concise");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      const response = await fetch(`/api/notes/${params.id}?userId=${data.session.user.id}`);
      const result = await response.json();
      if (result.success) {
        setMaterial(result.material);
        setNotes(result.notes);
      }
    });
  }, [params.id, router, supabase]);

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">Generated notes</p>
          <h1 className="mt-2 text-3xl font-semibold">{material?.file_name ?? "Material notes"}</h1>
        </header>

        <div className="flex flex-wrap gap-2">
          {[["concise", "Concise Notes"], ["detailed", "Detailed"], ["exam", "Exam-Style"]].map(([value, label]) => (
            <Button key={value} type="button" variant={tab === value ? "default" : "outline"} onClick={() => setTab(value as typeof tab)}>{label}</Button>
          ))}
        </div>

        <div className="space-y-4">
          {notes.map((note) => {
            const content = note.content ?? "";
            const visible = tab === "concise"
              ? sectionFrom(content, "BULLET POINTS:", "EXPLANATION:")
              : tab === "detailed"
                ? sectionFrom(content, "EXPLANATION:", "EXAM ANSWER:")
                : sectionFrom(content, "EXAM ANSWER:");

            return (
              <Card key={note.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl"><FileText className="h-5 w-5 text-[#3b6f6a]" />Generated note</CardTitle>
                  <CardDescription>{new Date(note.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent><pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-[#4f5f57]">{visible || content}</pre></CardContent>
              </Card>
            );
          })}
        </div>

        {!notes.length ? <Card><CardContent className="flex items-center gap-3 p-5 text-sm text-[#68766f]"><BookOpen className="h-5 w-5" />No generated notes yet.</CardContent></Card> : null}
      </section>
    </main>
  );
}

