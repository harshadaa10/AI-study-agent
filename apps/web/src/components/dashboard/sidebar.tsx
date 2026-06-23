"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./data";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={onNavigate}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              item.active
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                item.active
                  ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30">
        <GraduationCap className="h-5 w-5 text-primary-foreground" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-foreground">Study Agent</p>
        <p className="text-xs text-muted-foreground">AI learning OS</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          className="flex h-10 w-10 items-center justify-center rounded-xl glass text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <motion.aside
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 flex h-full w-72 flex-col gap-6 border-r border-border/60 bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
          </motion.aside>
        </div>
      )}

      {/* Desktop fixed sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 border-r border-border/60 bg-card/40 px-4 py-6 backdrop-blur-xl lg:flex">
        <Brand />
        <NavList />
        <div className="mt-auto rounded-2xl border border-border/60 bg-gradient-to-br from-primary/20 to-secondary/10 p-4">
          <p className="text-sm font-semibold text-foreground">Go Pro</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlock unlimited AI plans and deep analytics.
          </p>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Upgrade
          </button>
        </div>
      </aside>
    </>
  );
}
