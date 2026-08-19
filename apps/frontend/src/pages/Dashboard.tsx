import { useState, useEffect } from "react";

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
  getOrganizations,
  type Organization,
} from "@/services/organizations";

import {
  getBoards,
  type Board,
} from "@/services/boards";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import BoardCard from "@/components/dashboard/BoardCard";
import CreateBoardDialog from "@/components/dashboard/CreateBoardDialog";

const Dashboard = () => {
  const { user } = useAuth();

  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [selectedOrganization, setSelectedOrganization] =
    useState<Organization | null>(null);

  const [boards, setBoards] =
    useState<Board[]>([]);

  const [boardsLoading, setBoardsLoading] =
    useState<boolean>(false);

  const [organizationsLoading, setOrganizationsLoading] =
    useState<boolean>(true);

  // =========================
  // Fetch organizations
  // =========================

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setOrganizationsLoading(true);

        const data = await getOrganizations();

        setOrganizations(data);

        console.log(
          "Fetched organizations:",
          data
        );

        // Automatically select the first organization
        if (data.length > 0) {
          setSelectedOrganization(data[0]);
        }
      } catch (error) {
        console.error(
          "Error fetching organizations:",
          error
        );
      } finally {
        setOrganizationsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  // =========================
  // Fetch boards
  // =========================

  useEffect(() => {
    if (!selectedOrganization) {
      setBoards([]);
      return;
    }

    const fetchBoards = async () => {
      try {
        setBoardsLoading(true);

        const organizationId =
          selectedOrganization.organization.id;

        console.log(
          "Fetching boards for organization:",
          organizationId
        );

        const data = await getBoards(
          organizationId
        );

        console.log(
          "Fetched boards:",
          data
        );

        setBoards(data);
        console.log(data);
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

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* =========================
            Page heading
        ========================= */}

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>

            <p className="text-sm text-muted-foreground">
              Welcome back, {user?.username}.
            </p>
          </div>

          {/* New Board button */}

          {selectedOrganization && (
            <CreateBoardDialog
              organizationId={
                selectedOrganization.organization.id
              }
              onBoardCreated={(board) => {
                setBoards((prev) => [
                  ...prev,
                  board,
                ]);
              }}
            />
          )}

        </div>


        {/* =========================
            Organization
        ========================= */}

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

            {organizationsLoading ? (

              <Button
                variant="outline"
                disabled
                className="w-full justify-start sm:w-[300px]"
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                Loading organizations...
              </Button>

            ) : organizations.length === 0 ? (

              <p className="text-sm text-muted-foreground">
                No organizations found.
              </p>

            ) : (

              <DropdownMenu>

                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start sm:w-[300px]"
                  >
                    <Users className="mr-2 h-4 w-4" />

                    {selectedOrganization
                      ?.organization.name ??
                      "Select Organization"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="start"
                  className="w-[300px]"
                >
                  <DropdownMenuGroup>

                    {organizations.map(
                      (item) => (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() =>
                            setSelectedOrganization(
                              item
                            )
                          }
                        >
                          <Users className="mr-2 h-4 w-4" />

                          {item.organization.name}
                        </DropdownMenuItem>
                      )
                    )}

                  </DropdownMenuGroup>
                </DropdownMenuContent>

              </DropdownMenu>

            )}

          </CardContent>
        </Card>


        {/* =========================
            Boards
        ========================= */}

        <div className="space-y-4">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold">
                Your Boards
              </h2>

              <p className="text-sm text-muted-foreground">
                {selectedOrganization
                  ? `Boards in ${selectedOrganization.organization.name}`
                  : "Select an organization to view boards."}
              </p>
            </div>

          </div>


          {/* =========================
              Board loading
          ========================= */}

          {boardsLoading ? (

            <div className="flex min-h-[180px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>

          ) : boards.length === 0 ? (

            /* =========================
               Empty state
            ========================= */

            <Card className="border-dashed">

              <CardContent className="flex min-h-[180px] flex-col items-center justify-center">

                <FolderKanban className="mb-3 h-6 w-6" />

                <p className="font-medium">
                  No boards yet
                </p>

                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Create your first board for this organization.
                </p>

                {selectedOrganization && (
                  <div className="mt-4">
                    <CreateBoardDialog
                      organizationId={
                        selectedOrganization.organization.id
                      }
                      onBoardCreated={(board) => {
                        setBoards((prev) => [
                          ...prev,
                          board,
                        ]);
                      }}
                    />
                  </div>
                )}

              </CardContent>

            </Card>

          ) : (

            /* =========================
               Board cards
            ========================= */

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {boards.map((board) => (
                <BoardCard
                  key={board.id}
                  board={board}
                />
              ))}


              {/* Create another board */}

              {selectedOrganization && (
                <Card className="border-dashed transition-colors hover:bg-muted/50">

                  <CardContent className="flex min-h-[180px] flex-col items-center justify-center">

                    <CreateBoardDialog
                      organizationId={
                        selectedOrganization.organization.id
                      }
                      onBoardCreated={(board) => {
                        setBoards((prev) => [
                          ...prev,
                          board,
                        ]);
                      }}
                    />

                    <p className="mt-3 text-center text-sm text-muted-foreground">
                      Start organizing your team's work.
                    </p>

                  </CardContent>

                </Card>
              )}

            </div>

          )}

        </div>

      </div>
    </AppLayout>
  );
};

export default Dashboard;