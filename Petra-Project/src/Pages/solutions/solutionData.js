import {
  LayoutDashboard,
  LineChart,
  Megaphone,
  PanelsTopLeft,
  School,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Wallet,
  ClipboardCheck,
  LibraryBig,
} from "lucide-react";

export const solutionGroups = [
  {
    header: "For Schools",
    items: [
      { title: "School OS", path: "/solution/school-os", desc: "Core operations and campus control" },
      { title: "Financial Management", path: "/solution/financial-management", desc: "Fees, reconciliation and cashflow" },
      { title: "CBT Engine", path: "/solution/cbt-engine", desc: "Digital assessments and exam flow" },
    ],
  },
  {
    header: "For Parents",
    items: [
      { title: "Petra Pay", path: "/solution/petra-pay", desc: "Fast tuition payments" },
      { title: "FlexPay", path: "/solution/flexpay", desc: "Installment fee plans" },
      { title: "Performance", path: "/solution/performance", desc: "Track progress and updates" },
    ],
  },
  {
    header: "For Students",
    items: [
      { title: "AI Study App", path: "/solution/ai-study-app", desc: "AI tutoring and practice" },
      { title: "Learning Hub", path: "/solution/learning-hub", desc: "Timetables, tasks and growth" },
      { title: "Digital Library", path: "/solution/digital-library", desc: "Knowledge and references" },
    ],
  },
  {
    header: "For Teachers",
    items: [
      { title: "Teacher Workspace", path: "/solution/teacher-workspace", desc: "Classroom command center" },
      { title: "Lesson Planner", path: "/solution/lesson-planner", desc: "Plan lessons faster" },
      { title: "Assessment Tools", path: "/solution/assessment-tools", desc: "Grade and analyze work" },
    ],
  },
  {
    header: "For Administrators",
    items: [
      { title: "School Analytics", path: "/solution/school-analytics", desc: "Insights across the school" },
      { title: "Admissions", path: "/solution/admissions", desc: "Enroll with less friction" },
      { title: "Communication Hub", path: "/solution/communication-hub", desc: "One place for updates" },
    ],
  },
];

const sharedFaq = [
  {
    question: "Can we switch modules later?",
    answer: "Yes. Each solution page represents a focused module, but they are designed to work together inside the same Petra platform.",
  },
  {
    question: "Is the layout responsive?",
    answer: "Yes. The shared template adapts from one-column mobile stacks to wider desktop grids without changing the core flow.",
  },
  {
    question: "Can schools customize the experience?",
    answer: "Yes. Copy, highlights, and call-to-action destinations can be adjusted per page without changing the component structure.",
  },
];

const baseFeatures = {
  "School OS": [
    "Centralize attendance, profiles, classes and school records.",
    "Streamline daily operations with a single dashboard.",
    "Keep administrators, teachers and parents aligned.",
  ],
  "Financial Management": [
    "Track collections, balances and settlement status in real time.",
    "Simplify reconciliation and reduce manual finance work.",
    "Support fee visibility across the school term.",
  ],
  "CBT Engine": [
    "Run digital tests with secure exam flows and scoring.",
    "Support objective, theory and practice-based assessments.",
    "Review outcomes instantly with cleaner reporting.",
  ],
  "Petra Pay": [
    "Accept school-related payments with a smooth parent experience.",
    "Reduce friction between the school and family payment flow.",
    "Keep receipts and payment history easy to access.",
  ],
  FlexPay: [
    "Offer flexible installment plans for tuition and fees.",
    "Help families stay on track without losing momentum.",
    "Give finance teams predictable collection visibility.",
  ],
  Performance: [
    "Show progress snapshots and important milestones in one view.",
    "Keep parents informed with timely updates and insights.",
    "Turn academic signals into understandable actions.",
  ],
  "AI Study App": [
    "Personalized practice and on-demand support for learners.",
    "Translate difficult topics into step-by-step explanations.",
    "Improve confidence before tests and classwork.",
  ],
  "Learning Hub": [
    "Bring lessons, tasks and weekly structure into one place.",
    "Keep students organized with a clear learning rhythm.",
    "Make it easier to review what matters most.",
  ],
  "Digital Library": [
    "Provide a searchable collection of learning resources.",
    "Support reading, revision and independent learning.",
    "Keep knowledge accessible across devices.",
  ],
  "Teacher Workspace": [
    "Plan, manage and deliver classes from a central workspace.",
    "Reduce admin overhead so teachers can focus on teaching.",
    "Align content, tasks and class records.",
  ],
  "Lesson Planner": [
    "Create weekly lessons with fewer repetitive steps.",
    "Reuse structures and keep teaching plans consistent.",
    "Make lesson prep more visual and collaborative.",
  ],
  "Assessment Tools": [
    "Create, grade and analyze assessments more efficiently.",
    "Spot learning gaps earlier with practical reporting.",
    "Support both continuous assessment and exams.",
  ],
  "School Analytics": [
    "Turn school activity into clear operational insights.",
    "Track trends across students, finance and academics.",
    "Help leaders make faster decisions.",
  ],
  Admissions: [
    "Manage inquiries, applications and enrollment steps.",
    "Reduce bottlenecks for families and staff.",
    "Keep the admissions journey organized from start to finish.",
  ],
  "Communication Hub": [
    "Send updates and coordinate across stakeholders.",
    "Keep school messaging visible and structured.",
    "Support announcements, reminders and follow-ups.",
  ],
};

