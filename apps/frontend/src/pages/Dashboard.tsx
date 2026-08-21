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
  Loader2,
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

import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const [organizationsLoading, setOrganizationsLoading] =
    useState(true);

  const [boards, setBoards] = useState<Board[]>([]);

  const [boardsLoading, setBoardsLoading] =
    useState(false);

  const [createBoardOpen, setCreateBoardOpen] =
    useState(false);

  // --------------------------------------------------
  // Fetch organizations
  // --------------------------------------------------

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setOrganizationsLoading(true);

        const data = await getOrganizations();

        // API returns OrganizationMembership[]
        // Dashboard needs only the organization objects.
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
      } finally {
        setOrganizationsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // --------------------------------------------------
  // Fetch boards whenever organization changes
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedOrganization) {
      setBoards([]);
      setBoardsLoading(false);
      return;
    }

    const fetchBoards = async () => {
      try {
        setBoardsLoading(true);

        // Prevent boards from the previous organization
        // from being displayed while loading.
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

  // --------------------------------------------------
  // Board created successfully
  // --------------------------------------------------

  const handleBoardCreated = (board: Board) => {
    setBoards((prev) => [...prev, board]);

    setCreateBoardOpen(false);
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* -------------------------------------------- */}
        {/* Page heading */}
        {/* -------------------------------------------- */}

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
              onClick={() =>
                setCreateBoardOpen(true)
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              New Board
            </Button>
          )}
        </div>

        {/* -------------------------------------------- */}
        {/* Organization */}
        {/* -------------------------------------------- */}

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

            {/* Organization loading */}
            {organizationsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />

                <span>
                  Loading organizations...
                </span>
              </div>
            ) : organizations.length === 0 ? (
              /* No organizations */
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  You are not part of any organization.
                </p>

                <p className="text-xs text-muted-foreground">
                  Create or join an organization to start
                  managing boards.
                </p>
              </div>
            ) : (
              /* Organization dropdown */
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
                          onClick={() => {
                            setSelectedOrganization(
                              organization
                            );
                          }}
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

        {/* -------------------------------------------- */}
        {/* Boards */}
        {/* -------------------------------------------- */}

        {selectedOrganization && (
          <div className="space-y-4">

            {/* Boards heading */}
            <div>
              <h2 className="text-lg font-semibold">
                Boards
              </h2>

              <p className="text-sm text-muted-foreground">
                Boards in{" "}
                {selectedOrganization.name}.
              </p>
            </div>

            {/* ---------------------------------------- */}
            {/* Boards loading */}
            {/* ---------------------------------------- */}

            {boardsLoading ? (
              <div className="flex min-h-[180px] items-center justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />

                  <span>
                    Loading boards...
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                {/* ------------------------------------ */}
                {/* Existing boards */}
                {/* ------------------------------------ */}

                {boards.map((board) => (
                  <Card
                    key={board.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => {
                      navigate(`/boards/${board.id}`);
                    }}
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

                {/* ------------------------------------ */}
                {/* No boards */}
                {/* ------------------------------------ */}

                {boards.length === 0 && (
                  <div className="col-span-full">
                    <Card className="border-dashed">
                      <CardContent className="flex min-h-[180px] flex-col items-center justify-center text-center">
                        <FolderKanban className="mb-3 h-6 w-6 text-muted-foreground" />

                        <p className="font-medium">
                          No boards yet
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Create your first board for this
                          organization.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ------------------------------------ */}
                {/* Create board card */}
                {/* ------------------------------------ */}

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

        {/* -------------------------------------------- */}
        {/* Create Board Dialog */}
        {/* -------------------------------------------- */}

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