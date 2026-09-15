import { useContext, useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, School, BookOpen, GraduationCap, Users, Bus, ClipboardCheck, FileText, BarChart2, UserCog, CreditCard, Receipt, Wallet, TrendingUp, Bell, Megaphone, HelpCircle, MessageSquare, Settings, Download, ChevronDown, ChevronRight, Calendar, ClipboardList, UserCheck, PlusCircle, X, LogOut, ShieldCheck, Sparkles, Rocket, BriefcaseBusiness } from "lucide-react";
import "../../Styles/DashBoardLayout/SidebarNav.css";
import { UserContext } from "../../context/UserContext";
import { authApi } from "../../services/authApi";
import { notificationApi } from "../../services/notificationApi";
import { getDisplayName, normalizeUser } from "../../utils/userProfile";
import UserAvatar from "../../components/UserAvatar";

const navGroups = [
  { label:"Nuvora", icon:Sparkles, href:"/dashboard/ask-nuvora" }, { label:"Get Started", icon:Rocket, href:"/dashboard/get-started" }, { label:"Dashboard", icon:LayoutDashboard, href:"/dashboard" },
  { label:"Overview", icon:BarChart2, children:[{label:"Live Overview",icon:BarChart2,href:"/dashboard/overview/live"},{label:"Daily Reports",icon:Calendar,href:"/dashboard/overview/daily"},{label:"Term Summary",icon:TrendingUp,href:"/dashboard/overview/term"}] },
  { label:"School Setup", icon:School, children:[{label:"School Profile",icon:School,href:"/dashboard/setup/profile"},{label:"Academic Session",icon:Calendar,href:"/dashboard/setup/sessions"},{label:"Classes",icon:BookOpen,href:"/dashboard/setup/classes"},{label:"Subjects",icon:ClipboardList,href:"/dashboard/setup/subjects"}] },
  { label:"Students", icon:GraduationCap, children:[{label:"Students",icon:GraduationCap,href:"/dashboard/students"},{label:"Applicants",icon:GraduationCap,href:"/dashboard/students/applicants"},{label:"Enrollment",icon:UserCheck,href:"/dashboard/students/enrollment"},{label:"Parents",icon:Users,href:"/dashboard/students/parents"},{label:"Gate Monitoring",icon:UserCheck,href:"/dashboard/students/gate"}] },
  { label:"Academics", icon:BookOpen, children:[{label:"Timetable",icon:Calendar,href:"/dashboard/academics/timetable"},{label:"School Bus",icon:Bus,href:"/dashboard/academics/bus"},{label:"Attendance",icon:ClipboardCheck,href:"/dashboard/academics/attendance"}] },
  { label:"Examination", icon:FileText, children:[{label:"CBT",icon:ClipboardList,href:"/dashboard/examination/cbt"},{label:"Results",icon:BarChart2,href:"/dashboard/examination/results"},{label:"Report Cards",icon:FileText,href:"/dashboard/examination/reports"}] },
  { label:"Staff", icon:UserCog, children:[{label:"Teachers",icon:UserCog,href:"/dashboard/staff/teachers"},{label:"Teacher Applications",icon:BriefcaseBusiness,href:"/dashboard/staff/management?view=applications"},{label:"Admins",icon:UserCog,href:"/dashboard/staff/admins"},{label:"Staff Management",icon:UserCog,href:"/dashboard/staff/management"},{label:"Attendance",icon:ClipboardCheck,href:"/dashboard/staff/attendance"}] },
  { label:"Finance", icon:CreditCard, children:[{label:"Payments",icon:CreditCard,href:"/dashboard/finance/payments"},{label:"Invoices",icon:Receipt,href:"/dashboard/finance/invoices"},{label:"Extra Fees",icon:PlusCircle,href:"/dashboard/finance/extra-fees"},{label:"Wallet",icon:Wallet,href:"/dashboard/finance/wallet"},{label:"FlexPay",icon:Wallet,href:"/dashboard/finance/flexpay"},{label:"Cashflow",icon:TrendingUp,href:"/dashboard/finance/cashflow"}] },
  { label:"Communication", icon:Bell, children:[{label:"Notifications",icon:Bell,href:"/dashboard/communication/notifications"},{label:"Announcements",icon:Bell,href:"/dashboard/communication/announcements"},{label:"Messages",icon:MessageSquare,href:"/dashboard/communication/messages"},{label:"Support",icon:HelpCircle,href:"/dashboard/communication/support"}] },
  { label:"Links", icon:ShieldCheck, href:"/dashboard/students/parent-links" }, { label:"Settings", icon:Settings, href:"/dashboard/settings" },
];

