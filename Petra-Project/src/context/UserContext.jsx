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
    // No "active" cleanup guard here: under StrictMode's double effect
    // invocation the surviving response can belong to the cleaned-up closure,
    // which would leave authReady stuck at false. /me is idempotent, so
    // applying whichever response resolves is always safe.
    authApi
      .me()
      .then((response) => {
        setAuthError(null);
        setUserInfo(normalizeUser(response.user || {}));
      })
      .catch((error) => {
        setAuthError(error);
        clearSession();
      })
      .finally(() => {
        setAuthReady(true);
      });
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
