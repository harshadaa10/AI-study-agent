"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Material = { id: string; file_name: string | null; created_at: string; notesCreated: number };
type SearchResult = { note_id: string; content: string; similarity: number };

export default function NotesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userId, setUserId] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
      const response = await fetch(`/api/materials?userId=${data.session.user.id}`);
      const result = await response.json();
      if (result.success) setMaterials(result.materials);
    });
  }, [router, supabase]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim() || !userId) return;
    setIsSearching(true);
    const response = await fetch("/api/notes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, query, limit: 5 }),
    });
    const result = await response.json();
    setIsSearching(false);
    if (result.success) setResults(result.results);
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">Generated notes</p><h1 className="mt-2 text-3xl font-semibold">Notes and semantic search</h1></div>
          <Button asChild><Link href="/upload"><Upload className="h-4 w-4" />Upload PDF</Link></Button>
        </header>

        <Card>
          <CardHeader><CardTitle>Semantic search</CardTitle><CardDescription>Find matching generated notes with similarity.</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bayes theorem" />
              <Button type="submit" disabled={isSearching}>{isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search</Button>
            </form>
            <div className="mt-4 space-y-3">
              {results.map((result) => <div key={result.note_id} className="rounded-md border border-[#d8d1c2] bg-white px-3 py-3 text-sm"><p className="line-clamp-3 text-[#4f5f57]">{result.content}</p><p className="mt-2 text-xs text-[#2f615c]">similarity {result.similarity.toFixed(3)}</p></div>)}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <Link key={material.id} href={`/notes/${material.id}`} className="block">
              <Card className="h-full transition hover:border-[#3b6f6a]">
                <CardContent className="p-5">
                  <FileText className="h-5 w-5 text-[#3b6f6a]" />
                  <p className="mt-4 text-sm font-semibold">{material.file_name ?? "Uploaded material"}</p>
                  <p className="mt-2 text-sm text-[#68766f]">notesCreated {material.notesCreated}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

