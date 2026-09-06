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
import CreateIssueDialog from "@/components/board/IssueDialog";
import SectionDialog from "@/components/board/SectionDialog";
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
import { getBoardMembers } from "@/services/boards";

import useBoardWebSocket from "@/hooks/useBoardWebSocket";

import type { ChatMessage } from "@/services/chat";

const Board = () => {
  const { boardId } = useParams<{ boardId: string }>();

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

  const [sections, setSections] = useState<Section[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [canManageAssignments, setCanManageAssignments] = useState(false);

  /*
   * =====================================================
   * CHAT
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

        const [sectionData, boardMemberData] = await Promise.all([
          getSections(boardId),
          getBoardMembers(boardId),
        ]);
        setSections(sectionData);
        setCanManageAssignments(boardMemberData.canManageAssignments);

        const issueResults = await Promise.all(
          sectionData.map((section) => getIssues(section.id))
        );

        setIssues(issueResults.flat());
      } catch (error) {
        console.error("Error fetching board:", error);
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

  const handleIssueCreated = (issue: Issue) => {
    setIssues((previous) => [...previous, issue]);
  };

  /*
   * =====================================================
   * UPDATE ISSUE
   * =====================================================
   */

  const handleIssueUpdated = (updatedIssue: Issue) => {
    console.log("Updating issue in state:", updatedIssue);
    setIssues((previous) =>
      previous.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue
      )
    );
  };

  /*
   * =====================================================
   * DELETE ISSUE
   * =====================================================
   */

  const handleIssueDeleted = (issueId: string) => {
    console.log("Deleting issue from state:", issueId);
    setIssues((previous) => {
      const updated = previous.filter((issue) => issue.id !== issueId);
      console.log("Issues remaining:", updated.length);
      return updated;
    });
  };

  const handleSectionSaved = (savedSection: Section) => {
    setSections((previous) => {
      const exists = previous.some((section) => section.id === savedSection.id);
      return exists
        ? previous.map((section) => section.id === savedSection.id ? savedSection : section)
        : [...previous, savedSection];
    });
  };

  const handleSectionDeleted = (sectionId: string) => {
    setSections((previous) => previous.filter((section) => section.id !== sectionId));
    setIssues((previous) => previous.filter((issue) => issue.sectionId !== sectionId));
  };

  /*
   * =====================================================
   * SEND CHAT MESSAGE
   * =====================================================
   */

  const handleSendMessage = (content: string) => {
    if (!boardId) {
      return;
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    if (!connected) {
      console.error("Cannot send chat message: WebSocket is disconnected");
      return;
    }

    sendMessage(trimmedContent);
  };

  /*
   * =====================================================
   * DRAG AND DROP
   * =====================================================
   */

  const handleDragEnd = async (event: DragEndEvent) => {
    const { operation } = event;

    if (!operation) {
      return;
    }

    const source = operation.source;
    const target = operation.target;

    if (!source || !target) {
      return;
    }

    const issueId = String(source.id);
    const targetSectionId = String(target.id);

    const issue = issues.find((item) => item.id === issueId);

    if (!issue) {
      return;
    }

    if (issue.sectionId === targetSectionId) {
      return;
    }

    const targetSection = sections.find(
      (section) => section.id === targetSectionId
    );

    if (!targetSection) {
      return;
    }

    const previousSectionId = issue.sectionId;

    setIssues((previous) =>
      previous.map((item) =>
        item.id === issueId
          ? {
              ...item,
              sectionId: targetSectionId,
            }
          : item
      )
    );

    try {
      await moveIssue(issueId, targetSectionId);
    } catch (error) {
      console.error("Error moving issue:", error);

      setIssues((previous) =>
        previous.map((item) =>
          item.id === issueId
            ? {
                ...item,
                sectionId: previousSectionId,
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
          <p className="text-sm text-muted-foreground">Board not found.</p>
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
      <DragDropProvider onDragEnd={handleDragEnd}>
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
            <div className="min-w-0">
              <h1 className="text-xl font-semibold sm:text-2xl">Board</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your issues and workflow.
              </p>
            </div>

            <div className="flex min-w-0 items-center overflow-x-auto sm:justify-end">
              <UserProfile users={onlineUsers} />
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
            {connected ? "Connected" : "Disconnected"}
          </div>

          {/* CREATE ISSUE */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              onClick={() => setCreateIssueOpen(true)}
              disabled={sections.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create issue
            </Button>
            {canManageAssignments && (
              <Button className="w-full sm:w-auto" variant="outline" onClick={() => setCreateSectionOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create section
              </Button>
            )}
          </div>

          {/* SECTIONS */}
          {sections.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center sm:p-10">
              <h2 className="font-medium">No sections yet</h2>
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
                items-stretch
                gap-4
                md:flex-row
                md:items-start
                md:overflow-x-auto
                md:overscroll-x-contain
                md:pb-2
                pb-4
                sm:pb-5
                lg:pb-6
              "
            >
              {sections.map((section) => {
                const sectionIssues = issues.filter(
                  (issue) => issue.sectionId === section.id
                );

                return (
                  <BoardSection
                    key={section.id}
                    section={section}
                    issues={sectionIssues}
                    sections={sections}
                    boardId={boardId}
                    canManageAssignments={canManageAssignments}
                    onIssueCreated={handleIssueCreated}
                    onIssueUpdated={handleIssueUpdated}
                    onIssueDeleted={handleIssueDeleted}
                    onSectionUpdated={handleSectionSaved}
                    onSectionDeleted={handleSectionDeleted}
                  />
                );
              })}
            </div>
          )}

          {/* CREATE ISSUE DIALOG */}
          {sections.length > 0 && (
            <CreateIssueDialog
              open={createIssueOpen}
              onOpenChange={setCreateIssueOpen}
              sections={sections}
              boardId={boardId}
              onCreated={handleIssueCreated}
            />
          )}

          {canManageAssignments && (
            <SectionDialog
              open={createSectionOpen}
              onOpenChange={setCreateSectionOpen}
              boardId={boardId}
              onSaved={handleSectionSaved}
            />
          )}

          {/* BOARD CHAT */}
          <ChatComponent
            messages={messages as ChatMessage[]}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            disabled={!connected}
          />
        </div>
      </DragDropProvider>
    </AppLayout>
  );
};

export default Board;
