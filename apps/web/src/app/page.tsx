import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { HeroSection } from "@/components/dashboard/hero-section";
import { StatCards } from "@/components/dashboard/stat-cards";
import { StudyPlan } from "@/components/dashboard/study-plan";
import { RevisionQueue } from "@/components/dashboard/revision-queue";
import { AiInsights } from "@/components/dashboard/ai-insights";
import { Analytics } from "@/components/dashboard/analytics";

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen">
      <div className="app-aurora" />
      <Sidebar />

      <div className="relative z-10 lg:pl-64">
        <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Header />
          <HeroSection />
          <StatCards />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="flex flex-col gap-6 xl:col-span-2">
              <StudyPlan />
              <RevisionQueue />
            </div>
            <AiInsights />
          </div>

          <Analytics />
        </main>
      </div>
    </div>
  );
}
