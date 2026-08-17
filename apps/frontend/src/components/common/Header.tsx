import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"

export function ButtonDefault() {
  return <Button>Button</Button>
}


const Header = () => {

  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    setIsLoggedIn(!!token);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/signin");
  }

  return (
    <header className="w-full h-[72px] sticky top-0 bg-white border-b border-gray-200 z-50">
        <nav className="flex w-full justify-between px-8 py-4 items-center">
            <div className="flex items-center gap-2">
                <img width="32" height="32" src="/logo.png" alt="Logo"></img>
                <span className="text-xl font-semibold">Taskly</span>
            </div>
            {
                isLoggedIn ?(
                            <Button 
                                className="px-2 py-2 md:py-4 lg:px-8" 
                                onClick={handleLogout}>
                                sign out
                            </Button>
                            )
                           :(
                            <Button
                                className="px-2 py-2 md:py-4 lg:py-8"
                                onClick={() => navigate("/signin")}
                            >
                                sign in
                            </Button> 
                            )

            }
        </nav>
    </header>
  )
}

export default Header
