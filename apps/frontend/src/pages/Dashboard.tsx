import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  FolderKanban,
  Plus,
  Users,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  getOrganizations,
  type Organization,
} from "@/services/organizations";

import {
  getBoards,
  type Board,
} from "@/services/boards";

import CreateBoardDialog from "@/components/dashboard/CreateBoardDialog";

const Dashboard = () => {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);

  const [createBoardOpen, setCreateBoardOpen] = useState(false);

  // Fetch organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await getOrganizations();

        // API returns OrganizationMembership[]
        // Dashboard only needs the organization objects.
        const organizationList = data.map(
          (membership) => membership.organization
        );

        setOrganizations(organizationList);

        // Automatically select the first organization
        if (organizationList.length > 0) {
          setSelectedOrganization(organizationList[0]);
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
      }
    };

    fetchOrganizations();
  }, []);

  // Fetch boards whenever selected organization changes
  useEffect(() => {
    if (!selectedOrganization) {
      setBoards([]);
      return;
    }

    const fetchBoards = async () => {
      try {
        setBoardsLoading(true);

        // Clear boards from previous organization
        setBoards([]);

        const data = await getBoards(
          selectedOrganization.id
        );

        setBoards(data);
      } catch (error) {
        console.error(
          "Error fetching boards:",
          error
        );

        setBoards([]);
      } finally {
        setBoardsLoading(false);
      }
    };

    fetchBoards();
  }, [selectedOrganization]);

  // Called after successfully creating a board
  const handleBoardCreated = (board: Board) => {
    setBoards((prev) => [...prev, board]);

    setCreateBoardOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Page heading */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>

            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.username}.
            </p>
          </div>

          {selectedOrganization && (
            <Button
              onClick={() => setCreateBoardOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Board
            </Button>
          )}
        </div>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle>
              Organization
            </CardTitle>

            <CardDescription>
              Select the organization you want to work with.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You are not part of any organization.
              </p>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Users className="mr-2 h-4 w-4" />

                    {selectedOrganization?.name ??
                      "Select Organization"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    {organizations.map(
                      (organization) => (
                        <DropdownMenuItem
                          key={organization.id}
                          onClick={() =>
                            setSelectedOrganization(
                              organization
                            )
                          }
                        >
                          {organization.name}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardContent>
        </Card>

        {/* Boards */}
        {selectedOrganization && (
          <div className="space-y-4">

            <div>
              <h2 className="text-lg font-semibold">
                Boards
              </h2>

              <p className="text-sm text-muted-foreground">
                Boards in{" "}
                {selectedOrganization.name}.
              </p>
            </div>

            {/* Loading */}
            {boardsLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading boards...
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* Existing boards */}
                {boards.map((board) => (
                  <Card
                    key={board.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <CardHeader>
                      <FolderKanban className="mb-2 h-5 w-5" />

                      <CardTitle>
                        {board.title}
                      </CardTitle>

                      <CardDescription>
                        {board.description ||
                          "No description"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}

                {/* Create board */}
                <Card
                  className="cursor-pointer border-dashed transition-colors hover:bg-muted/50"
                  onClick={() =>
                    setCreateBoardOpen(true)
                  }
                >
                  <CardContent className="flex min-h-[180px] flex-col items-center justify-center">
                    <Plus className="mb-3 h-6 w-6" />

                    <p className="font-medium">
                      Create a new board
                    </p>

                    <p className="mt-1 text-center text-sm text-muted-foreground">
                      Start organizing your team's work.
                    </p>
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        )}

        {/* Create Board Dialog */}
        {selectedOrganization && (
          <CreateBoardDialog
            open={createBoardOpen}
            onOpenChange={setCreateBoardOpen}
            organizationId={selectedOrganization.id}
            onBoardCreated={handleBoardCreated}
          />
        )}

      </div>
    </AppLayout>
  );
};

export default Dashboard;