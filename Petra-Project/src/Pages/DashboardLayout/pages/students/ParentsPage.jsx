import { Users, UserCheck, Phone, Mail, Eye, Trash2, Edit, Link as LinkIcon, RefreshCcw, Download, ShieldOff, Key, Filter } from "lucide-react";
import GenericListPage from "../../GenericListPage/GenericListPage"; // Adjust path as needed
import "../page-styles/ParentsPage.css";

// 1. Initial Mock Data (Just for the Admin UI to look good right now)
const initialParents = [
  {
    id: 1,
    name: "Mr. Ogunleye Kayode",
    phoneNumber: "+234 801 234 5678",
    email: "ogunleye.k@gmail.com",
    linkedStudents: 2,
    status: "Active",
    address: "12 Isaac Street, Lekki, Lagos",
    children: [
      { id: 101, name: "Oluwaseun Kayode", admissionNumber: "A-2023-001", className: "JSS2", status: "Active" },
      { id: 102, name: "Adeola Kayode", admissionNumber: "A-2024-004", className: "JSS1", status: "Active" },
    ],
  },
  {
    id: 2,
    name: "Mrs. Adebayo Vitor",
    phoneNumber: "+234 802 345 6789",
    email: "vitor.adebayo@yahoo.com",
    linkedStudents: 1,
    status: "Pending",
    address: "45 Awolowo Road, Ikeja, Lagos",
    children: [
      { id: 103, name: "Bolanle Vitor", admissionNumber: "A-2023-019", className: "SS1", status: "Active" },
    ],
  },
  {
    id: 3,
    name: "Chief Fakorade",
    phoneNumber: "+234 803 456 7890",
    email: "fakorade.chief@outlook.com",
    linkedStudents: 3,
    status: "Active",
    address: "9 Marina Crescent, Victoria Island, Lagos",
    children: [
      { id: 104, name: "Femi Fakorade", admissionNumber: "A-2022-010", className: "SS3", status: "Active" },
      { id: 105, name: "Tomi Fakorade", admissionNumber: "A-2023-022", className: "JSS3", status: "Active" },
      { id: 106, name: "Sade Fakorade", admissionNumber: "A-2024-048", className: "JSS1", status: "Pending" },
    ],
  },
];

// 2. The Configuration
const parentsConfig = {
  title: "Parents & Guardians",
  singularName: "Parent",
  description: "Manage parent contacts, linked children, and portal access for your school community.",
  icon: Users,

  stats: [
    { label: "Total Parents", value: (data) => data.length, icon: Users, color: "blue" },
    { label: "Total Wards", value: (data) => data.reduce((sum, p) => sum + (Number(p.linkedStudents) || 0), 0), icon: UserCheck, color: "green" },
    { label: "Active Parents", value: (data) => data.filter((p) => p.status === "Active").length, icon: ShieldOff, color: "blue" },
    { label: "Pending Invitations", value: (data) => data.filter((p) => p.status === "Pending").length, icon: Key, color: "yellow" },
  ],

  toolbarActions: [
    { label: "Filter", icon: Filter, variant: "secondary", onClick: () => window.alert("Filter controls are available in the admin dashboard.") },
    { label: "Refresh", icon: RefreshCcw, variant: "secondary", onClick: () => window.alert("Refresh will reload the parent list in the live dashboard.") },
    { label: "Export", icon: Download, variant: "secondary", onClick: () => window.alert("Export will download the parent list when available.") },
  ],

  columns: [
    { key: "avatar", label: "Parent" },
    {
      key: "email",
      label: "Email",
      render: (item) => (
        <span className="parent-email">
          <Mail size={14} className="parent-email-icon" />
          <span className="parent-email-address">{item.email}</span>
        </span>
      ),
    },
    {
      key: "phoneNumber",
      label: "Phone",
      render: (item) => (
        <span className="parent-phone">
          <Phone size={14} className="parent-phone-icon" />
          <span>{item.phoneNumber || "—"}</span>
        </span>
      ),
    },
    {
      key: "linkedStudents",
      label: "Linked Wards",
      render: (item) => (
        <span className="parent-linked-wards">
          <UserCheck size={14} /> {item.linkedStudents || 0} Wards
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item) => (
        <span className={`status-badge status-${String(item.status || "unknown").toLowerCase()}`}>
          {item.status || "Unknown"}
        </span>
      ),
    },
    { key: "actions", label: "Actions", align: "right" },
  ],

  formFields: [
    { name: "name", label: "Full Name", type: "text", placeholder: "e.g., Mr. John Doe", fullWidth: true },
    { name: "email", label: "Email Address", type: "email", placeholder: "parent@email.com" },
    { name: "phoneNumber", label: "Phone Number", type: "tel", placeholder: "+234 800 000 0000" },
    { name: "address", label: "Address", type: "text", placeholder: "Parent address" },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "Select status",
      options: ["Active", "Pending", "Disabled"],
    },
    { name: "linkedStudents", label: "Number of Wards", type: "number", placeholder: "e.g., 2" },
  ],

  actions: [
    { label: "View Parent", icon: Eye, type: "view" },
    { label: "Edit Parent", icon: Edit, type: "edit" },
    { label: "View Children", icon: Users, type: "viewChildren" },
    { label: "Send Portal Invitation", icon: LinkIcon, type: "sendLink" },
    { label: "Reset Password", icon: Key, type: "resetPassword" },
    { label: "Disable Account", icon: ShieldOff, type: "disable" },
    { label: "Delete Parent", icon: Trash2, type: "delete" },
  ],
  emptyState: {
    icon: Users,
    title: "No parents found yet",
    description: "Add your first parent or guardian to start managing family contacts and portal access.",
    action: {
      label: "Add Parent",
      onClick: () => window.alert("Open the Add Parent form in the admin dashboard."),
    },
  },
};

export default function ParentsPage() {
  return (
    <div className="parents-page">
      <GenericListPage 
        config={parentsConfig} 
        initialData={initialParents} 
      />
    </div>
  );
}