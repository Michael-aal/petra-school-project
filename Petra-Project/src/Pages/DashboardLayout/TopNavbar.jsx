import {X, Menu, Bell, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useContext } from "react";
import { UserContext } from "../../context/UserContext";

export default function UserInfo(){

    const {userInfo} = useContext(UserContext);

    return(
        <section>
            <div className="">
                <h1>
                    Welcome {userInfo.fullName}
                </h1>
            </div>
        </section>
    )
}