"use client";

import { motion } from "framer-motion";
import { Bell, Search } from "lucide-react";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Tuesday, June 23
        </p>
        <h1 className="text-pretty text-xl font-semibold text-foreground">
          Welcome back, Harshada
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative hidden flex-1 sm:block">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search notes, topics, plans…"
            className="w-64 rounded-xl border border-border/60 bg-card/60 py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none backdrop-blur-md transition-colors focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
        </label>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/60 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
        </button>

        <button
          type="button"
          aria-label="Account"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25"
        >
          H
        </button>
      </div>
    </motion.header>
  );
}
