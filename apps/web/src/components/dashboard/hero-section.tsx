"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";

function ReadinessRing({ value }: { value: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="10"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#readinessGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="readinessGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.22 295)" />
            <stop offset="100%" stopColor="oklch(0.7 0.16 200)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">Readiness</span>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        <div className="max-w-xl text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI plan refreshed 2 minutes ago
          </span>
          <h2 className="mt-4 text-pretty text-2xl font-bold text-foreground sm:text-3xl">
            Good afternoon, Harshada
          </h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            You&apos;re on a strong trajectory for your finals. Finish today&apos;s 4 remaining
            tasks to push your exam readiness past 80%.
          </p>

          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Weekly progress</span>
                <span className="text-muted-foreground">68%</span>
              </div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "68%" }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                +14% vs last week
              </p>
            </div>
          </div>
        </div>

        <ReadinessRing value={78} />
      </div>
    </motion.section>
  );
}