const staffNavGroups = [
  {label:"Nuvora",icon:Sparkles,href:"/staff/ask-nuvora"},
  {label:"Dashboard",icon:LayoutDashboard,href:"/staff/dashboard"},
  {label:"My Classes",icon:School,href:"/staff/classes"},
  {label:"Students",icon:GraduationCap,href:"/staff/students"},
  {label:"Attendance",icon:ClipboardCheck,href:"/staff/attendance"},
  {label:"Assessments",icon:ClipboardList,href:"/staff/assessments"},
  {label:"Results",icon:FileText,href:"/staff/results"},
  {label:"Communication",icon:MessageSquare,children:[
    {label:"Notifications",icon:Bell,href:"/staff/notifications"},
    {label:"Announcements",icon:Megaphone,href:"/staff/announcements"},
    {label:"Messages",icon:MessageSquare,href:"/staff/messages"},
    {label:"Support",icon:HelpCircle,href:"/dashboard/communication/support"},
  ]},
  {label:"Profile",icon:UserCog,href:"/staff/profile"},
  {label:"Settings",icon:Settings,href:"/staff/settings"},
  {label:"Logout",icon:LogOut,href:"/signin"},
];
const portalNavGroups = [
  {label:"Nuvora",icon:Sparkles,href:"/portal/ask-nuvora"},{label:"Dashboard",icon:LayoutDashboard,href:"/portal/dashboard"},{label:"Attendance",icon:ClipboardCheck,href:"/portal/attendance"},{label:"Results",icon:FileText,href:"/portal/results"},{label:"Assignments",icon:ClipboardList,href:"/portal/assignments"},{label:"Fees",icon:CreditCard,href:"/portal/fees"},{label:"Announcements",icon:Megaphone,href:"/portal/announcements"},{label:"Messages",icon:MessageSquare,href:"/portal/messages"},{label:"Support",icon:HelpCircle,href:"/dashboard/communication/support"},{label:"Downloads",icon:Download,href:"/portal/downloads"},{label:"Profile",icon:UserCog,href:"/portal/profile"},{label:"Settings",icon:Settings,href:"/portal/settings"},{label:"Logout",icon:LogOut,href:"/signin"},
];

const normalizeRole = (role) => String(role || "").toLowerCase().replace(/\s+/g, "_");

const sectionForNav = (label, href = "") => {
  const key = String(label || "").toLowerCase();
  if (key === "notifications") return "notifications";
  if (key === "announcements") return "announcements";
  if (key === "messages") return "messages";
  if (key === "results" || key === "report cards") return "results";
  if (key === "payments" || key === "invoices" || key === "extra fees" || key === "wallet" || key === "flexpay" || key === "cashflow" || key === "fees") return "payments";
  if (key === "attendance") return "attendance";
  if (key === "assignments") return "assignments";
  if (key === "applicants" || key === "enrollment" || key === "teacher applications") return "admissions";
  if (key === "students" || key === "parents" || key === "gate monitoring") return "students";
  if (key === "teachers" || key === "admins" || key === "staff management" || key === "my classes") return "staff";
  if (key === "support") return "support";
  if (/results/.test(href)) return "results";
  if (/attendance/.test(href)) return "attendance";
  if (/announcement/.test(href)) return "announcements";
  if (/message/.test(href)) return "messages";
  if (/payment|invoice|fee|wallet|flexpay|cashflow/.test(href)) return "payments";
  return null;
};

