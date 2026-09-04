import { useState, useCallback, useRef, useEffect } from "react";
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import {
  Plus,
  Pencil,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import IssueDialog from "@/components/board/IssueDialog";

import type { Section } from "@/services/section";
import type { Issue } from "@/services/issue";
import { deleteIssue, updateIssue } from "@/services/issue"; 

type BoardSectionProps = {
  section: Section;
  issues: Issue[];
  sections: Section[];
  onIssueCreated: (issue: Issue) => void;
  onIssueUpdated: (issue: Issue) => void;
  onIssueDeleted: (issueId: string) => void;
};

type IssueCardProps = {
  issue: Issue;
  sections: Section[];
  onIssueUpdated: (issue: Issue) => void;
  onIssueDeleted: (issueId: string) => void;  
};

const IssueCard = ({ issue, sections, onIssueUpdated, onIssueDeleted }: IssueCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  
  const {
    ref,
    isDragging,
  } = useDraggable({
    id: issue.id,
  });

  // Force the dialog to open using a more reliable method
  const openEditDialog = useCallback(() => {
    console.log("Opening edit dialog for issue:", issue.id);
    // Force a state update using a function to ensure it works
    setEditDialogOpen(() => {
      console.log("Setting editDialogOpen to true");
      return true;
    });
  }, [issue.id]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Edit button clicked for issue:", issue.id);
    console.log("Current editDialogOpen state before:", editDialogOpen);
    
    // Use requestAnimationFrame to ensure the click event is fully processed
    requestAnimationFrame(() => {
      openEditDialog();
    });
  }, [issue.id, openEditDialog, editDialogOpen]);

  const handleDeleteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${issue.title}"?`)) {
      return;
    }
    
    try {
      console.log("Deleting issue:", issue.id);
      await deleteIssue(issue.id);
      onIssueDeleted(issue.id);
    } catch (error) {
      console.error("Error deleting issue:", error);
    }
  }, [issue.id, issue.title, onIssueDeleted]);

  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log("Dialog onOpenChange:", open);
    setEditDialogOpen(open);
  }, []);

  const handleIssueUpdated = useCallback((updatedIssue: Issue) => {
    console.log("Issue updated:", updatedIssue);
    onIssueUpdated(updatedIssue);
    setEditDialogOpen(false);
  }, [onIssueUpdated]);

  // Debug: Log when dialog state changes
  useEffect(() => {
    console.log("editDialogOpen state changed to:", editDialogOpen);
  }, [editDialogOpen]);

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
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="break-words font-medium">
              {issue.title}
            </p>

            {issue.description && (
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {issue.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-1">
            <button
              ref={editButtonRef}
              onClick={handleEditClick}
              className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer hover:text-foreground"
              aria-label="Edit issue"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="h-4 w-4 shrink-0 text-muted-foreground cursor-pointer hover:text-destructive"
              aria-label="Delete issue"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Dialog - Always render but control with open prop */}
      <IssueDialog
        open={editDialogOpen}
        onOpenChange={handleDialogOpenChange}
        sections={sections}
        onUpdated={handleIssueUpdated}
        editingIssue={issue}
      />
    </>
  );
};

const BoardSection = ({
  section,
  issues,
  sections,
  onIssueCreated,
  onIssueUpdated,
  onIssueDeleted,
}: BoardSectionProps) => {
  const [createOpen, setCreateOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const {
    ref: dropRef,
    isDropTarget,
  } = useDroppable({
    id: section.id,
  });

  // Force re-render when needed
  const triggerUpdate = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  return (
    <>
      <div
        ref={dropRef}
        className={[
          "w-[calc(100vw-2rem)]",
          "max-w-[360px]",
          "sm:w-[320px]",
          "lg:w-80",
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

          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            onClick={() => {
              console.log("Opening create dialog");
              setCreateOpen(true);
            }}
            title="Create issue"
          >
            <Plus className="h-4 w-4" />
          </Button>
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

              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add issue
              </Button>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id + forceUpdate} // Force re-render on update
                issue={issue}
                sections={sections}
                onIssueUpdated={onIssueUpdated}
                onIssueDeleted={onIssueDeleted}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <IssueDialog
        open={createOpen}
        onOpenChange={(open) => {
          console.log("Create dialog onOpenChange:", open);
          setCreateOpen(open);
        }}
        sections={sections}
        onCreated={(newIssue) => {
          console.log("Issue created:", newIssue);
          onIssueCreated(newIssue);
          setCreateOpen(false);
        }}
      />
    </>
  );
};

export default BoardSection;