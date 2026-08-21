import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";

import {
  acceptInvitation,
  getInvitations,
  type Invitation,
} from "@/services/invitations";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Check,
  Inbox,
  Loader2,
  Mail,
  UserRound,
} from "lucide-react";

type AlertState = {
  type: "success" | "error";
  title: string;
  message: string;
} | null;

const Invitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const [acceptingToken, setAcceptingToken] = useState<string | null>(
    null
  );

  const [alert, setAlert] = useState<AlertState>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setAlert(null);

      const data = await getInvitations();

      setInvitations(data);
    } catch (error) {
      console.error("Error fetching invitations:", error);

      setAlert({
        type: "error",
        title: "Unable to load invitations",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while loading your invitations.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleAccept = async (invitation: Invitation) => {
    try {
      setAcceptingToken(invitation.token);
      setAlert(null);

      await acceptInvitation(invitation.token);

      // Remove accepted invitation from the current list.
      setInvitations((prev) =>
        prev.filter((item) => item.id !== invitation.id)
      );

      setAlert({
        type: "success",
        title: "Invitation accepted",
        message: `You have joined ${invitation.organization.name}.`,
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);

      setAlert({
        type: "error",
        title: "Unable to accept invitation",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while accepting the invitation.",
      });
    } finally {
      setAcceptingToken(null);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Invitations
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review invitations to join organizations.
          </p>
        </div>

        {/* Alert */}
        {alert && (
          <Alert
            variant={
              alert.type === "error"
                ? "destructive"
                : "default"
            }
          >
            <AlertTitle>{alert.title}</AlertTitle>

            <AlertDescription>
              {alert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {loading ? (
          <Card>
            <CardContent className="flex min-h-[240px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading invitations...
              </div>
            </CardContent>
          </Card>
        ) : invitations.length === 0 ? (
          /* Empty state */
          <Card>
            <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>

              <h2 className="text-lg font-semibold">
                No pending invitations
              </h2>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                You don't have any organization invitations
                waiting for you.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Invitations list */
          <div className="space-y-4">
            {invitations.map((invitation) => {
              const isAccepting =
                acceptingToken === invitation.token;

              return (
                <Card key={invitation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Mail className="h-5 w-5" />
                        </div>

                        <div>
                          <CardTitle>
                            {invitation.organization.name}
                          </CardTitle>

                          <CardDescription className="mt-1">
                            You've been invited to join this
                            organization.
                          </CardDescription>
                        </div>
                      </div>

                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                        Pending
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Organization description */}
                    {invitation.organization.description && (
                      <div className="rounded-lg border bg-muted/20 p-4">
                        <p className="text-sm">
                          {invitation.organization.description}
                        </p>
                      </div>
                    )}

                    {/* Invited by */}
                    {invitation.invitedBy && (
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                          <UserRound className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {invitation.invitedBy.username}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {invitation.invitedBy.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Invitation date */}
                    <p className="text-xs text-muted-foreground">
                      Invited on{" "}
                      {new Date(
                        invitation.createdAt
                      ).toLocaleDateString()}
                    </p>

                    {/* Actions */}
                    <div className="flex justify-end border-t pt-4">
                      <Button
                        onClick={() =>
                          handleAccept(invitation)
                        }
                        disabled={isAccepting}
                      >
                        {isAccepting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Accept invitation
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Invitations;