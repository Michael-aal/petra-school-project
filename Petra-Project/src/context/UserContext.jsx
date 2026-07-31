import { createContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi";
import { normalizeUser } from "../utils/userProfile";

export const UserContext = createContext();

export function UserProvider({ children }) {
  // 1. Initialize state cleanly from localStorage or as an empty object
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const cached = window.localStorage.getItem("petra_user_info");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  // 2. Sync userInfo to localStorage whenever it updates
  useEffect(() => {
    if (Object.keys(userInfo).length > 0) {
      window.localStorage.setItem("petra_user_info", JSON.stringify(userInfo));
    }
  }, [userInfo]);

  // 3. Fetch user data on app mount
  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((response) => {
        if (!active) return;
        setAuthError(null);
        
        // The backend should return the user object. 
        // For parents, Michael (backend) should include a `children` array here.
        // For admins, it should include `totalStudent` if available.
        const userData = response.user || {};

        setUserInfo((current) =>
          normalizeUser({
            ...current,
            ...userData,
            profileImage: userData?.profileImage || userData?.profilePicture || current?.profileImage,
            // Fallback to 0 if backend doesn't provide totalStudent yet
            totalStudent: userData?.totalStudent ?? 0, 
          })
        );
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error);
        
        // If unauthorized, clear the cache and reset state
        if (error?.status === 401) {
          window.localStorage.removeItem("petra_user_info");
          setUserInfo({});
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // 4. Provide the context value (Removed fake students state entirely)
  const value = useMemo(
    () => ({ 
      userInfo, 
      setUserInfo, 
      authReady, 
      authError 
    }),
    [userInfo, authReady, authError]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}