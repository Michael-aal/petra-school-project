import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  CheckCircle2,
  FilterIcon,
  GraduationCap,
  Plus,
  RefreshCcw,
  Users,
} from "lucide-react";
import "../../../../Styles/DashBoardLayout/studentListStyle.css";
import "../page-styles/StudentsListPage.css";
import { studentApi } from "../../../../services/studentApi";
import GenericListPage from "../../GenericListPage/GenericListPage";

export default function StudentsListPage() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadStudents = async () => {
      try {
        const res = await studentApi.list({ page: 1, limit: 200 });
        if (mounted) setStudents(res.students || []);
      } catch (error) {
        if (mounted) setStudents([]);
      }
    };

    loadStudents();
    return () => {
      mounted = false;
    };
  }, []);

  const studentsConfig = {
    title: "Students",
    singularName: "Student",
    description: "Manage registered students and their guardians.",
    icon: GraduationCap,
    stats: [
      { label: "Total Students", value: (data) => data.length, icon: Users, color: "blue" },
      { label: "Active Students", value: (data) => data.filter((s) => s.status === "active").length, icon: CheckCircle2, color: "green" },
      { label: "Male", value: (data) => data.filter((s) => String(s.gender).toLowerCase() === "male").length, icon: ArrowRightLeft, color: "blue" },
      { label: "Female", value: (data) => data.filter((s) => String(s.gender).toLowerCase() === "female").length, icon: ArrowRightLeft, color: "red" },
    ],
    toolbarActions: [
      { label: "Filter", icon: FilterIcon, variant: "secondary", onClick: () => {} },
      { label: "Refresh", icon: RefreshCcw, variant: "secondary", onClick: () => window.location.reload() },
      { label: "Add Student", icon: Plus, variant: "primary", onClick: () => window.alert("Add student flow") },
    ],
    columns: [
      { key: "name", label: "Student" },
      { key: "className", label: "Class" },
      { key: "guardianName", label: "Guardian" },
      { key: "gender", label: "Gender" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Actions", align: "right" },
    ],
    formFields: [
      { name: "name", label: "Full Name", type: "text", fullWidth: true },
      { name: "className", label: "Class", type: "text" },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
      { name: "guardianName", label: "Guardian", type: "text" },
    ],
    actions: [
      { label: "View", type: "view" },
      { label: "Edit", type: "edit" },
      { label: "Delete", type: "delete" },
    ],
    emptyState: {
      icon: Users,
      title: "No students found",
      description: "Add students to get started.",
      action: { label: "Add Student", onClick: () => window.alert("Add student") },
    },
  };

  return (
    <div className="students-page">
      <GenericListPage config={studentsConfig} initialData={students} />
    </div>
  );
}
