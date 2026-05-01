"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function Home() {
  // ✅ FIX: move inside component
  const supabase = createBrowserSupabase();

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
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

  return (
    <div style={{ padding: "40px" }}>
      <h1>Supabase Test</h1>
      <p>Status: {session ? "Signed in" : "Signed out"}</p>
      <p>Email: {session?.user.email ?? "None"}</p>
    </div>
  );
}