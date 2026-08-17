import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getOrganizations } from "@/services/organizations";
import { Loader2 } from "lucide-react";


export default function OrganizationRequiredRoute() {
  const [loading, setLoading] = useState(true);
  const [hasOrganization, setHasOrganization] = useState(false);

  useEffect(() => {
    async function checkOrganization() {
      try {
        const organizations = await getOrganizations();

        setHasOrganization(organizations.length > 0);
      } catch (error) {
        console.error("Failed to check organizations:", error);
      } finally {
        setLoading(false);
      }
    }

    checkOrganization();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!hasOrganization) {
    return <Navigate to="/create-organization" replace />;
  }

  return <Outlet />;
}