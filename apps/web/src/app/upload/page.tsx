"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function UploadPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
    });
  }, [router, supabase]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !userId) return;

    setStatus("uploading");
    setMessage("Uploading");

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("file", file);

    setStatus("processing");
    setMessage("Processing");

    const response = await fetch("/api/materials/upload", { method: "POST", body: formData });
    const result = await response.json();

    if (!result.success) {
      setStatus("error");
      setMessage(result.error ?? "Upload failed");
      return;
    }

    setStatus("done");
    setMessage(`Done · notesCreated ${result.notesCreated ?? 0}`);
  }, [userId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const progress = status === "idle" ? 0 : status === "uploading" ? 33 : status === "processing" ? 66 : status === "done" ? 100 : 100;

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <header className="flex items-center justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">Generated notes</p><h1 className="mt-2 text-3xl font-semibold">Upload PDF</h1></div>
          <Button asChild variant="outline"><Link href="/notes"><FileText className="h-4 w-4" />Notes</Link></Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Process uploaded PDFs into structured notes</CardTitle>
            <CardDescription>Drop one PDF and the Notes Agent will create generated notes and embeddings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div {...getRootProps()} className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center ${isDragActive ? "border-[#3b6f6a] bg-[#eef8f1]" : "border-[#c8d2cb] bg-white"}`}>
              <input {...getInputProps()} />
              <UploadCloud className="h-10 w-10 text-[#3b6f6a]" />
              <p className="mt-4 text-sm font-semibold">Drag a PDF here or click to select</p>
              <p className="mt-1 text-sm text-[#68766f]">Uploading ? Processing ? Done</p>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[#d8d1c2]"><div className="h-full bg-[#3b6f6a] transition-all" style={{ width: `${progress}%` }} /></div>
            {message ? <p className={`flex items-center gap-2 text-sm ${status === "error" ? "text-[#8b2f18]" : "text-[#28533a]"}`}>{status === "processing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{message}</p> : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

