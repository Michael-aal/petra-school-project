import { createContext, useEffect, useMemo, useState } from "react";
import { authApi, readAuthToken } from "../../../services/authApi";
import { normalizeUser } from "../../../utils/userProfile";

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
    /*
     * Do not call /api/auth/me when there is no token.
     *
     * This is important because UserProvider is loaded globally,
     * including on the Sign In page.
     */
    const token = readAuthToken();

    if (!token) {
      clearSession();
      setAuthReady(true);
      return;
    }

    /*
     * A token exists, so it is safe to verify the session.
     */
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
          const nextValue =
            typeof updater === "function"
              ? updater(current)
              : updater;

          return normalizeUser(nextValue || {});
        });
      },

      authReady,
      authError,
      clearSession,
    }),
    [userInfo, authReady, authError],
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}