const solutionMeta = {
  "School OS": { icon: School, accent: "#60a5fa", eyebrow: "For Schools", badge: "Operations" },
  "Financial Management": { icon: Wallet, accent: "#34d399", eyebrow: "For Schools", badge: "Finance" },
  "CBT Engine": { icon: ClipboardCheck, accent: "#22d3ee", eyebrow: "For Schools", badge: "Assessment" },
  "Petra Pay": { icon: ShieldCheck, accent: "#f59e0b", eyebrow: "For Parents", badge: "Payments" },
  FlexPay: { icon: Wallet, accent: "#a78bfa", eyebrow: "For Parents", badge: "Installments" },
  Performance: { icon: LineChart, accent: "#fb7185", eyebrow: "For Parents", badge: "Progress" },
  "AI Study App": { icon: Sparkles, accent: "#8b5cf6", eyebrow: "For Students", badge: "AI Tutor" },
  "Learning Hub": { icon: PanelsTopLeft, accent: "#38bdf8", eyebrow: "For Students", badge: "Learning" },
  "Digital Library": { icon: LibraryBig, accent: "#f97316", eyebrow: "For Students", badge: "Library" },
  "Teacher Workspace": { icon: LayoutDashboard, accent: "#14b8a6", eyebrow: "For Teachers", badge: "Workspace" },
  "Lesson Planner": { icon: SquarePen, accent: "#eab308", eyebrow: "For Teachers", badge: "Planning" },
  "Assessment Tools": { icon: ClipboardCheck, accent: "#f472b6", eyebrow: "For Teachers", badge: "Grading" },
  "School Analytics": { icon: LineChart, accent: "#4ade80", eyebrow: "For Administrators", badge: "Insights" },
  Admissions: { icon: School, accent: "#60a5fa", eyebrow: "For Administrators", badge: "Enrollment" },
  "Communication Hub": { icon: Megaphone, accent: "#c084fc", eyebrow: "For Administrators", badge: "Messaging" },
};

export function getSolutionData(title) {
  const meta = solutionMeta[title];
  return {
    title,
    eyebrow: meta.eyebrow,
    badge: meta.badge,
    icon: meta.icon,
    accent: meta.accent,
    summary:
      `A clean, responsive module for ${title.toLowerCase()} built to fit Petra's dark SaaS experience.`,
    highlights: baseFeatures[title],
    benefits: [
      "Responsive sections that scale from mobile to desktop.",
      "Reusable cards and structured content for consistent UX.",
      "A clear conversion path with strong call-to-action placement.",
    ],
    screenshots: [
      "Dashboard overview placeholder",
      "Mobile workflow placeholder",
      "Analytics snapshot placeholder",
    ],
    faq: sharedFaq,
  };
}
