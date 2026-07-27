import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import "../page-styles/ClassesPage.css";

const classArms = ["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"];

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
<<<<<<< HEAD
    <GenericListPage 
      config={classesConfig} 
      initialData={initialClasses} 
    />
=======
    <div className="dashboard-home">
      <section className="dashboard-home-header">
        <div>
          <h1>Classes</h1>
          <p>Define class groups, arms, and how learners are organized.</p>
        </div>
        <div className="dashboard-home-session-pill">Setup</div>
      </section>

      <section className="dashboard-home-summary">
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Class arms</span>
              <strong>{classArms.length}</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-blue">
              <Users size={18} />
            </div>
          </div>
        </article>
        <article className="dashboard-home-summary-card">
          <div className="dashboard-home-summary-top">
            <div>
              <span>Structure</span>
              <strong>Primary + Secondary</strong>
            </div>
            <div className="dashboard-home-summary-icon tone-teal">
              <BookOpen size={18} />
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-home-panel">
        <h2>Configured class groups</h2>
        <div className="parent-list">
          {classArms.map((className) => (
            <div key={className} className="parent-list-item">
              <div>
                <strong>{className}</strong>
                <p>Use this as a base class group for enrollment and results.</p>
              </div>
              <div className="parent-pill">Ready</div>
            </div>
          ))}
        </div>
        <Link to="/dashboard/students/enrollment" className="dashboard-home-summary-action tone-blue" style={{ marginTop: 16 }}>
          <span>Manage enrollments</span>
          <ArrowRight size={14} />
        </Link>
      </section>
    </div>
>>>>>>> feature/authenticated-theme-pages
  );
}