"use client";

import { useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

type StatusTone = "idle" | "loading" | "success" | "error";

type StatusState = {
  tone: StatusTone;
  message: string;
};

const supabase = createClient();

const initialStatus: StatusState = {
  tone: "idle",
  message: "Use the actions below to test Supabase auth in your app.",
};

const statusStyles: Record<StatusTone, string> = {
  idle: "border-slate-300 bg-slate-50 text-slate-700",
  loading: "border-amber-300 bg-amber-50 text-amber-800",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  error: "border-rose-300 bg-rose-50 text-rose-800",
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<StatusState>(initialStatus);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setStatus({
          tone: "error",
          message: error.message,
        });
        return;
      }

      setSession(data.session);
      setStatus({
        tone: "success",
        message: "Connected to Supabase successfully.",
      });
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleEmailSignIn() {
    if (!email.trim()) {
      setStatus({
        tone: "error",
        message: "Enter your email address first.",
      });
      return;
    }

    setIsBusy(true);
    setStatus({
      tone: "loading",
      message: "Sending sign-in email...",
    });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setIsBusy(false);

    if (error) {
      setStatus({
        tone: "error",
        message: error.message,
      });
      return;
    }

    setStatus({
      tone: "success",
      message: "Check your inbox for the Supabase sign-in link.",
    });
  }

  async function handleGoogleSignIn() {
    setIsBusy(true);
    setStatus({
      tone: "loading",
      message: "Redirecting to Google sign-in...",
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setIsBusy(false);
      setStatus({
        tone: "error",
        message: error.message,
      });
    }
  }

  async function handleSignOut() {
    setIsBusy(true);
    setStatus({
      tone: "loading",
      message: "Signing out...",
    });

    const { error } = await supabase.auth.signOut();

    setIsBusy(false);

    if (error) {
      setStatus({
        tone: "error",
        message: error.message,
      });
      return;
    }

    setStatus({
      tone: "success",
      message: "Signed out successfully.",
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#e0f2fe,_#f8fafc_35%,_#ffffff_70%)] px-6 py-16">
      <section className="w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.10)] backdrop-blur">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-700">
            Day 3 Auth Test
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Supabase Sign-In Playground
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            This page verifies your frontend connection and lets you test email
            auth, Google OAuth, session state, and sign-out from the same
            screen.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Test Email Auth
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Supabase will send a magic link to the email address below.
            </p>

            <label
              className="mt-5 block text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            />

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleEmailSignIn}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Send Magic Link
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isBusy}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Continue with Google
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Current Session
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>
                <span className="font-medium text-slate-900">Status:</span>{" "}
                {session ? "Signed in" : "Signed out"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Email:</span>{" "}
                {session?.user.email ?? "No active user"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isBusy || !session}
              className="mt-6 inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div
          className={`mt-8 rounded-2xl border px-5 py-4 text-sm leading-6 ${statusStyles[status.tone]}`}
        >
          {status.message}
        </div>

        <div className="mt-6 text-sm leading-6 text-slate-500">
          For Google OAuth, make sure the redirect URL in Supabase includes your
          local app URL, usually <code>http://localhost:3000</code>.
        </div>
      </section>
    </main>
  );
}
