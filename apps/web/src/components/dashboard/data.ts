import {
  LayoutDashboard,
  NotebookPen,
  CalendarRange,
  RotateCcw,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Notes", icon: NotebookPen },
  { label: "Planner", icon: CalendarRange },
  { label: "Revision", icon: RotateCcw },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings },
];

export type Priority = "high" | "medium" | "low";

export type StudyTask = {
  id: string;
  title: string;
  subject: string;
  duration: string;
  priority: Priority;
  done: boolean;
};

export const studyTasks: StudyTask[] = [
  {
    id: "t1",
    title: "Review Thermodynamics — Laws & Cycles",
    subject: "Physics",
    duration: "45 min",
    priority: "high",
    done: true,
  },
  {
    id: "t2",
    title: "Practice Integration by Parts",
    subject: "Calculus",
    duration: "30 min",
    priority: "high",
    done: false,
  },
  {
    id: "t3",
    title: "Read Chapter 7 — Organic Reactions",
    subject: "Chemistry",
    duration: "50 min",
    priority: "medium",
    done: false,
  },
  {
    id: "t4",
    title: "Flashcards — Cell Biology terms",
    subject: "Biology",
    duration: "20 min",
    priority: "low",
    done: false,
  },
  {
    id: "t5",
    title: "Mock test — Section A timed run",
    subject: "Aptitude",
    duration: "60 min",
    priority: "medium",
    done: false,
  },
];

export type RevisionCard = {
  id: string;
  topic: string;
  subject: string;
  due: string;
  confidence: number; // 0-100
};

export const revisionQueue: RevisionCard[] = [
  { id: "r1", topic: "Newton's Laws of Motion", subject: "Physics", due: "Due now", confidence: 42 },
  { id: "r2", topic: "Periodic Trends", subject: "Chemistry", due: "Due in 2h", confidence: 68 },
  { id: "r3", topic: "Limits & Continuity", subject: "Calculus", due: "Tomorrow", confidence: 81 },
  { id: "r4", topic: "Photosynthesis Pathways", subject: "Biology", due: "Tomorrow", confidence: 55 },
];

export type Insight = {
  id: string;
  kind: "weak" | "topic" | "suggestion";
  title: string;
  detail: string;
};

export const insights: Insight[] = [
  {
    id: "i1",
    kind: "weak",
    title: "Weak area detected",
    detail: "Accuracy in Organic Chemistry dropped to 58%. Schedule a focused 40-min session today.",
  },
  {
    id: "i2",
    kind: "topic",
    title: "Recommended next",
    detail: "You're ready for Rotational Dynamics — it builds on your strong grasp of Newtonian mechanics.",
  },
  {
    id: "i3",
    kind: "suggestion",
    title: "Smart suggestion",
    detail: "Your retention peaks in the morning. Move flashcard reviews to before 10am for +12% recall.",
  },
];

export type StudyPoint = {
  day: string;
  hours: number;
  recall: number;
};

export const weeklyStudy: StudyPoint[] = [
  { day: "Mon", hours: 3.2, recall: 62 },
  { day: "Tue", hours: 4.1, recall: 68 },
  { day: "Wed", hours: 2.6, recall: 71 },
  { day: "Thu", hours: 5.0, recall: 74 },
  { day: "Fri", hours: 3.8, recall: 80 },
  { day: "Sat", hours: 6.2, recall: 85 },
  { day: "Sun", hours: 4.5, recall: 88 },
];

export type SubjectScore = {
  subject: string;
  score: number;
};

export const subjectScores: SubjectScore[] = [
  { subject: "Physics", score: 84 },
  { subject: "Calculus", score: 76 },
  { subject: "Chemistry", score: 58 },
  { subject: "Biology", score: 71 },
  { subject: "Aptitude", score: 90 },
];

export const priorityStyles: Record<Priority, string> = {
  high: "bg-danger/15 text-danger border-danger/30",
  medium: "bg-warning/15 text-warning border-warning/30",
  low: "bg-success/15 text-success border-success/30",
};
