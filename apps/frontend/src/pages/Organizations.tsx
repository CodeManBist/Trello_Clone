import { useEffect, useState } from "react";

import {
  Building2,
  Plus,
  Users,
  ArrowRight,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import AppLayout from "@/components/layout/AppLayout";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  getOrganizations,
  type OrganizationMembership,
} from "@/services/organizations";

import OrganizationDetailsDialog from "@/components/organization/OrganizationDetailsDialog";

import { useNavigate } from "react-router-dom";

const Organizations = () => {
  const navigate = useNavigate();
  
  const [organizations, setOrganizations] = useState<
    OrganizationMembership[]
  >([]);

  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationMembership | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Show alert for 3 seconds
  const showAlert = (
    type: "success" | "error",
    message: string
  ) => {
    setAlert({
      type,
      message,
    });

    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getOrganizations();

        setOrganizations(data);
      } catch (error) {
        console.error(
          "Error fetching organizations:",
          error
        );

        showAlert(
          "error",
          error instanceof Error
            ? error.message
            : "Failed to load organizations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // Open organization details
  const handleOpenOrganization = (
    organization: OrganizationMembership
  ) => {
    setSelectedOrganization(organization);
    setDialogOpen(true);
  };

  // Organization updated
  const handleOrganizationUpdated = (
    updatedOrganization: OrganizationMembership
  ) => {
    setOrganizations((prev) =>
      prev.map((item) =>
        item.organization.id ===
        updatedOrganization.organization.id
          ? updatedOrganization
          : item
      )
    );

    setSelectedOrganization(updatedOrganization);

    showAlert(
      "success",
      "Organization updated successfully."
    );
  };

  // Organization deleted
  const handleOrganizationDeleted = (
    organizationId: string
  ) => {
    setOrganizations((prev) =>
      prev.filter(
        (item) =>
          item.organization.id !== organizationId
      )
    );

    setSelectedOrganization(null);
    setDialogOpen(false);

    showAlert(
      "success",
      "Organization deleted successfully."
    );
  };

  return (
    <AppLayout>
      <div className="relative space-y-8">

        {/* Alert */}
        {alert && (
          <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
            <Alert
              variant={
                alert.type === "error"
                  ? "destructive"
                  : "default"
              }
            >
              {alert.type === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}

              <AlertTitle>
                {alert.type === "success"
                  ? "Success"
                  : "Error"}
              </AlertTitle>

              <AlertDescription>
                {alert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Organizations
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage the organizations you're a member of.
            </p>
          </div>

          <Button onClick={() => {
            navigate("/create-organization");
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[250px] items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />

            <p className="text-sm text-muted-foreground">
              Loading organizations...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && organizations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>

              <h2 className="text-lg font-semibold">
                No organizations yet
              </h2>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create an organization to start
                collaborating with your team.
              </p>

              <Button className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Organization cards */}
        {!loading && organizations.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((item) => {
              const organization = item.organization;

              return (
                <Card
                  key={item.id}
                  className="group transition-colors hover:border-neutral-400"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5" />
                      </div>
                    </div>

                    <CardTitle className="mt-4">
                      {organization.name}
                    </CardTitle>

                    <CardDescription className="line-clamp-2">
                      {organization.description ||
                        "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />

                      <span className="capitalize">
                        {item.role}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() =>
                        handleOpenOrganization(item)
                      }
                    >
                      Open Organization

                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Organization Details Dialog */}
      <OrganizationDetailsDialog
        organization={selectedOrganization}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdated={handleOrganizationUpdated}
        onDeleted={handleOrganizationDeleted}
        onError={(message) =>
          showAlert("error", message)
        }
      />
    </AppLayout>
  );
};

export default Organizations;