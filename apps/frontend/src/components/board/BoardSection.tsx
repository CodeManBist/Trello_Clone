import { useState } from "react";
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import {
  Pencil,
  Trash2,
  Plus,
  UserPlus
} from "lucide-react";

import IssueDialog from "@/components/board/IssueDialog";
import SectionDialog from "@/components/board/SectionDialog";

import { deleteSection, type Section } from "@/services/section";
import type { Issue } from "@/services/issue";
import { deleteIssue } from "@/services/issue"; 
import { Button } from "@/components/ui/button";


type BoardSectionProps = {
  section: Section;
  issues: Issue[];
  sections: Section[];
  boardId: string;
  canManageAssignments: boolean;
  onIssueCreated: (issue: Issue) => void;
  onIssueUpdated: (issue: Issue) => void;
  onIssueDeleted: (issueId: string) => void;
  onSectionUpdated: (section: Section) => void;
  onSectionDeleted: (sectionId: string) => void;
};

type IssueCardProps = {
  issue: Issue;
  sections: Section[];
  boardId: string;
  canManageAssignments: boolean;
  onIssueUpdated: (issue: Issue) => void;
  onIssueDeleted: (issueId: string) => void;  
};

const IssueCard = ({ issue, sections, boardId, canManageAssignments, onIssueUpdated, onIssueDeleted }: IssueCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const {
    ref,
    isDragging,
  } = useDraggable({
    id: issue.id,
  });

  const handleDeleteClick = async () => {
    if (!confirm(`Are you sure you want to delete "${issue.title}"?`)) {
      return;
    }
    
    try {
      await deleteIssue(issue.id);
      onIssueDeleted(issue.id);
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  };

  const handleIssueUpdated = (updatedIssue: Issue) => {
    onIssueUpdated(updatedIssue);
    setEditDialogOpen(false);
  };

  return (
    <>
      <div
        ref={ref}
        className={[
          "w-full rounded-lg border bg-background p-3",
          "select-none touch-none",
          "cursor-grab",
          "transition-opacity",
          isDragging
            ? "opacity-50"
            : "opacity-100",
        ].join(" ")}
      >
        <div className="flex flex-col gap-2">
          {/* Top row: Assign button + Edit/Delete buttons */}
          <div className="flex items-center justify-between">
            {canManageAssignments ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditDialogOpen(true);
                }}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Assign</span>
              </Button>
            ) : (
              <span className="truncate text-xs text-muted-foreground" title={issue.assignees?.map((assignee) => assignee.user.username).join(", ")}>
                {issue.assignees?.length
                  ? `Assigned: ${issue.assignees.map((assignee) => assignee.user.username).join(", ")}`
                  : "Unassigned"}
              </span>
            )}

            <div className="flex items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setEditDialogOpen(true)}
                aria-label="Edit issue"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={handleDeleteClick}
                aria-label="Delete issue"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Issue content */}
          <div className="min-w-0 flex-1">
            <p className="break-words font-medium text-sm">
              {issue.title}
            </p>

            {issue.description && (
              <p className="mt-1 break-words text-xs text-muted-foreground">
                {issue.description}
              </p>
            )}

            {issue.assignees && issue.assignees.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Assigned to {issue.assignees.map((assignee) => assignee.user.username).join(", ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <IssueDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        sections={sections}
        boardId={boardId}
        onUpdated={handleIssueUpdated}
        onAssigneesChanged={(issueId, assignees) =>
          onIssueUpdated({ ...issue, id: issueId, assignees })
        }
        editingIssue={issue}
      />
    </>
  );
};

const BoardSection = ({
  section,
  issues,
  sections,
  boardId,
  canManageAssignments,
  onIssueCreated,
  onIssueUpdated,
  onIssueDeleted,
  onSectionUpdated,
  onSectionDeleted,
}: BoardSectionProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);

  const {
    ref: dropRef,
    isDropTarget,
  } = useDroppable({
    id: section.id,
  });

  const handleDeleteSection = async () => {
    if (!confirm(`Delete "${section.title}" and all of its issues?`)) return;
    try {
      await deleteSection(section.id);
      onSectionDeleted(section.id);
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  return (
    <>
      <div
        ref={dropRef}
        className={[
          "w-full",
          "max-w-none",
          "md:w-[300px]",
          "md:max-w-[300px]",
          "lg:w-[320px]",
          "lg:max-w-[320px]",
          "shrink-0",
          "rounded-xl border",
          "bg-muted/30",
          "transition-colors",
          isDropTarget
            ? "border-primary bg-primary/5"
            : "",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b p-3 sm:p-4">
          <div className="min-w-0">
            <h2 className="truncate font-semibold">
              {section.title}
            </h2>

            <p className="text-xs text-muted-foreground">
              {issues.length}{" "}
              {issues.length === 1
                ? "issue"
                : "issues"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {canManageAssignments && (
              <>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditSectionOpen(true)} title="Rename section" aria-label="Rename section">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDeleteSection} title="Delete section" aria-label="Delete section">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0"
              onClick={() => setCreateOpen(true)}
              title="Create issue"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Drop area */}
        <div className="min-h-24 space-y-3 p-2.5 sm:p-3">
          {issues.length === 0 ? (
            <div
              className={[
                "rounded-lg",
                "border border-dashed",
                "p-5 text-center sm:p-6",
                isDropTarget
                  ? "border-primary bg-primary/10"
                  : "",
              ].join(" ")}
            >
              <p className="text-sm text-muted-foreground">
                No issues
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                sections={sections}
                boardId={boardId}
                canManageAssignments={canManageAssignments}
                onIssueUpdated={onIssueUpdated}
                onIssueDeleted={onIssueDeleted}
              />
            ))
          )}
        </div>
      </div>

      <IssueDialog
        open={createOpen}
        onOpenChange={(open) => {
          console.log("Create dialog onOpenChange:", open);
          setCreateOpen(open);
        }}
        sections={sections}
        boardId={boardId}
        onCreated={(newIssue) => {
          console.log("Issue created:", newIssue);
          onIssueCreated(newIssue);
          setCreateOpen(false);
        }}
      />

      {canManageAssignments && (
        <SectionDialog
          open={editSectionOpen}
          onOpenChange={setEditSectionOpen}
          boardId={boardId}
          section={section}
          onSaved={onSectionUpdated}
        />
      )}
    </>
  );
};

export default BoardSection;
