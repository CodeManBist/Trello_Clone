import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <header className="sticky top-0 z-50 h-[72px] w-full border-b border-gray-200 bg-white">
      <nav className="flex h-full w-full items-center justify-between px-8">

        <div className="flex items-center gap-2">
          <img
            width="32"
            height="32"
            src="/logo.png"
            alt="Logo"
          />

          <span className="text-xl font-semibold">
            Taskly
          </span>
        </div>

        {user ? (
          <Button
            className="px-2 py-2 md:py-4 lg:px-8"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        ) : (
          <Button
            className="px-2 py-2 md:py-4 lg:px-8"
            onClick={() => navigate("/signin")}
          >
            Sign in
          </Button>
        )}

      </nav>
    </header>
  );
};

export default Header;