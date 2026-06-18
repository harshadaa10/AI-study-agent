import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#17201a]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">
            AI Study Agent
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
            Plan, learn, revise, and track exam readiness in one focused workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#4f5f57] sm:text-lg">
            Sign in to continue your study plan, generated notes, revision queue, and progress
            snapshots.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
