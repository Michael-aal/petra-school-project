import { createContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/authApi";
import { normalizeUser } from "../utils/userProfile";

export const UserContext = createContext();

const emptyUser = () => normalizeUser({});

export function UserProvider({ children }) {
  const [userInfo, setUserInfo] = useState(emptyUser);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  const clearSession = () => {
    setUserInfo(emptyUser());
    setAuthError(null);
  };

  useEffect(() => {
    let active = true;

    authApi
      .me()
      .then((response) => {
        if (!active) return;
        setAuthError(null);
        setUserInfo(normalizeUser(response.user || {}));
      })
      .catch((error) => {
        if (!active) return;
        setAuthError(error);
        clearSession();
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      userInfo,
      setUserInfo: (updater) => {
        setUserInfo((current) => {
          const nextValue = typeof updater === "function" ? updater(current) : updater;
          return normalizeUser(nextValue || {});
        });
      },
      authReady,
      authError,
      clearSession,
    }),
    [userInfo, authReady, authError],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
