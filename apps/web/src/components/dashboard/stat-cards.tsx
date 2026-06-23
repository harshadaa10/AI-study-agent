"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Flame, RotateCcw, Target, type LucideIcon } from "lucide-react";

type Stat = {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  accent: string;
};

const stats: Stat[] = [
  {
    label: "Tasks Today",
    value: "1 / 5",
    hint: "4 remaining",
    icon: CheckCircle2,
    accent: "from-primary/25 to-primary/5 text-primary",
  },
  {
    label: "Study Streak",
    value: "12 days",
    hint: "Personal best: 18",
    icon: Flame,
    accent: "from-warning/25 to-warning/5 text-warning",
  },
  {
    label: "Revision Due",
    value: "4 cards",
    hint: "2 high priority",
    icon: RotateCcw,
    accent: "from-secondary/25 to-secondary/5 text-secondary",
  },
  {
    label: "Exam Readiness",
    value: "78%",
    hint: "+6% this week",
    icon: Target,
    accent: "from-success/25 to-success/5 text-success",
  },
];

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.07 }}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-start justify-between">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm font-medium text-foreground/90">{stat.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
