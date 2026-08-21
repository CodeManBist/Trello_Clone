import { useState } from "react";

import {
  Building2,
  Users,
  Shield,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import type { Organization, OrganizationMembership } from "@/services/organizations";

import {
  updateOrganization,
  deleteOrganization,
} from "@/services/organizations";

type OrganizationDetailsDialogProps = {
  organization: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;

  onUpdated?: (organization: OrganizationMembership) => void;
  onDeleted?: (organizationId: string) => void;
};

const OrganizationDetailsDialog = ({
  organization,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: OrganizationDetailsDialogProps) => {
  const [editMode, setEditMode] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] =
    useState(false);

  const [error, setError] = useState<string | null>(null);

  if (!organization) {
    return null;
  }

  const details = organization.organization;

  const handleEdit = () => {
    setName(details.name);
    setDescription(details.description ?? "");
    setError(null);
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setError(null);
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError("Organization name is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updatedOrganization =
        await updateOrganization(
          details.id,
          name.trim(),
          description.trim()
        );

      /**
       * Your getOrganizations() response is a membership
       * containing `organization`, so update that nested
       * organization while preserving the membership data.
       */
      const updatedMembership = {
        ...organization,
        organization: updatedOrganization,
      };

      onUpdated?.(updatedMembership as Organization);

      setEditMode(false);
    } catch (error) {
      console.error(
        "Error updating organization:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update organization."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      await deleteOrganization(details.id);

      onDeleted?.(details.id);

      setDeleteConfirmOpen(false);
      onOpenChange(false);
    } catch (error) {
      console.error(
        "Error deleting organization:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete organization."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Organization Details */}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) {
            setEditMode(false);
            setError(null);
          }

          onOpenChange(value);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <DialogTitle>
                  {editMode
                    ? "Edit Organization"
                    : details.name}
                </DialogTitle>

                <DialogDescription>
                  {editMode
                    ? "Update your organization details."
                    : "Organization details"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editMode ? (
            /* EDIT FORM */
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="organization-name"
                  className="text-sm font-medium"
                >
                  Name
                </label>

                <Input
                  id="organization-name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Organization name"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="organization-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <Textarea
                  id="organization-description"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Describe your organization"
                  rows={4}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleUpdate}
                  disabled={saving}
                >
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* DETAILS */
            <>
              <div className="space-y-6 py-4">
                {/* Description */}
                <div>
                  <p className="mb-2 text-sm font-medium">
                    Description
                  </p>

                  <p className="text-sm leading-6 text-muted-foreground">
                    {details.description ||
                      "No description provided."}
                  </p>
                </div>

                {/* Organization information */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Your role
                    </div>

                    <p className="mt-2 font-medium capitalize">
                      {organization.role}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Members
                    </div>

                    <p className="mt-2 font-medium">
                      —
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 sm:justify-between">
                <Button
                  variant="destructive"
                  onClick={() =>
                    setDeleteConfirmOpen(true)
                  }
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                <Button
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              Delete organization?
            </DialogTitle>

            <DialogDescription>
              This will permanently delete{" "}
              <span className="font-medium text-foreground">
                {details.name}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteConfirmOpen(false)
              }
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {deleting
                ? "Deleting..."
                : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrganizationDetailsDialog;