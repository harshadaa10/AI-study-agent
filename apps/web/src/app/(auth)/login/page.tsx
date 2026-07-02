"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  console.log(
  "Supabase URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL
);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  console.log("✅ handleSubmit called");
  console.log("Email:", email);

  setError(null);
  setIsSubmitting(true);

  try {
    console.log("Calling Supabase Auth...");

    const result = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    console.log("Returned from Supabase");
    console.log(result);

    if (result.error) {
      console.error("LOGIN ERROR:", result.error);

      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    console.log("LOGIN SUCCESS");

    setIsSubmitting(false);

    router.push("/dashboard");
    console.log("Navigating to dashboard...");

    router.push("/dashboard");

    console.log("router.push finished");

    router.refresh();
  } catch (err) {
    console.error("CAUGHT EXCEPTION");
    console.error(err);

    setIsSubmitting(false);
  }
}

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#17201a]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_420px]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">
            Welcome back
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Continue from your latest study checkpoint.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#4f5f57]">
            Your plans, notes, semantic search, spaced repetition queue, and performance snapshots
            are waiting behind a secure Supabase session.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>
              Use the email and password connected to your study workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2"
              />

              <Label className="mt-4 block" htmlFor="password">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2"
              />

              {error ? (
                <p className="mt-4 rounded-md border border-[#e6b3a5] bg-[#fff3ef] px-3 py-2 text-sm text-[#8b2f18]">
                  {error}
                </p>
              ) : null}

              <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Log in
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>

              <p className="mt-5 text-center text-sm text-[#68766f]">
                New here?{" "}
                <Link href="/register" className="font-semibold text-[#2f615c] hover:text-[#17201a]">
                  Create an account
                </Link>
              </p>
              <p
  role="alert"
  className="mt-4 rounded-md border border-[#e6b3a5] bg-[#fff3ef] px-3 py-2 text-sm text-[#8b2f18]"
>
  {error}
</p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
