import './page-styles/AcademicsPage.css';

import { CalendarDays, CheckCircle2, Clock, AlertCircle, Eye, Trash2, Edit } from "lucide-react";
import GenericListPage from "../../DashboardLayout/GenericListPage/GenericListPage" // Adjust path as needed

// 1. Initial Mock Data
const initialSessions = [
  { id: 1, sessionName: "2023/2024", term: "Third Term", startDate: "2024-01-08", endDate: "2024-04-12", status: "Completed" },
  { id: 2, sessionName: "2024/2025", term: "First Term", startDate: "2024-09-09", endDate: "2024-12-20", status: "Completed" },
  { id: 3, sessionName: "2024/2025", term: "Second Term", startDate: "2025-01-06", endDate: "2025-04-04", status: "Current" },
  { id: 4, sessionName: "2024/2025", term: "Third Term", startDate: "2025-04-28", endDate: "2025-07-25", status: "Upcoming" },
];

// 2. The Configuration
const sessionsConfig = {
  title: "Academic Sessions",
  singularName: "Session",
  description: "Manage academic years, terms, and important school dates.",
  icon: CalendarDays,
  
  stats: [
    { 
      label: "Total Sessions", 
      value: (data) => data.length, 
      icon: CalendarDays, 
      color: "blue" 
    },
    { 
      label: "Current Session", 
      // Finds the one marked as "Current"
      value: (data) => {
        const current = data.find(s => s.status === "Current");
        return current ? `${current.sessionName} - ${current.term}` : "None Set";
      }, 
      icon: CheckCircle2, 
      color: "green" 
    },
  ],

  columns: [
    { key: "sessionName", label: "Session Year" },
    { key: "term", label: "Term" },
    { 
      key: "startDate", 
      label: "Start Date",
      // Custom render to format the date nicely
      render: (item) => (
        <span style={{ fontSize: "0.85rem", color: "oklch(0.85 0.05 264)" }}>
          {new Date(item.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      )
    },
    { 
      key: "endDate", 
      label: "End Date",
      render: (item) => (
        <span style={{ fontSize: "0.85rem", color: "oklch(0.85 0.05 264)" }}>
          {new Date(item.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      )
    },
    { 
      key: "status", 
      label: "Status",
      // Custom render for beautiful status pills
      render: (item) => {
        const colors = {
          Current: { bg: "oklch(0.7 0.18 140 / 15%)", text: "oklch(0.7 0.18 140)", icon: CheckCircle2 },
          Upcoming: { bg: "oklch(0.72 0.18 60 / 15%)", text: "oklch(0.72 0.18 60)", icon: Clock },
          Completed: { bg: "oklch(0.25 0.04 260)", text: "oklch(0.6 0.02 250)", icon: AlertCircle },
        };
        const style = colors[item.status] || colors.Completed;
        const Icon = style.icon;
        
        return (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600",
            background: style.bg, color: style.text
          }}>
            <Icon size={12} /> {item.status}
          </span>
        );
      }
    },
    { key: "actions", label: "Actions", align: "right" },
  ],

  formFields: [
    { name: "sessionName", label: "Session Year", type: "text", placeholder: "e.g., 2025/2026", fullWidth: true },
    { 
      name: "term", 
      label: "Term", 
      type: "select", 
      options: ["First Term", "Second Term", "Third Term"] 
    },
    { name: "startDate", label: "Start Date", type: "date" },
    { name: "endDate", label: "End Date", type: "date" },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      options: ["Current", "Upcoming", "Completed"] 
    },
  ],

  actions: [
    { label: "View Details", icon: Eye, type: "view" },
    { label: "Edit Session", icon: Edit, type: "edit" },
    { label: "Delete Session", icon: Trash2, type: "delete" },
  ],
};

// 3. The Component
export default function AcademicsPage() {
  return (
    <GenericListPage 
      config={sessionsConfig} 
      initialData={initialSessions} 
    />
  );
}
