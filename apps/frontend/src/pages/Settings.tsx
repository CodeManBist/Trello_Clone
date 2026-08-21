import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";

import {
  Building2,
  Loader2,
  Shield,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getOrganizations,
  type OrganizationMembership,
} from "@/services/organizations";

import InviteMemberDialog from "@/components/settings/InviteMemberDialog";
import OrganizationMembers from "@/components/settings/OrganizationMembers";

const Settings = () => {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<
    OrganizationMembership[]
  >([]);

  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationMembership | null>(null);

  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);

  // --------------------------------------------------
  // Fetch organizations
  // --------------------------------------------------

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);

        const data = await getOrganizations();

        setOrganizations(data);

        if (data.length > 0) {
          setSelectedOrganization(data[0]);
        } else {
          setSelectedOrganization(null);
        }
      } catch (error) {
        console.error(
          "Error fetching organizations:",
          error
        );

        setOrganizations([]);
        setSelectedOrganization(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Settings
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage your account and organization.
            </p>
          </div>

          <Card>
            <CardContent className="flex min-h-[240px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading settings...
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // --------------------------------------------------
  // No organization
  // --------------------------------------------------

  if (!selectedOrganization) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Settings
            </h1>

            <p className="text-sm text-muted-foreground">
              Manage your account and organization.
            </p>
          </div>

          <Card>
            <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center">
              <Building2 className="mb-4 h-8 w-8 text-muted-foreground" />

              <h2 className="font-medium">
                No organization found
              </h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                You are not currently a member of any
                organization.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // --------------------------------------------------
  // Selected organization information
  // --------------------------------------------------

  const organization =
    selectedOrganization.organization;

  const isAdmin =
    selectedOrganization.role === "ADMIN";

  // --------------------------------------------------
  // Page
  // --------------------------------------------------

  return (
    <AppLayout>
      <div className="space-y-8">

        {/* ------------------------------------------ */}
        {/* Page Header */}
        {/* ------------------------------------------ */}

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Settings
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage your account and organization.
          </p>
        </div>

        {/* ------------------------------------------ */}
        {/* Organization */}
        {/* ------------------------------------------ */}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization
                </CardTitle>

                <CardDescription className="mt-1">
                  Select the organization you want to manage.
                </CardDescription>
              </div>

              {/* Role badge */}
              <div className="flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
                <Shield className="h-3.5 w-3.5" />

                {isAdmin ? "Admin" : "Member"}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* -------------------------------------- */}
            {/* Organization Dropdown */}
            {/* -------------------------------------- */}

            <div className="space-y-2">
              <p className="text-sm font-medium">
                Organization
              </p>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between sm:w-[320px]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0" />

                      <span className="truncate">
                        {organization.name}
                      </span>
                    </span>

                    <span className="ml-4 text-xs text-muted-foreground">
                      Select
                    </span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-[320px]"
                >
                  <DropdownMenuGroup>
                    {organizations.map(
                      (membership) => {
                        const isSelected =
                          membership.organization.id ===
                          organization.id;

                        return (
                          <DropdownMenuItem
                            key={
                              membership.organization.id
                            }
                            onClick={() =>
                              setSelectedOrganization(
                                membership
                              )
                            }
                            className="cursor-pointer"
                          >
                            <div className="flex w-full items-center justify-between gap-4">
                              <div className="flex min-w-0 items-center gap-2">
                                <Building2 className="h-4 w-4 shrink-0" />

                                <span className="truncate">
                                  {
                                    membership
                                      .organization
                                      .name
                                  }
                                </span>
                              </div>

                              <span className="shrink-0 text-xs text-muted-foreground">
                                {isSelected
                                  ? "Selected"
                                  : membership.role ===
                                      "ADMIN"
                                    ? "Admin"
                                    : "Member"}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        );
                      }
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* -------------------------------------- */}
            {/* Selected Organization */}
            {/* -------------------------------------- */}

            <div className="rounded-lg border bg-muted/20 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background">
                  <Building2 className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h2 className="font-semibold">
                    {organization.name}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {organization.description ||
                      "No organization description."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ------------------------------------------ */}
        {/* Organization Members */}
        {/* ------------------------------------------ */}

        <OrganizationMembers
          organizationId={organization.id}
          currentUserId={user?.id}
          isAdmin={isAdmin}
        />

        {/* ------------------------------------------ */}
        {/* Invitations */}
        {/* ------------------------------------------ */}

        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Invitations
                  </CardTitle>

                  <CardDescription className="mt-1">
                    Invite an existing platform user to
                    this organization.
                  </CardDescription>
                </div>

                <Button
                  onClick={() =>
                    setInviteOpen(true)
                  }
                >
                  Invite member
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border border-dashed p-6 text-center">
                <Users className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />

                <p className="font-medium">
                  Add someone to your organization
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Enter their platform account email to
                  create an invitation.
                </p>

                <Button
                  className="mt-4"
                  onClick={() =>
                    setInviteOpen(true)
                  }
                >
                  Invite member
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ------------------------------------------ */}
        {/* Invite Member Dialog */}
        {/* ------------------------------------------ */}

        {isAdmin && (
          <InviteMemberDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            organizationId={organization.id}
            onInvited={() => {
              setInviteOpen(false);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Settings;