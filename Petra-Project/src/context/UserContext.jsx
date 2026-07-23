/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi";
import { normalizeUser } from "../utils/userProfile";

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
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const cached = window.localStorage.getItem("petra_user_info");
      return cached
        ? normalizeUser(JSON.parse(cached))
        : normalizeUser({ institution: "My School", totalStudent: defaultStudents.length });
    } catch {
      return normalizeUser({ institution: "My School", totalStudent: defaultStudents.length });
    }
  });
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Global students state
  const [students, setStudents] = useState(defaultStudents);

  useEffect(() => {
    window.localStorage.setItem("petra_user_info", JSON.stringify(userInfo));
  }, [userInfo]);

  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((response) => {
        if (!active) return;
        setUserInfo((current) =>
          normalizeUser({
            ...current,
            ...response.user,
            profileImage: response.user?.profileImage || response.user?.profilePicture || current.profileImage,
            totalStudent: defaultStudents.length,
          }),
        );
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error);
        setUserInfo((current) =>
          normalizeUser({
            ...current,
            totalStudent: defaultStudents.length,
          }),
        );
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const userInfoWithTotals = useMemo(
    () => ({ ...userInfo, totalStudent: students.length }),
    [userInfo, students.length],
  );

  const value = useMemo(
    () => ({ userInfo: userInfoWithTotals, setUserInfo, students, setStudents, authReady, authError }),
    [userInfoWithTotals, students, authReady, authError],
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
