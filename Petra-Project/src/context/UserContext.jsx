import { createContext, useState } from "react";

export const UserContext = createContext();

// This is our single source of truth for students
const defaultStudents = [
  {
    id: 1, studentName: "Ogunleye Kayode", studentNameLogo: "OK",
    studentClass: "SS2", studentParentName: "Ogunleye",
    studentFeeStatus: "Paid", studentStatus: "Active", studentGender: "Male"
  },
  {
    id: 2, studentName: "Adebayo Vitor", studentNameLogo: "AV",
    studentClass: "SS2", studentParentName: "Adebayo",
    studentFeeStatus: "Unpaid", studentStatus: "Active", studentGender: "Female"
  },
  {
    id: 3, studentName: "Feyishikemi Ifekorode", studentNameLogo: "FI",
    studentClass: "SS2", studentParentName: "Fakorade",
    studentFeeStatus: "Partial", studentStatus: "Active", studentGender: "Female"
  }
];

export function UserProvider({ children }) {
  const [userInfo, setUserInfo] = useState({
    firstName: "Admin", // Added default so it doesn't show blank
    lastName: "",
    email: "",
    phoneNumber: "",
    institution: "My School",
    state: "",
    city: "",
    referral: "",
    schoolCode: "",
    address: "",
    country: "",
    profileImage: "",
    totalStudent: defaultStudents.length, // Synced initially
  });

  // Global students state
  const [students, setStudents] = useState(defaultStudents);

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, students, setStudents }}>
      {children}
    </UserContext.Provider>
  );
}