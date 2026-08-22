import { Link, useNavigate } from "react-router-dom";
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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex shrink-0 items-center gap-2"
        >
          <img
            src="/logo.png"
            alt="Taskly logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />

          <span className="text-lg font-semibold tracking-tight sm:text-xl">
            Taskly
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-4">

          {user ? (<>
            <Link
            to="/dashboard"
            className="rounded-md px-2 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:px-3 sm:text-base"
          >
            Dashboard
          </Link>
          <Button
              onClick={handleLogout}
              className="h-9 px-3 text-sm sm:h-10 sm:px-5 sm:text-base"
            >
              Sign out
            </Button>
          </>
        
          ) : (
            <Button
              onClick={() => navigate("/signin")}
              className="h-9 px-3 text-sm sm:h-10 sm:px-5 sm:text-base"
            >
              Sign in
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;