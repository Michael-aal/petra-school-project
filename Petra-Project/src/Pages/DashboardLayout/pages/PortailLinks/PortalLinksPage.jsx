import { useEffect, useState } from "react";
import { ShieldCheck, Users, CheckCircle2, Clock, Link as LinkIcon, Mail } from "lucide-react";
import GenericListPage from "../../GenericListPage/GenericListPage";
import "./PortalLinksPage.css";
import { studentApi } from "../../../../services/studentApi";

const emptyParents = [];

export default function PortalLinksPage() {
  const [parents, setParents] = useState(emptyParents);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchParents = async () => {
      try {
        const response = await studentApi.list({ limit: 200 });
        const students = (response.students || []).filter((student) => Boolean(student.parentId));

        const parentMap = new Map();

        students.forEach((student) => {
          const parentKey = student.parentId;
          const existing = parentMap.get(parentKey) || {
            id: student.parentId,
            name: student.guardianName || student.parentEmail || "Guardian",
            email: student.parentEmail || "",
            linkedStudents: 0,
            inviteStatus: student.parentAccessCodeUsed ? "Active" : "Pending",
            lastInvited: student.parentAccessCodeUsed ? "Linked" : "Pending",
          };

          existing.linkedStudents += 1;
          if (student.parentAccessCodeUsed) {
            existing.inviteStatus = "Active";
            existing.lastInvited = "Linked";
          }

          parentMap.set(parentKey, existing);
        });

        if (!active) return;
        setParents(Array.from(parentMap.values()));
      } catch (error) {
        if (!active) return;
        setParents(emptyParents);
      }
    };

    fetchParents();
    return () => {
      active = false;
    };
  }, []);

  const handleCopyLink = (parent) => {
    const loginUrl = `${window.location.origin}/signin?email=${encodeURIComponent(parent.email)}`;
    navigator.clipboard.writeText(loginUrl);
    setCopiedId(parent.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parentsConfig = {
    title: "Parent Portal Access",
    singularName: "Parent",
    description: "Manage invitations and distribute secure login links to parents.",
    icon: ShieldCheck,
    stats: [
      { label: "Total Parents", value: (data) => data.length, icon: Users, color: "blue" },
      { label: "Active Accounts", value: (data) => data.filter((p) => p.inviteStatus === "Active").length, icon: CheckCircle2, color: "green" },
      { label: "Pending Invites", value: (data) => data.filter((p) => p.inviteStatus === "Pending").length, icon: Clock, color: "yellow" },
    ],
    toolbarActions: [
      { label: "Refresh", icon: LinkIcon, variant: "secondary", onClick: () => window.location.reload() },
    ],
    columns: [
      { key: "avatar", label: "Parent" },
      { key: "email", label: "Email", render: (item) => <span className="parent-email">{item.email || "—"}</span> },
      { key: "linkedStudents", label: "Linked Wards", render: (item) => <span>{item.linkedStudents || 0} Wards</span> },
      { key: "inviteStatus", label: "Status", render: (item) => <span className={`status-badge status-${String(item.inviteStatus || "unknown").toLowerCase()}`}>{item.inviteStatus}</span> },
      { key: "lastInvited", label: "Last Invited", render: (item) => <span>{item.lastInvited || "—"}</span> },
      { key: "actions", label: "Actions", align: "right" },
    ],
    actions: [
      { label: copiedId ? "Copied!" : "Copy Link", icon: LinkIcon, onClick: (item) => handleCopyLink(item) },
      { label: "Send Email", icon: Mail, type: "sendLink" },
      { label: "Delete", icon: CheckCircle2, type: "delete" },
    ],
    emptyState: {
      icon: Users,
      title: "No parents found",
      description: "Try adjusting your search or add parent records.",
    },
  };

  return (
    <div className="portal-links-page">
      <GenericListPage config={parentsConfig} initialData={parents} />
    </div>
  );
}