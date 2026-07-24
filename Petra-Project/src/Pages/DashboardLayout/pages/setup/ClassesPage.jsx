import '../page-styles/ClassesPage.css';

import { BookOpen, Users, GraduationCap, Eye, Trash2, Edit } from "lucide-react";
import GenericListPage from "../../GenericListPage/GenericListPage" // Adjust path if needed

// 1. Initial Mock Data
const initialClasses = [
  { id: 1, className: "JSS 1A", classTeacher: "Mr. Adebayo", studentCount: 35 },
  { id: 2, className: "JSS 2B", classTeacher: "Mrs. Okonkwo", studentCount: 28 },
  { id: 3, className: "SS 1 Science", classTeacher: "Mr. Ibrahim", studentCount: 42 },
  { id: 4, className: "SS 2 Art", classTeacher: "Mrs. Balogun", studentCount: 31 },
];

// 2. The Configuration (The "Recipe")
const classesConfig = {
  title: "Classes Setup",
  singularName: "Class",
  description: "Manage school classes, assign teachers, and track enrollment.",
  icon: BookOpen,
  
  // Stats Cards at the top
  stats: [
    { 
      label: "Total Classes", 
      value: (data) => data.length, 
      icon: BookOpen, 
      color: "blue" 
    },
    { 
      label: "Total Students Enrolled", 
      // Dynamically adds up all studentCount values
      value: (data) => data.reduce((sum, c) => sum + (Number(c.studentCount) || 0), 0), 
      icon: GraduationCap, 
      color: "green" 
    },
  ],

  // Table Columns
  columns: [
    { key: "className", label: "Class Name" },
    { key: "classTeacher", label: "Class Teacher" },
    { 
      key: "studentCount", 
      label: "Student Count",
      // Custom render function to make the student count look like a nice badge
      render: (item) => (
        <span style={{ 
          display: "inline-flex", alignItems: "center", gap: "6px", 
          background: "oklch(0.62 0.2 264 / 15%)", color: "oklch(0.62 0.2 264)", 
          padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600" 
        }}>
          <Users size={14} /> {item.studentCount || 0} Students
        </span>
      )
    },
    { key: "actions", label: "Actions", align: "right" },
  ],

  // "Add New Class" Modal Form Fields
  formFields: [
    { name: "className", label: "Class Name", type: "text", placeholder: "e.g., JSS 1A", fullWidth: true },
    { name: "classTeacher", label: "Class Teacher", type: "text", placeholder: "e.g., Mr. John Doe" },
    { name: "studentCount", label: "Student Count", type: "number", placeholder: "e.g., 30" },
  ],

  // 3-Dot Dropdown Actions
  actions: [
    { label: "View Details", icon: Eye, type: "view" },
    { label: "Edit Class", icon: Edit, type: "edit" },
    { label: "Delete Class", icon: Trash2, type: "delete" },
  ],
};

// 3. The Actual Component (Super short!)
export default function  ClassesPage() {
  return (
    <GenericListPage 
      config={classesConfig} 
      initialData={initialClasses} 
    />
  );
}