const attentionDotStyle = { width: 7, height: 7, minWidth: 7, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 0 2px rgba(239,68,68,.12)", marginLeft: "auto" };

export function SidebarNav({onNavigate,collapsed=false,onClose}) {
  const location=useLocation(); const {userInfo,setUserInfo}=useContext(UserContext); const navigate=useNavigate();
  const schoolName=userInfo?.schoolName||userInfo?.institution||"Nuvora";
  const normalizedRole=normalizeRole(userInfo?.role);
  const isStaffRole=["staff","teacher","teacher_staff"].includes(normalizedRole);
  const isParentRole=normalizedRole==="parent";
  const isStudentRole=normalizedRole==="student";
  const isPortalRole=isParentRole||isStudentRole;
  const navItems=isStaffRole?staffNavGroups:isPortalRole?portalNavGroups:(location.pathname.startsWith("/staff")?staffNavGroups:location.pathname.startsWith("/portal")?portalNavGroups:navGroups);
  const [openGroups,setOpenGroups]=useState(()=>{const initial={}; navItems.forEach((group)=>{if(group.children?.some((child)=>location.pathname.startsWith(child.href.split("?")[0])))initial[group.label]=true;}); return initial;});
  const [unreadSummary,setUnreadSummary]=useState({total:0,bySection:{}});

  const loadUnreadSummary = async () => {
    try { const data = await notificationApi.unreadSummary(); setUnreadSummary(data || { total: 0, bySection: {} }); } catch { /* Badge state is non-blocking UI. */ }
  };

  useEffect(() => { let active = true; const run = async () => { if (!active) return; await loadUnreadSummary(); }; run(); const timer = window.setInterval(run, 30000); return () => { active = false; window.clearInterval(timer); }; }, [userInfo?.id]);

  useEffect(() => {
    const path = location.pathname;
    let section = null;
    if (/communication\/notifications|^\/staff\/notifications|^\/portal\/notifications/.test(path)) section = "notifications";
    else if (/announcements/.test(path)) section = "announcements";
    else if (/messages/.test(path)) section = "messages";
    else if (/results|report/.test(path)) section = "results";
    else if (/payment|invoice|extra-fee|fees|wallet|flexpay|cashflow/.test(path)) section = "payments";
    else if (/attendance/.test(path)) section = "attendance";
    else if (/assignments/.test(path)) section = "assignments";
    else if (/applicants|enrollment/.test(path)) section = "admissions";
    else if (/students/.test(path)) section = "students";
    else if (/staff\/(teachers|admins|management)|\/staff\/classes/.test(path)) section = "staff";
    else if (/support/.test(path)) section = "support";
    if (!section) return;
    let cancelled = false;
    notificationApi.markSectionRead(section).then(() => { if (!cancelled) loadUnreadSummary(); }).catch(() => {});
    return () => { cancelled = true; };
  }, [location.pathname]);

  const badgeFor = (label, href = "") => { const section = sectionForNav(label, href); return section ? Boolean(unreadSummary?.bySection?.[section]) : false; };
  const toggleGroup=(label)=>setOpenGroups((prev)=>({...prev,[label]:!prev[label]}));
  const isActive=(href)=>{const path=href.split("?")[0]; return path==="/dashboard"||path==="/"?location.pathname===path:location.pathname.startsWith(path)&&(!href.includes("?")||new URLSearchParams(location.search).toString()===href.split("?")[1]);};
  const handleLogout=async()=>{try{await authApi.logout();}catch{}finally{try{window.sessionStorage.removeItem("petra_user_info");}catch{}try{window.localStorage.removeItem("petra_user_info");}catch{}try{setUserInfo(normalizeUser({}));}catch{}navigate("/signin",{replace:true});}};
  const workspaceItems=navItems.filter((item)=>!["Nuvora","Links","Settings","Logout"].includes(item.label));
  const utilityItems=navItems.filter((item)=>["Links","Settings"].includes(item.label));
  const assistantHref=isStaffRole?"/staff/ask-nuvora":isPortalRole?"/portal/ask-nuvora":"/dashboard/ask-nuvora";
  const renderAttention = (label, href) => badgeFor(label, href) ? <span aria-label={`Unread ${label}`} title={`Unread ${label}`} style={attentionDotStyle}/> : null;

  const renderNavItem=(item)=>{
    if(!item.children){if(item.label==="Logout")return <button key={item.label} data-tooltip={item.label} aria-label={item.label} onClick={()=>{onNavigate?.();handleLogout();}} className="sidebar-link"><item.icon className="sidebar-icon"/><span className="sidebar-label">{item.label}</span></button>;
      const useGroupStyle=["Get Started","Dashboard"].includes(item.label); return <NavLink key={item.label} to={item.href} data-tooltip={item.label} aria-label={item.label} onClick={onNavigate} className={`sidebar-link ${useGroupStyle?"sidebar-group":""} ${isActive(item.href)?"active group-active":""}`}><item.icon className="sidebar-icon"/><span className={useGroupStyle?"sidebar-title sidebar-label":"sidebar-label"}>{item.label}</span>{renderAttention(item.label,item.href)}</NavLink>;}
    const isOpen=openGroups[item.label]; const groupActive=item.children.some((child)=>isActive(child.href)); const groupHasAttention=item.children.some((child)=>badgeFor(child.label,child.href)); return <div key={item.label} className="sidebar-group-wrap"><button type="button" data-tooltip={item.label} aria-label={item.label} onClick={()=>toggleGroup(item.label)} className={`sidebar-group has-children ${groupActive?"group-active":""}`}><item.icon className="sidebar-icon"/><span className="sidebar-title sidebar-label">{item.label}</span>{groupHasAttention && <span aria-label={`Unread ${item.label}`} title={`Unread ${item.label}`} style={attentionDotStyle}/>} {isOpen?<ChevronDown className="arrow-icon"/>:<ChevronRight className="arrow-icon"/>}</button>{isOpen||collapsed?<div className="sidebar-children">{item.children.map((child)=><NavLink key={child.href} to={child.href} data-tooltip={child.label} aria-label={child.label} onClick={onNavigate} className={`sidebar-child ${isActive(child.href)?"active":""}`}><child.icon className="child-icon"/><span className="child-label">{child.label}</span>{renderAttention(child.label,child.href)}</NavLink>)}</div>:null}</div>;
  };
  return <div className={`sidebar-container ${collapsed?"collapsed":""}`}><div className="sidebar-header"><div className="sidebar-contaner-logo" aria-label="School logo"><School size={20}/></div><div className="sidebar-brand"><h2 className="brand-title">{schoolName.toUpperCase()}</h2><h3 className="brand-sub">School Platform</h3></div><button className="sidebar-close" onClick={onClose} aria-label="Close sidebar"><X size={18}/></button></div><nav className="sidebar-nav" aria-label="Main navigation"><div className="sidebar-section-label">AI</div><NavLink to={assistantHref} data-tooltip="Nuvora" aria-label="Nuvora" onClick={onNavigate} className={`sidebar-assistant ${isActive(assistantHref)?"active":""}`}><span className="sidebar-assistant-icon"><Sparkles size={16}/></span><span className="sidebar-label">Nuvora</span></NavLink><div className="sidebar-section-label">Workspace</div>{workspaceItems.map(renderNavItem)}<div className="sidebar-section-label">System</div>{utilityItems.map(renderNavItem)}</nav><div className="sidebar-footer"><UserAvatar user={userInfo} size={32} className="sidebar-avatar"/><div className="sidebar-user"><h3>{getDisplayName(userInfo)}</h3><h4>{userInfo?.role||"Team member"}</h4></div></div></div>;
}
