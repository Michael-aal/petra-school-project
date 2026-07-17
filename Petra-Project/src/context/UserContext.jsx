import { createContext, useState } from "react";

export const UserContext = createContext();

export function UserProvider({ children}) {

    const [userInfo, setUserInfo] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        institution: "",
        state: "",
        city: "",
        referral: "",
    })

    return(

        <UserContext.Provider 
        value={{
            userInfo,
            setUserInfo,
        }}
        >
            {children}
        </UserContext.Provider>
    )
}