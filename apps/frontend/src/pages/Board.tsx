import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Loader2,
} from "lucide-react";

import {
  DragDropProvider,
  type DragEndEvent,
} from "@dnd-kit/react";

import AppLayout from "@/components/layout/AppLayout";
import BoardSection from "@/components/board/BoardSection";
import CreateIssueDialog from "@/components/board/CreateIssueDialog";
import UserProfile from "@/components/board/UserProfile";

import { Button } from "@/components/ui/button";

import {
  getSections,
  type Section,
} from "@/services/section";

import {
  getIssues,
  moveIssue,
  type Issue,
} from "@/services/issue";

import useBoardWebSocket from "@/hooks/useBoardWebSocket";

const Board = () => {
  const { boardId } =
    useParams<{ boardId: string }>();

  /*
   * =========================
   * WebSocket
   * =========================
   */

  const {
    onlineUsers,
    connected,
  } = useBoardWebSocket(boardId);

  /*
   * =========================
   * Board state
   * =========================
   */

  const [sections, setSections] =
    useState<Section[]>([]);

  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [createIssueOpen, setCreateIssueOpen] =
    useState(false);

  /*
   * =========================
   * Load board
   * =========================
   */

  useEffect(() => {
    if (!boardId) return;

    const fetchBoard = async () => {
      try {
        setLoading(true);

        const sectionData =
          await getSections(boardId);

        setSections(sectionData);

        const issueResults =
          await Promise.all(
            sectionData.map((section) =>
              getIssues(section.id)
            )
          );

        setIssues(
          issueResults.flat()
        );
      } catch (error) {
        console.error(
          "Error fetching board:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBoard();
  }, [boardId]);

  /*
   * =========================
   * Create issue
   * =========================
   */

  const handleIssueCreated = (
    issue: Issue
  ) => {
    setIssues((prev) => [
      ...prev,
      issue,
    ]);
  };

  /*
   * =========================
   * Drag and drop
   * =========================
   */

  const handleDragEnd = async (
    event: DragEndEvent
  ) => {
    const { operation } = event;

    if (!operation) return;

    const source =
      operation.source;

    const target =
      operation.target;

    if (!source || !target) return;

    const issueId =
      String(source.id);

    const targetSectionId =
      String(target.id);

    const issue = issues.find(
      (item) =>
        item.id === issueId
    );

    if (!issue) return;

    /*
     * Already in this section.
     */
    if (
      issue.sectionId ===
      targetSectionId
    ) {
      return;
    }

    /*
     * Make sure target is a section.
     */
    const targetSection =
      sections.find(
        (section) =>
          section.id ===
          targetSectionId
      );

    if (!targetSection) {
      return;
    }

    const previousSectionId =
      issue.sectionId;

    /*
     * Optimistic update.
     */
    setIssues((prev) =>
      prev.map((item) =>
        item.id === issueId
          ? {
              ...item,
              sectionId:
                targetSectionId,
            }
          : item
      )
    );

    try {
      await moveIssue(
        issueId,
        targetSectionId
      );
    } catch (error) {
      console.error(
        "Error moving issue:",
        error
      );

      /*
       * Rollback.
       */
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issueId
            ? {
                ...item,
                sectionId:
                  previousSectionId,
              }
            : item
        )
      );
    }
  };

  /*
   * =========================
   * Board ID missing
   * =========================
   */

  if (!boardId) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6">
          <p className="text-sm text-muted-foreground">
            Board not found.
          </p>
        </div>
      </AppLayout>
    );
  }

  /*
   * =========================
   * Loading
   * =========================
   */

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading board...
          </div>
        </div>
      </AppLayout>
    );
  }

  /*
   * =========================
   * Board
   * =========================
   */

  return (
    <AppLayout>
      <DragDropProvider
        onDragEnd={handleDragEnd}
      >
        <div className="w-full min-w-0 space-y-5 sm:space-y-6">

          {/* ========================= */}
          {/* Board Header               */}
          {/* ========================= */}

          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            {/* Board information */}

            <div className="min-w-0">
              <h1 className="text-xl font-semibold sm:text-2xl">
                Board
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage your issues and workflow.
              </p>
            </div>

            {/* Online users */}

            <div className="flex min-w-0 items-center sm:justify-end">
              <UserProfile
                users={onlineUsers}
              />
            </div>
          </div>

          {/* ========================= */}
          {/* WebSocket status           */}
          {/* ========================= */}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={
                connected
                  ? "h-2 w-2 rounded-full bg-green-500"
                  : "h-2 w-2 rounded-full bg-muted-foreground"
              }
            />

            {connected
              ? "Connected"
              : "Disconnected"}
          </div>

          {/* ========================= */}
          {/* Create Issue               */}
          {/* ========================= */}

          <div>
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                setCreateIssueOpen(true)
              }
              disabled={
                sections.length === 0
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Create issue
            </Button>
          </div>

          {/* ========================= */}
          {/* Sections                   */}
          {/* ========================= */}

          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center sm:p-10">
              <h2 className="font-medium">
                No sections yet
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Create a section before adding issues.
              </p>
            </div>
          ) : (
            <div
              className="
                flex
                w-full
                min-w-0
                flex-col
                items-center
                gap-4

                sm:flex-row
                sm:items-start
                sm:gap-4
                sm:overflow-x-auto
                sm:overscroll-x-contain

                pb-4
                sm:pb-6
              "
            >
              {sections.map(
                (section) => {
                  const sectionIssues =
                    issues.filter(
                      (issue) =>
                        issue.sectionId ===
                        section.id
                    );

                  return (
                    <BoardSection
                      key={section.id}
                      section={section}
                      issues={sectionIssues}
                      sections={sections}
                      onIssueCreated={
                        handleIssueCreated
                      }
                    />
                  );
                }
              )}
            </div>
          )}

          {/* ========================= */}
          {/* Create Issue Dialog        */}
          {/* ========================= */}

          {sections.length > 0 && (
            <CreateIssueDialog
              open={
                createIssueOpen
              }
              onOpenChange={
                setCreateIssueOpen
              }
              sections={sections}
              onCreated={
                handleIssueCreated
              }
            />
          )}
        </div>
      </DragDropProvider>
    </AppLayout>
  );
};

export default Board;