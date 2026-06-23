"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";
import { insights, type Insight } from "./data";

const kindMeta: Record<Insight["kind"], { icon: LucideIcon; ring: string; tint: string }> = {
  weak: { icon: AlertTriangle, ring: "text-danger", tint: "bg-danger/15" },
  topic: { icon: Sparkles, ring: "text-primary", tint: "bg-primary/15" },
  suggestion: { icon: Lightbulb, ring: "text-warning", tint: "bg-warning/15" },
};

export function AiInsights() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="glass relative overflow-hidden rounded-2xl p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-foreground">AI Insights</h3>
          <p className="text-xs text-muted-foreground">Personalized for your goals</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-col gap-3">
        {insights.map((insight, i) => {
          const meta = kindMeta[insight.kind];
          const Icon = meta.icon;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
              className="flex gap-3 rounded-xl border border-border/50 bg-card/40 p-3.5"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tint} ${meta.ring}`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {insight.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
