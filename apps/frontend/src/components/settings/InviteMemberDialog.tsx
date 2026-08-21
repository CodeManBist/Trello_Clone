import { useState } from "react";
import { Loader2, Mail, UserPlus } from "lucide-react";

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
import { Label } from "@/components/ui/label";

import { createInvitation } from "@/services/invitations";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onInvited?: () => void;
}

const InviteMemberDialog = ({
  open,
  onOpenChange,
  organizationId,
  onInvited,
}: InviteMemberDialogProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setError(null);
    setSuccess(null);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value && !loading) {
      resetForm();
    }

    onOpenChange(value);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await createInvitation(
        organizationId,
        trimmedEmail
      );

      setSuccess(
        "Invitation sent successfully."
      );

      setEmail("");

      onInvited?.();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to send invitation.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-[480px]">

        <DialogHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <UserPlus className="h-5 w-5" />
          </div>

          <DialogTitle>
            Invite a member
          </DialogTitle>

          <DialogDescription>
            Invite an existing platform user to join this
            organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-4">

            <div className="space-y-2">
              <Label htmlFor="member-email">
                Email address
              </Label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  id="member-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={loading}
                  autoFocus
                  className="pl-9"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                The user must already have an account on the
                platform.
              </p>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
                <p className="text-sm text-destructive">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2">
                <p className="text-sm text-green-600">
                  {success}
                </p>
              </div>
            )}

          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading || !email.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;