import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { getOrganizations } from "@/services/organizations";

export default function OrganizationRequiredRoute() {
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);

  useEffect(() => {
    async function checkOrganization() {
      try {
        const organizations = await getOrganizations();

        setHasOrganization(organizations.length > 0);
      } catch (error) {
        console.error("Failed to check organizations:", error);

        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }

    checkOrganization();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return <Navigate to="/signin" replace />;
  }

  if (!hasOrganization) {
    return (
      <Navigate
        to="/create-organization"
        replace
      />
    );
  }

  return <Outlet />;
}