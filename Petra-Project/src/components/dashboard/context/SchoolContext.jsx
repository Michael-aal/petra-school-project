import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "./UserContext";
import { normalizeUser } from "../utils/userProfile";
import { authApi } from "../services/authApi";
import { superAdminApi } from "../services/superAdminApi";

const SELECTED_SCHOOL_STORAGE_KEY = "petra_selected_school_id";

export const SchoolContext = createContext({
  selectedSchool: null,
  selectedSchoolId: "",
  setSelectedSchool: () => {},
  setSelectedSchoolId: () => {},
  selectSchool: async () => null,
  clearSelectedSchool: () => {},
  schoolReady: false,
});

export function SchoolProvider({ children }) {
  const { userInfo, authReady, setUserInfo } = useContext(UserContext);

  const [selectedSchoolId, setSelectedSchoolIdState] = useState("");
  const [selectedSchool, setSelectedSchoolState] = useState(null);
  const [schoolReady, setSchoolReady] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    let active = true;

    const initializeSchoolContext = async () => {
      setSchoolReady(false);

      const normalized = normalizeUser(userInfo || {});
      const role = String(normalized?.role || "").toLowerCase();

      // ============================================================
      // SUPER ADMIN
      // ============================================================
      if (role === "super_admin") {
        const userSelectedSchoolId = normalized?.selectedSchoolId
          ? String(normalized.selectedSchoolId)
          : "";

        const storedSchoolId =
          localStorage.getItem(SELECTED_SCHOOL_STORAGE_KEY) || "";

        // Prefer the user's selected school, then localStorage.
        const nextSchoolId = userSelectedSchoolId || storedSchoolId;

        if (!nextSchoolId) {
          if (!active) return;

          setSelectedSchoolIdState("");
          setSelectedSchoolState(null);
          setSchoolReady(true);
          return;
        }

        try {
          const response = await superAdminApi.school(nextSchoolId);

          if (!active) return;

          const school = response?.data || null;

          if (school) {
            const normalizedSchool = {
              ...school,
              id: String(school.id),
            };

            setSelectedSchoolIdState(String(school.id));
            setSelectedSchoolState(normalizedSchool);

            localStorage.setItem(
              SELECTED_SCHOOL_STORAGE_KEY,
              String(school.id)
            );

            // Keep UserContext synchronized too.
            if (
              String(normalized?.selectedSchoolId || "") !==
              String(school.id)
            ) {
              setUserInfo((current) => ({
                ...current,
                selectedSchoolId: String(school.id),
                selectedSchoolName: school.name,
                selectedSchool: normalizedSchool,
              }));
            }
          } else {
            // Stored school no longer exists.
            setSelectedSchoolIdState("");
            setSelectedSchoolState(null);
            localStorage.removeItem(SELECTED_SCHOOL_STORAGE_KEY);
          }
        } catch (error) {
          if (!active) return;

          setSelectedSchoolIdState("");
          setSelectedSchoolState(null);
          localStorage.removeItem(SELECTED_SCHOOL_STORAGE_KEY);
        } finally {
          if (active) {
            setSchoolReady(true);
          }
        }

        return;
      }

      // ============================================================
      // NORMAL SCHOOL USER
      // ============================================================
      if (normalized?.schoolId) {
        const schoolId = String(normalized.schoolId);

        if (!active) return;

        setSelectedSchoolIdState(schoolId);

        setSelectedSchoolState({
          id: schoolId,
          name:
            normalized.schoolName ||
            normalized.school?.name ||
            "",
        });

        setSchoolReady(true);
        return;
      }

      // ============================================================
      // NO SCHOOL CONTEXT
      // ============================================================
      if (!active) return;

      setSelectedSchoolIdState("");
      setSelectedSchoolState(null);
      setSchoolReady(true);
    };

    initializeSchoolContext();

    return () => {
      active = false;
    };
  }, [authReady, userInfo, setUserInfo]);

  // ================================================================
  // SET SCHOOL ID
  // ================================================================
  const setSelectedSchoolId = (schoolId) => {
    const nextId =
      schoolId === undefined || schoolId === null
        ? ""
        : String(schoolId);

    setSelectedSchoolIdState(nextId);

    if (nextId) {
      localStorage.setItem(
        SELECTED_SCHOOL_STORAGE_KEY,
        nextId
      );
    } else {
      localStorage.removeItem(
        SELECTED_SCHOOL_STORAGE_KEY
      );

      setSelectedSchoolState(null);
    }
  };

  // ================================================================
  // SET SCHOOL OBJECT
  // ================================================================
  const setSelectedSchool = (school) => {
    const nextId =
      school?.id === undefined || school?.id === null
        ? ""
        : String(school.id);

    setSelectedSchoolIdState(nextId);

    if (school && nextId) {
      const normalizedSchool = {
        ...school,
        id: nextId,
      };

      setSelectedSchoolState(normalizedSchool);

      localStorage.setItem(
        SELECTED_SCHOOL_STORAGE_KEY,
        nextId
      );
    } else {
      setSelectedSchoolState(null);

      localStorage.removeItem(
        SELECTED_SCHOOL_STORAGE_KEY
      );
    }
  };

  // ================================================================
  // CLEAR SCHOOL
  // ================================================================
  const clearSelectedSchool = () => {
    setSelectedSchoolIdState("");
    setSelectedSchoolState(null);

    localStorage.removeItem(
      SELECTED_SCHOOL_STORAGE_KEY
    );
  };

  // ================================================================
  // SELECT SCHOOL
  // ================================================================
  const selectSchool = async (schoolId) => {
    const nextId =
      schoolId === undefined || schoolId === null
        ? ""
        : String(schoolId);

    if (!nextId) {
      clearSelectedSchool();
      return null;
    }

    try {
      const response = await authApi.selectSchool({
        schoolId: nextId,
      });

      const selected =
        response?.data?.selectedSchool || null;

      if (!selected) {
        throw new Error("Failed to select school");
      }

      const school = {
        ...selected,
        id: String(selected.id),
      };

      // Update React state.
      setSelectedSchoolIdState(String(school.id));
      setSelectedSchoolState(school);

      // IMPORTANT:
      // Persist the selected school so apiClient.js can send:
      // x-school-id
      localStorage.setItem(
        SELECTED_SCHOOL_STORAGE_KEY,
        String(school.id)
      );

      // Keep UserContext synchronized.
      setUserInfo((current) => ({
        ...current,
        selectedSchoolId: String(school.id),
        selectedSchoolName: school.name,
        selectedSchool: school,
      }));

      return school;
    } catch (error) {
      throw error;
    }
  };

  // ================================================================
  // CONTEXT VALUE
  // ================================================================
  const value = useMemo(
    () => ({
      selectedSchool,
      selectedSchoolId,
      setSelectedSchool,
      setSelectedSchoolId,
      selectSchool,
      clearSelectedSchool,
      schoolReady,
    }),
    [
      selectedSchool,
      selectedSchoolId,
      schoolReady,
    ]
  );

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}