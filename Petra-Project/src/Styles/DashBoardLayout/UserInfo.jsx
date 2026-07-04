import {X, Menu, Bell, User, ChevronDown } from "lucide-react";
export default function UserInfo(){

    return(
        <section>
            <div className="">
            <div className="">
                <h2><Menu /></h2>
                <h2><X /></h2>
            </div>
            <div className="">
                <h2><Bell /></h2>
                <h2><User /></h2>
                <h3>Hi, Temiloluwa</h3>
                <h2><ChevronDown /></h2>
            </div>
            </div>

            <div className="">
                <h2>User Profile  <X /></h2>

                <div className="">
                    <h2>{}</h2>
                </div>
            </div>
        </section>
    )
}