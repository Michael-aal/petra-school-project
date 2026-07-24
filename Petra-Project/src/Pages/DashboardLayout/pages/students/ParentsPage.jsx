import '../page-styles/ParentsPage.css';

import { Users, UserCheck, Phone, Mail, Eye, Trash2, Edit } from "lucide-react";
import GenericListPage from "../../GenericListPage/GenericListPage" // Adjust path as needed

// 1. Initial Mock Data
const initialParents = [
  { id: 1, parentName: "Mr. Ogunleye Kayode", phoneNumber: "+234 801 234 5678", email: "ogunleye.k@gmail.com", linkedStudents: 2 },
  { id: 2, parentName: "Mrs. Adebayo Vitor", phoneNumber: "+234 802 345 6789", email: "vitor.adebayo@yahoo.com", linkedStudents: 1 },
  { id: 3, parentName: "Chief Fakorade", phoneNumber: "+234 803 456 7890", email: "fakorade.chief@outlook.com", linkedStudents: 3 },
  { id: 4, parentName: "Alhaji Ibrahim", phoneNumber: "+234 804 567 8901", email: "ibrahim.a@gmail.com", linkedStudents: 2 },
];

// 2. The Configuration
const parentsConfig = {
  title: "Parents & Guardians",
  singularName: "Parent",
  description: "Manage parent contacts and view their linked students (wards).",
  icon: Users,
  
  stats: [
    { 
      label: "Total Parents", 
      value: (data) => data.length, 
      icon: Users, 
      color: "blue" 
    },
    { 
      label: "Total Wards (Students)", 
      // Dynamically adds up all linkedStudents values
      value: (data) => data.reduce((sum, p) => sum + (Number(p.linkedStudents) || 0), 0), 
      icon: UserCheck, 
      color: "green" 
    },
  ],

  columns: [
    { 
      key: "avatar", // The GenericListPage automatically generates initials for this!
      label: "Parent Name" 
    },
    { 
      key: "phoneNumber", 
      label: "Phone Number",
      render: (item) => (
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
          <Phone size={14} style={{ color: "oklch(0.6 0.02 250)" }} /> {item.phoneNumber}
        </span>
      )
    },
    { 
      key: "email", 
      label: "Email Address",
      render: (item) => (
        <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "oklch(0.85 0.05 264)" }}>
          <Mail size={14} style={{ color: "oklch(0.6 0.02 250)" }} /> {item.email}
        </span>
      )
    },
    { 
      key: "linkedStudents", 
      label: "Linked Wards",
      // Custom render to show a nice pill for the number of kids
      render: (item) => (
        <span style={{ 
          display: "inline-flex", alignItems: "center", gap: "6px", 
          background: "oklch(0.3 0.08 264)", color: "oklch(0.85 0.05 264)", 
          padding: "4px 12px", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600" 
        }}>
          <UserCheck size={14} /> {item.linkedStudents || 0} Wards
        </span>
      )
    },
    { key: "actions", label: "Actions", align: "right" },
  ],

  formFields: [
    { name: "parentName", label: "Full Name", type: "text", placeholder: "e.g., Mr. John Doe", fullWidth: true },
    { name: "phoneNumber", label: "Phone Number", type: "tel", placeholder: "+234 800 000 0000" },
    { name: "email", label: "Email Address", type: "email", placeholder: "parent@email.com" },
    { name: "linkedStudents", label: "Number of Wards", type: "number", placeholder: "e.g., 2" },
  ],

  actions: [
    { label: "View Profile", icon: Eye, type: "view" },
    { label: "Edit Details", icon: Edit, type: "edit" },
    { label: "Remove Parent", icon: Trash2, type: "delete" },
  ],
};

// 3. The Component
export default function  ParentsPage() {
  return (
    <GenericListPage 
      config={parentsConfig} 
      initialData={initialParents} 
    />
  );
}

