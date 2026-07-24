import '../page-styles/SubjectsPage.css';
 import { ClipboardList, BookOpenCheck, CheckCircle2, XCircle, Eye, Trash2, Edit } from "lucide-react";
import GenericListPage from '../../GenericListPage/GenericListPage'; // Adjust path if needed

// 1. Initial Mock Data
const initialSubjects = [
  { id: 1, subjectName: "Mathematics", subjectCode: "MATH101", assignedLevel: "SS 1", status: "Active" },
  { id: 2, subjectName: "English Language", subjectCode: "ENG101", assignedLevel: "JSS", status: "Active" },
  { id: 3, subjectName: "Physics", subjectCode: "PHY201", assignedLevel: "SS 2", status: "Active" },
  { id: 4, subjectName: "Biology", subjectCode: "BIO101", assignedLevel: "SS 1", status: "Inactive" },
  { id: 5, subjectName: "Civic Education", subjectCode: "CIV101", assignedLevel: "All", status: "Active" },
];

// 2. The Configuration
const subjectsConfig = {
  title: "Subjects Setup",
  singularName: "Subject",
  description: "Manage academic subjects, assign codes, and link them to specific classes.",
  icon: ClipboardList,
  
  // Stats Cards at the top
  stats: [
    { 
      label: "Total Subjects", 
      value: (data) => data.length, 
      icon: ClipboardList, 
      color: "blue" 
    },
    { 
      label: "Active Subjects", 
      value: (data) => data.filter(s => s.status === "Active").length, 
      icon: CheckCircle2, 
      color: "green" 
    },
    {
      label: "Inactive Subjects",
      value: (data) => data.filter(s => s.status === "Inactive").length,
      icon: XCircle,
      color: "red"
    }
  ],

  // Table Columns
  columns: [
    { key: "subjectName", label: "Subject Name" },
    { 
      key: "subjectCode", 
      label: "Subject Code",
      // Custom render to make the code look like a monospaced tag
      render: (item) => (
        <span style={{ 
          fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "600",
          background: "oklch(0.25 0.04 260)", color: "oklch(0.85 0.05 264)", 
          padding: "4px 10px", borderRadius: "6px", border: "1px solid oklch(1 0 0 / 10%)"
        }}>
          {item.subjectCode}
        </span>
      )
    },
    { key: "assignedLevel", label: "Assigned Level" },
    { 
      key: "status", 
      label: "Status",
      // Custom render for the Active/Inactive badge
      render: (item) => (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "4px 12px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600",
          background: item.status === "Active" ? "oklch(0.7 0.18 140 / 15%)" : "oklch(0.65 0.22 27 / 15%)",
          color: item.status === "Active" ? "oklch(0.7 0.18 140)" : "oklch(0.65 0.22 27)"
        }}>
          {item.status === "Active" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {item.status}
        </span>
      )
    },
    { key: "actions", label: "Actions", align: "right" },
  ],

  // "Add New Subject" Modal Form Fields
  formFields: [
    { name: "subjectName", label: "Subject Name", type: "text", placeholder: "e.g., Mathematics", fullWidth: true },
    { name: "subjectCode", label: "Subject Code", type: "text", placeholder: "e.g., MATH101" },
    { 
      name: "assignedLevel", 
      label: "Assigned Level", 
      type: "select", 
      options: ["JSS", "SS 1", "SS 2", "SS 3", "All"] 
    },
    { 
      name: "status", 
      label: "Status", 
      type: "select", 
      options: ["Active", "Inactive"] 
    },
  ],

  // 3-Dot Dropdown Actions
  actions: [
    { label: "View Details", icon: Eye, type: "view" },
    { label: "Edit Subject", icon: Edit, type: "edit" },
    { label: "Delete Subject", icon: Trash2, type: "delete" },
  ],
};

// 3. The Actual Component
export default function  SubjectsPage() {
  return (
    <GenericListPage 
      config={subjectsConfig} 
      initialData={initialSubjects} 
    />
  );
}
