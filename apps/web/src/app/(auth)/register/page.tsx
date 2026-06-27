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

export default function RegisterPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo:
          typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setMessage("Account created. Check your email to confirm your login before continuing.");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#17201a]">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_420px]">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3b6f6a]">
            Start studying smarter
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Create your workspace for plans, notes, revision, and progress.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#4f5f57]">
            Day 19 adds secure account creation so the next frontend milestones can personalize
            onboarding and dashboard data per student.
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Your account uses Supabase Auth and stores study data by user.
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
                autoComplete="new-password"
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

              {message ? (
                <p className="mt-4 rounded-md border border-[#a9cdb9] bg-[#eef8f1] px-3 py-2 text-sm text-[#28533a]">
                  {message}
                </p>
              ) : null}

              <Button type="submit" disabled={isSubmitting} className="mt-6 w-full">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create account
                {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
              </Button>

              <p className="mt-5 text-center text-sm text-[#68766f]">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-[#2f615c] hover:text-[#17201a]">
                  Log in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
