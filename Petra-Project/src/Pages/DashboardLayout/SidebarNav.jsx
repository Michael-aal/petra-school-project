import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  School,
  BookOpen,
  GraduationCap,
  Users,
  Bus,
  ClipboardCheck,
  FileText,
  BarChart2,
  UserCog,
  CreditCard,
  Receipt,
  Wallet,
  TrendingUp,
  Bell,
  HelpCircle,
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  ClipboardList,
  UserCheck,
  PlusCircle,
  X,
} from "lucide-react";
import "../../Styles/DashBoardLayout/SidebarNav.css";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";
import UserInfo from "./TopNavbar";



const navGroups = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    label: "School Setup",
    icon: School,
    children: [
      { label: "School Profile", icon: School, href: "/setup/profile" },
      { label: "Academic Session", icon: Calendar, href: "/setup/sessions" },
      { label: "Classes", icon: BookOpen, href: "/setup/classes" },
      { label: "Subjects", icon: ClipboardList, href: "/setup/subjects" },
    ],
  },
  {
    label: "Students",
    icon: GraduationCap,
    children: [
      { label: "Students", icon: GraduationCap, href: "/students" },
      { label: "Enrollment", icon: UserCheck, href: "/students/enrollment" },
      { label: "Parents", icon: Users, href: "/students/parents" },
      { label: "Gate Monitoring", icon: UserCheck, href: "/students/gate" },
    ],
  },
  {
    label: "Academics",
    icon: BookOpen,
    children: [
      { label: "Timetable", icon: Calendar, href: "/academics/timetable" },
      { label: "School Bus", icon: Bus, href: "/academics/bus" },
      {
        label: "Attendance",
        icon: ClipboardCheck,
        href: "/academics/attendance",
      },
    ],
  },
  {
    label: "Examination",
    icon: FileText,
    children: [
      { label: "CBT", icon: ClipboardList, href: "/examination/cbt" },
      { label: "Results", icon: BarChart2, href: "/examination/results" },
      {
        label: "Report Cards",
        icon: FileText,
        href: "/examination/reports",
      },
    ],
  },
  {
    label: "Staff",
    icon: UserCog,
    children: [
      { label: "Teachers", icon: UserCog, href: "/staff/teachers" },
      { label: "Admins", icon: UserCog, href: "/staff/admins" },
      {
        label: "Attendance",
        icon: ClipboardCheck,
        href: "/staff/attendance",
      },
    ],
  },
  {
    label: "Finance",
    icon: CreditCard,
    children: [
      { label: "Payments", icon: CreditCard, href: "/finance/payments" },
      { label: "Invoices", icon: Receipt, href: "/finance/invoices" },
      {
        label: "Extra Fees",
        icon: PlusCircle,
        href: "/finance/extra-fees",
      },
      { label: "FlexPay", icon: Wallet, href: "/finance/flexpay" },
      { label: "Cashflow", icon: TrendingUp, href: "/finance/cashflow" },
    ],
  },
  {
    label: "Communication",
    icon: Bell,
    children: [
      {
        label: "Notifications",
        icon: Bell,
        href: "/communication/notifications",
      },
      {
        label: "Support",
        icon: HelpCircle,
        href: "/communication/support",
      },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];


const FIXED_NAV = navGroups;


export function SidebarNav({ onNavigate }) {

  const location = useLocation();


  const [openGroups, setOpenGroups] = useState(() => {

    const initial = {};

    FIXED_NAV.forEach((group) => {

      if (
        group.children?.some((child) =>
          location.pathname.startsWith(child.href)
        )
      ) {
        initial[group.label] = true;
      }

    });

    return initial;

  });


  const toggleGroup = (label) => {

    setOpenGroups((prev)=>({
      ...prev,
      [label]: !prev[label],
    }));

  };


  const isActive = (href)=>
    href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(href);

      //Take care of the user INput
  const {userInfo, setUserInfo} = useContext(UserContext);

  const handleChange = (e) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value
    });
  };

const SchoolNmae = userInfo.institution.split(" ")[0];
const FirstLetterFirstName = userInfo.firstName[0];
const FirstLetterLastNmae = userInfo.lastName[0];

return (
  <div className="">
    <div className="">
      <img src="" alt="" />
      <div className="">
          <h2>{SchoolNmae}</h2>
          <h3>SCHOOL PLATFORM</h3>
      </div>
        <h4><X /></h4>
    </div>

<nav className="sidebar-nav">


{FIXED_NAV.map((item)=>{


if(!item.children){

const active = isActive(item.href);


return (

<NavLink

key={item.label}

to={item.href}

onClick={onNavigate}

className={`sidebar-link ${active ? "active" : ""}`}

>

<item.icon className="sidebar-icon"/>

<span>{item.label}</span>

</NavLink>

);

}



const isOpen = openGroups[item.label];


const groupActive = item.children.some(
(child)=>isActive(child.href)
);



return (

<div key={item.label}>


<button

type="button"

onClick={()=>toggleGroup(item.label)}

className={`sidebar-group ${
groupActive ? "group-active" : ""
}`}

>


<item.icon className="sidebar-icon"/>


<span className="sidebar-title">

{item.label}

</span>



{
isOpen ?

<ChevronDown className="arrow-icon"/>

:

<ChevronRight className="arrow-icon"/>

}



</button>



{
isOpen &&

<div className="sidebar-children">


{
item.children.map((child)=>{


const active = isActive(child.href);



return (

<NavLink

key={child.href}

to={child.href}

onClick={onNavigate}

className={`sidebar-child ${
active ? "active" : ""
}`}

>


<child.icon className="child-icon"/>


<span>{child.label}</span>


</NavLink>

);


})

}



</div>

}


</div>


);


})}



</nav>

<div className="">
  <h2>{FirstLetterFirstName}{FirstLetterLastNmae}</h2>
  <div className="">
    <h3> {userInfo.firstName}</h3>
    <h4>{userInfo.email}</h4>
  </div>
</div>
</div>

)

}