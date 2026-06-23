"use client";

import { motion } from "framer-motion";
import { Layers, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { revisionQueue } from "./data";

function confidenceColor(value: number) {
  if (value >= 75) return "text-success";
  if (value >= 55) return "text-warning";
  return "text-danger";
}

function confidenceBar(value: number) {
  if (value >= 75) return "bg-success";
  if (value >= 55) return "bg-warning";
  return "bg-danger";
}

export function RevisionQueue() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
            <Layers className="h-4 w-4" />
          </span>
          <h3 className="text-base font-semibold text-foreground">Revision Queue</h3>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-opacity hover:opacity-80"
        >
          Review all
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {revisionQueue.map((card, i) => (
          <motion.article
            key={card.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.25 + i * 0.06 }}
            whileHover={{ y: -3 }}
            className="rounded-xl border border-border/50 bg-gradient-to-br from-card/70 to-card/30 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{card.subject}</span>
              <span
                className={cn(
                  "rounded-full bg-card/60 px-2 py-0.5 text-xs font-medium",
                  card.due === "Due now" ? "text-danger" : "text-muted-foreground",
                )}
              >
                {card.due}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">{card.topic}</p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span className={cn("font-semibold", confidenceColor(card.confidence))}>
                  {card.confidence}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${card.confidence}%` }}
                  transition={{ duration: 0.8, delay: 0.35 + i * 0.06 }}
                  className={cn("h-full rounded-full", confidenceBar(card.confidence))}
                />
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
