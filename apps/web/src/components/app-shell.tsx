"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Brain,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Notes", icon: FileText, path: "/notes" },
  { name: "Planner", icon: Calendar, path: "/planner" },
  { name: "Analytics", icon: Brain, path: "/analytics" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl flex flex-col">

        {/* LOGO */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={18} />
            <h1 className="text-sm font-semibold tracking-wide">
              AI Study OS
            </h1>
          </div>
          <p className="text-xs text-white/40 mt-1">
            Vercel-grade workspace
          </p>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item, i) => {
            const active = pathname === item.path;

            return (
              <motion.a
                key={item.path}
                href={item.path}
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-white/10 text-white border border-white/10"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={16} />
                {item.name}
              </motion.a>
            );
          })}
        </nav>

        {/* FOOTER ACTION */}
        <div className="p-3 border-t border-white/10">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
            + New Task
          </Button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-xl">

          <p className="text-xs text-white/50">
            Welcome back, build smarter ⚡
          </p>

          <Button variant="outline" className="text-xs border-white/10">
            Toggle Theme
          </Button>

        </header>

        {/* CONTENT */}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-auto p-6"
        >
          {children}
        </motion.main>

      </div>
    </div>
  );
}