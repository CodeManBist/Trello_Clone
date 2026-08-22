import { useState } from "react";
import {
  useDraggable,
  useDroppable,
} from "@dnd-kit/react";
import {
  Plus,
  GripVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import CreateIssueDialog from "@/components/board/CreateIssueDialog";

import type { Section } from "@/services/section";
import type { Issue } from "@/services/issue";

type BoardSectionProps = {
  section: Section;
  issues: Issue[];
  sections: Section[];
  onIssueCreated: (issue: Issue) => void;
};

type IssueCardProps = {
  issue: Issue;
};

const IssueCard = ({ issue }: IssueCardProps) => {
  const {
    ref,
    isDragging,
  } = useDraggable({
    id: issue.id,
  });

  return (
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
      <div className="flex items-start gap-2">
        <GripVertical
          className="
            mt-0.5
            h-4
            w-4
            shrink-0
            text-muted-foreground
          "
        />

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
      </div>
    </div>
  );
};

const BoardSection = ({
  section,
  issues,
  sections,
  onIssueCreated,
}: BoardSectionProps) => {
  const [createOpen, setCreateOpen] =
    useState(false);

  const {
    ref: dropRef,
    isDropTarget,
  } = useDroppable({
    id: section.id,
  });

  return (
    <>
      <div
        ref={dropRef}
        className={[
          /*
           * Responsive sizing only.
           *
           * Mobile:
           * almost full viewport width
           *
           * Tablet:
           * fixed comfortable card width
           *
           * Desktop:
           * 320px
           */
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
            onClick={() =>
              setCreateOpen(true)
            }
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
                onClick={() =>
                  setCreateOpen(true)
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add issue
              </Button>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
              />
            ))
          )}
        </div>
      </div>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sections={sections}
        onCreated={onIssueCreated}
      />
    </>
  );
};

export default BoardSection;