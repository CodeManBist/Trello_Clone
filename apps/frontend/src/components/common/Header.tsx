import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <header className="w-full h-[72px] sticky top-0 bg-white border-b border-gray-200 z-50">
        <nav className="flex w-full justify-between px-8 py-4 items-center">
            <div className="flex items-center gap-2">
                <img width="32" height="32" src="/logo.png" alt="Logo"></img>
                <span className="text-xl font-semibold">Taskly</span>
            </div>
            <button 
                className="bg-black text-white px-8 py-2 rounded-md hover:bg-gray-800"
                onClick={() => navigate("/signin")}>
                Sign In
            </button>
        </nav>
    </header>
  )
}

export default Header
