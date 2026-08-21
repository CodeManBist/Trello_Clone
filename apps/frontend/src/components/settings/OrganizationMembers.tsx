import { useEffect, useState } from "react";
import {
  Loader2,
  MoreHorizontal,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getOrganizationMembers,
  removeOrganizationMember,
  type OrganizationMember,
} from "@/services/organizations";

interface OrganizationMembersProps {
  organizationId: string;
  currentUserId?: string;
  isAdmin: boolean;
}

const OrganizationMembers = ({
  organizationId,
  currentUserId,
  isAdmin,
}: OrganizationMembersProps) => {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingUserId, setRemovingUserId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getOrganizationMembers(organizationId);

      setMembers(data);
    } catch (error) {
      console.error("Failed to load organization members:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to load organization members.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [organizationId]);

  const handleRemoveMember = async (userId: string) => {
    const member = members.find(
      (item) => item.user.id === userId
    );

    if (!member) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.user.username} from this organization?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(userId);
      setError(null);

      await removeOrganizationMember(
        organizationId,
        userId
      );

      setMembers((previous) =>
        previous.filter(
          (item) => item.user.id !== userId
        )
      );
    } catch (error) {
      console.error("Failed to remove member:", error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to remove member.");
      }
    } finally {
      setRemovingUserId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <CardTitle>Members</CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage the people who belong to this organization.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive">
              {error}
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading members...
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
            <Users className="mb-3 h-8 w-8 text-muted-foreground" />

            <p className="font-medium">
              No members found
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              This organization doesn't have any members yet.
            </p>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {members.map((member) => {
              const isCurrentUser =
                member.user.id === currentUserId;

              const isRemoving =
                removingUserId === member.user.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Users className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">
                          {member.user.username}
                        </p>

                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">
                            You
                          </span>
                        )}
                      </div>

                      <p className="truncate text-sm text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {member.role === "ADMIN" && (
                      <div className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                        <Shield className="h-4 w-4" />
                        Admin
                      </div>
                    )}

                    {member.role === "MEMBER" && (
                      <span className="hidden text-sm text-muted-foreground sm:block">
                        Member
                      </span>
                    )}

                    {isAdmin && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isRemoving}
                          >
                            {isRemoving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              handleRemoveMember(
                                member.user.id
                              )
                            }
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remove member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationMembers;