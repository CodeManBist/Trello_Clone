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
import ChatComponent from "@/components/board/ChatComponent";

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

import type { ChatMessage } from "@/services/chat";

const Board = () => {
  const { boardId } =
    useParams<{ boardId: string }>();

  /*
   * =====================================================
   * WEBSOCKET
   * =====================================================
   */

  const {
    onlineUsers,
    connected,
    messages: socketMessages,
    sendMessage,
    currentUserId,
  } = useBoardWebSocket(boardId);

  /*
   * =====================================================
   * BOARD STATE
   * =====================================================
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
   * =====================================================
   * CHAT
   *
   * IMPORTANT:
   * Chat messages now come ONLY from the WebSocket hook.
   *
   * We do NOT fetch chat messages here.
   * We do NOT create chat messages through REST here.
   * =====================================================
   */

  const messages = socketMessages;

  /*
   * =====================================================
   * LOAD BOARD
   * =====================================================
   */

  useEffect(() => {
    if (!boardId) {
      return;
    }

    const fetchBoard = async () => {
      try {
        setLoading(true);

        /*
         * Get sections
         */
        const sectionData =
          await getSections(boardId);

        setSections(sectionData);

        /*
         * Get issues for every section
         */
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
   * =====================================================
   * CREATE ISSUE
   * =====================================================
   */

  const handleIssueCreated = (
    issue: Issue
  ) => {
    setIssues((previous) => [
      ...previous,
      issue,
    ]);
  };

  /*
   * =====================================================
   * SEND CHAT MESSAGE
   *
   * IMPORTANT:
   *
   * DO NOT call createChatMessage().
   *
   * The WebSocket server is responsible for:
   *
   * 1. Receiving the message
   * 2. Saving it to PostgreSQL
   * 3. Broadcasting the saved message
   *    to every connected user in the board room
   *
   * sendMessage() expects a STRING.
   * =====================================================
   */

  const handleSendMessage = (
    content: string
  ) => {
    if (!boardId) {
      return;
    }

    const trimmedContent =
      content.trim();

    if (!trimmedContent) {
      return;
    }

    if (!connected) {
      console.error(
        "Cannot send chat message: WebSocket is disconnected"
      );

      return;
    }

    /*
     * Send ONLY the text.
     *
     * Previously this code was doing:
     *
     * sendMessage({
     *   id,
     *   type,
     *   content,
     *   ...
     * })
     *
     * That caused:
     *
     * content.trim is not a function
     *
     * because useBoardWebSocket expects:
     *
     * sendMessage(content: string)
     */

    sendMessage(trimmedContent);
  };

  /*
   * =====================================================
   * DRAG AND DROP
   * =====================================================
   */

  const handleDragEnd = async (
    event: DragEndEvent
  ) => {
    const { operation } = event;

    if (!operation) {
      return;
    }

    const source =
      operation.source;

    const target =
      operation.target;

    if (!source || !target) {
      return;
    }

    const issueId =
      String(source.id);

    const targetSectionId =
      String(target.id);

    const issue = issues.find(
      (item) =>
        item.id === issueId
    );

    if (!issue) {
      return;
    }

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
    setIssues((previous) =>
      previous.map((item) =>
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
      setIssues((previous) =>
        previous.map((item) =>
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
   * =====================================================
   * BOARD ID MISSING
   * =====================================================
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
   * =====================================================
   * LOADING
   * =====================================================
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
   * =====================================================
   * BOARD
   * =====================================================
   */

  return (
    <AppLayout>
      <DragDropProvider
        onDragEnd={handleDragEnd}
      >
        <div className="w-full min-w-0 space-y-5 sm:space-y-6">

          {/* BOARD HEADER */}

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

          {/* WEBSOCKET STATUS */}

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

          {/* CREATE ISSUE */}

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

          {/* SECTIONS */}

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
                      issues={
                        sectionIssues
                      }
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

          {/* CREATE ISSUE DIALOG */}

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

          {/* BOARD CHAT */}

          <ChatComponent
            messages={
              messages as ChatMessage[]
            }
            currentUserId={
              currentUserId
            }
            onSendMessage={
              handleSendMessage
            }
            disabled={
              !connected
            }
          />

        </div>
      </DragDropProvider>
    </AppLayout>
  );
};

export default Board;