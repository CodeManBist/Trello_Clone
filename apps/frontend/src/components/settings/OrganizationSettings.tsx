import { useEffect, useState } from "react";
import { Building2, Loader2, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  getOrganizations,
  updateOrganization,
  type Organization,
  type OrganizationMembership,
} from "@/services/organizations";

const OrganizationSettings = () => {
  const [organizations, setOrganizations] = useState<
    OrganizationMembership[]
  >([]);

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getOrganizations();

        setOrganizations(data);

        if (data.length > 0) {
          const firstOrganization = data[0].organization;

          setSelectedOrganization(firstOrganization);
          setName(firstOrganization.name);
          setDescription(firstOrganization.description ?? "");
        }
      } catch (error) {
        console.error("Error loading organizations:", error);

        setError("Failed to load organizations.");
      } finally {
        setLoading(false);
      }
    };

    loadOrganizations();
  }, []);

  const currentMembership = organizations.find(
    (membership) =>
      membership.organization.id === selectedOrganization?.id
  );

  const isAdmin = currentMembership?.role === "ADMIN";

  const handleSave = async () => {
    if (!selectedOrganization) {
      return;
    }

    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedOrganization = await updateOrganization(
        selectedOrganization.id,
        name.trim(),
        description.trim()
      );

      setSelectedOrganization(updatedOrganization);

      setOrganizations((prev) =>
        prev.map((membership) =>
          membership.organization.id === updatedOrganization.id
            ? {
                ...membership,
                organization: updatedOrganization,
              }
            : membership
        )
      );

      setName(updatedOrganization.name);
      setDescription(updatedOrganization.description ?? "");

      setSuccess("Organization settings updated successfully.");
    } catch (error) {
      console.error("Error updating organization:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to update organization.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading organization settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[220px] items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

            <p className="font-medium">
              No organizations found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              You are not currently a member of any organization.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization selector */}
      {organizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {organizations.map((membership) => {
                const organization = membership.organization;
                const active =
                  organization.id === selectedOrganization?.id;

                return (
                  <Button
                    key={organization.id}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => {
                      setSelectedOrganization(organization);
                      setName(organization.name);
                      setDescription(
                        organization.description ?? ""
                      );
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    {organization.name}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization details */}
      <Card>
        <CardHeader>
          <CardTitle>Organization details</CardTitle>

          <p className="text-sm text-muted-foreground">
            Update the basic information for your organization.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="organization-name">
              Organization name
            </Label>

            <Input
              id="organization-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!isAdmin || saving}
              placeholder="Organization name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-description">
              Description
            </Label>

            <Textarea
              id="organization-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              disabled={!isAdmin || saving}
              placeholder="Describe your organization..."
              className="min-h-28 resize-none"
            />
          </div>

          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Only organization admins can edit these settings.
            </p>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {isAdmin && (
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving || !name.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSettings;