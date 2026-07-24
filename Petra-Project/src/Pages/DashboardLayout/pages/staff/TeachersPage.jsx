import GenericListPage from "../../GenericListPage/GenericListPage";
 import { useContext } from "react";
import { UserContext } from "../../../../context/UserContext";
import { UserCog, Users, UserCheck, Eye, BookOpen, Trash2 } from "lucide-react"; // Import the reusable component

const initialTeachers = [
  { id: 1, fullName: "Mr. Adebayo", subject: "Mathematics", phone: "08012345678", status: "Active" },
  { id: 2, fullName: "Mrs. Okonkwo", subject: "English", phone: "08087654321", status: "Active" },
  { id: 3, fullName: "Mr. Ibrahim", subject: "Physics", phone: "08011223344", status: "On Leave" },
];

const teacherConfig = {
  title: "Teachers",
  singularName: "Teacher",
  description: "Manage all teaching staff and their assignments",
  icon: UserCog,
  stats: [
    { label: "Total Teachers", value: (data) => data.length, icon: Users, color: "blue" },
    { label: "Active Staff", value: (data) => data.filter(t => t.status === "Active").length, icon: UserCheck, color: "green" },
  ],
  columns: [
    { key: "avatar", label: "Teacher" },
    { key: "subject", label: "Subject" },
    { key: "phone", label: "Phone Number" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", align: "right" },
  ],
  formFields: [
    { name: "fullName", label: "Full Name", type: "text", placeholder: "e.g. Mr. John Doe", fullWidth: true },
    { name: "subject", label: "Subject", type: "select", options: ["Mathematics", "English", "Physics", "Chemistry", "Biology"] },
    { name: "phone", label: "Phone Number", type: "text", placeholder: "e.g. 08012345678" },
    { name: "status", label: "Status", type: "select", options: ["Active", "On Leave", "Inactive"] },
  ],
  actions: [
    { label: "View Profile", icon: Eye, type: "view" },
    { label: "Edit Details", icon: BookOpen, type: "edit" },
    { label: "Remove Teacher", icon: Trash2, type: "delete" },
  ],
};

export default function  TeachersPage() {
  const { setUserInfo } = useContext(UserContext); // Optional: if you want to sync total counts

  const handleDataChange = (updatedData) => {
   setUserInfo(prev => ({ ...prev, totalTeachers: updatedData.length }));
  };

  return (
    <GenericListPage 
      config={teacherConfig} 
      initialData={initialTeachers} 
      onDataChange={handleDataChange} 
    />
  );
}
