"use client";
import { Trash2 } from "lucide-react";
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

const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
const [lastDeleted, setLastDeleted] = useState<Material | null>(null);


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
const handleDelete = async () => {
  if (!deleteTarget) return;

  await fetch("/api/materials/delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      materialId: deleteTarget.id,
    }),
  });

  setLastDeleted(deleteTarget); // 🔥 soft delete backup
  setMaterials((prev) =>
    prev.filter((m) => m.id !== deleteTarget.id)
  );

  setDeleteTarget(null);
};

const handleUndoDelete = async () => {
  if (!lastDeleted) return;

  // optional: restore API call (if you support it)
  await fetch("/api/materials/restore", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      materialId: lastDeleted.id,
    }),
  });

  setMaterials((prev) => [lastDeleted, ...prev]);
  setLastDeleted(null);
};
 return (
  <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
    <section className="mx-auto w-full max-w-6xl space-y-6">
      
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">
            Generated notes
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            Notes and semantic search
          </h1>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Upload className="h-4 w-4" />Upload PDF
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Semantic search</CardTitle>
          <CardDescription>
            Find matching generated notes with similarity.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Bayes theorem"
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </Button>
          </form>

          <div className="mt-4 space-y-3">
            {results.map((result) => (
              <div
                key={result.note_id}
                className="rounded-md border border-[#d8d1c2] bg-white px-3 py-3 text-sm"
              >
                <p className="line-clamp-3 text-[#4f5f57]">
                  {result.content}
                </p>
                <p className="mt-2 text-xs text-[#2f615c]">
                  similarity {result.similarity.toFixed(3)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MATERIALS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <Card
            key={material.id}
            className="h-full transition hover:border-[#3b6f6a] relative"
          >
            
            {/* DELETE BUTTON */}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-3 right-3 z-10"
              onClick={(e) => {
  e.preventDefault(); // prevents Link navigation
  e.stopPropagation();
  setDeleteTarget(material);
}}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* LINK CONTENT */}
            <Link href={`/notes/${material.id}`} className="block">
              <CardContent className="p-5">
                <FileText className="h-5 w-5 text-[#3b6f6a]" />
                <p className="mt-4 text-sm font-semibold">
                  {material.file_name ?? "Uploaded material"}
                </p>
                <p className="mt-2 text-sm text-[#68766f]">
                  notesCreated {material.notesCreated}
                </p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* STEP 4: CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="w-[340px] rounded-lg bg-white p-5 space-y-4">

            <p className="font-semibold">
              Delete "{deleteTarget.file_name}"?
            </p>

            <p className="text-sm text-gray-500">
              You can undo this action for a short time.
            </p>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="px-3 py-1 bg-red-500 text-white rounded"
                onClick={async () => {
                  await fetch("/api/materials/delete", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId,
                      materialId: deleteTarget.id,
                    }),
                  });

                  setLastDeleted(deleteTarget);

                  setMaterials((prev) =>
                    prev.filter((m) => m.id !== deleteTarget.id)
                  );

                  setDeleteTarget(null);

                  setTimeout(() => setLastDeleted(null), 5000);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: UNDO TOAST */}
      {lastDeleted && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded z-50">
          Deleted "{lastDeleted.file_name}"

          <button
            className="ml-3 underline"
            onClick={async () => {
              await fetch("/api/materials/restore", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId,
                  materialId: lastDeleted.id,
                }),
              });

              setMaterials((prev) => [lastDeleted, ...prev]);
              setLastDeleted(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
{deleteTarget && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-lg">
      <h2 className="text-lg font-semibold">Confirm Delete</h2>
      <p className="mt-2 text-sm text-gray-600">
        Are you sure you want to delete{" "}
        <b>{deleteTarget.file_name}</b>?
      </p>

      <div className="mt-5 flex justify-end gap-3">
        <button
          className="rounded-md border px-4 py-2 text-sm"
          onClick={() => setDeleteTarget(null)}
        >
          Cancel
        </button>

        <button
          className="rounded-md bg-red-600 px-4 py-2 text-sm text-white"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
{lastDeleted && (
  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-[#17201a] px-4 py-2 text-sm text-white shadow-lg">
    Note deleted
    <button
      onClick={handleUndoDelete}
      className="ml-3 font-semibold text-[#7ee081]"
    >
      Undo
    </button>
  </div>
)}
    </section>
  </main>
);
}