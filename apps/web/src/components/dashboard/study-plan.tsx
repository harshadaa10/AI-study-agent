"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { studyTasks, priorityStyles, type StudyTask } from "./data";

function TaskRow({ task, onToggle }: { task: StudyTask; onToggle: () => void }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-3 transition-colors hover:border-primary/40"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={task.done}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
          task.done
            ? "border-success bg-success text-background"
            : "border-border bg-transparent text-transparent hover:border-primary",
        )}
      >
        <Check className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            task.done ? "text-muted-foreground line-through" : "text-foreground",
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{task.subject}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {task.duration}
          </span>
        </div>
      </div>

      <span
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
          priorityStyles[task.priority],
        )}
      >
        {task.priority}
      </span>
    </motion.li>
  );
}

export function StudyPlan() {
  const [tasks, setTasks] = useState(studyTasks);
  const completed = tasks.filter((t) => t.done).length;

  function toggle(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Today&apos;s Study Plan</h3>
          <p className="text-xs text-muted-foreground">
            {completed} of {tasks.length} tasks complete
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      </div>

      <ul className="mt-4 flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} onToggle={() => toggle(task.id)} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.section>
  );
}
