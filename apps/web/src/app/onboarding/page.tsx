"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState(["Math", "Physics"]);
  const [examDate, setExamDate] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [availability, setAvailability] = useState("Weekday evenings");
  const [targetScore, setTargetScore] = useState("80");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      setUserId(data.session.user.id);
    });
  }, [router, supabase]);

  function updateSubject(index: number, value: string) {
    setSubjects((current) => current.map((subject, subjectIndex) => subjectIndex === index ? value : subject));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        taskType: "GENERATE_PLAN",
        payload: {
          subjects: subjects.map((subject) => subject.trim()).filter(Boolean),
          examDate,
          hoursPerDay,
          availability,
          targetScore,
        },
      }),
    });
    const result = await response.json();
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not generate study plan");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-10 text-[#17201a]">
      <section className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          {["Subjects", "Availability", "Target score"].map((label, index) => (
            <div key={label} className={`rounded-lg border px-4 py-3 text-sm ${step === index + 1 ? "border-[#3b6f6a] bg-white" : "border-[#d8d1c2] text-[#68766f]"}`}>
              <span className="font-semibold">Step {index + 1}</span>
              <p>{label}</p>
            </div>
          ))}
        </aside>

        <Card>
          <CardHeader>
            <CardTitle>Build your first study plan</CardTitle>
            <CardDescription>Start with subjects, examDate, hoursPerDay, availability, and target score.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {step === 1 ? (
                <div className="space-y-4">
                  <Label>Subjects</Label>
                  {subjects.map((subject, index) => (
                    <div key={index} className="flex gap-2">
                      <Input value={subject} onChange={(event) => updateSubject(index, event.target.value)} />
                      <Button type="button" variant="outline" size="sm" onClick={() => setSubjects((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => setSubjects((current) => [...current, ""])}>
                    <Plus className="h-4 w-4" /> Add subject
                  </Button>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="examDate">examDate</Label>
                      <Input id="examDate" className="mt-2" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="hoursPerDay">hoursPerDay</Label>
                      <Input id="hoursPerDay" className="mt-2" type="number" min={1} max={12} value={hoursPerDay} onChange={(event) => setHoursPerDay(Number(event.target.value))} required />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div>
                  <Label htmlFor="availability">Daily availability</Label>
                  <Input id="availability" className="mt-2" value={availability} onChange={(event) => setAvailability(event.target.value)} />
                </div>
              ) : null}

              {step === 3 ? (
                <div>
                  <Label htmlFor="targetScore">Target score</Label>
                  <Input id="targetScore" className="mt-2" type="number" min={0} max={100} value={targetScore} onChange={(event) => setTargetScore(event.target.value)} />
                </div>
              ) : null}

              {error ? <p className="rounded-md border border-[#e6b3a5] bg-[#fff3ef] px-3 py-2 text-sm text-[#8b2f18]">{error}</p> : null}

              <div className="flex justify-between gap-3">
                <Button type="button" variant="outline" disabled={step === 1 || isSubmitting} onClick={() => setStep((current) => current - 1)}>Back</Button>
                <Button type="submit" disabled={isSubmitting || !userId}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {step === 3 ? "Generate study plan" : "Continue"}
                  {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

