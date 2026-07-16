import {X, Menu, Bell, User, ChevronDown } from "lucide-react";
export default function UserInfo(){

    const userImg = <User /> // User img will be here;
    const userFirstName = "Temioluwa" // User First name
    const UserFullName = "Temioluwa Oluwasijuwomi" // User full Name
    const schoolName = "Petra Schools" // School Nmae
    const userGmail = "petraschoolsota@gmail.com" // User Email

    return(
        <section style={{display: "none"}}>
            <div className="">
            <div className="">
                <h2><Menu /></h2>
                <h2><X /></h2>
            </div>
            <div className="">
                <h2><Bell /></h2>
                <h2>{userImg}</h2>
                <h3>Hi, {userFirstName}</h3>
                <h2><ChevronDown /></h2>
            </div>
            </div>

            <div className="">
                <h2>User Profile  <X /></h2>

                <div className="">
                    <h2>{userImg}</h2>

                    <div className="">
                            <h3>{UserFullName}</h3>
                            <h4>{schoolName}</h4>
                            <h5>{userGmail}</h5>
                    </div>
                </div>
            </div>
        </section>
    )
}