import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  createIssue,
  type Issue,
} from "@/services/issue";

import type { Section } from "@/services/section";

type CreateIssueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  onCreated: (issue: Issue) => void;
};

const CreateIssueDialog = ({
  open,
  onOpenChange,
  sections,
  onCreated,
}: CreateIssueDialogProps) => {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [sectionId, setSectionId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * Automatically select first section.
   */
  useEffect(() => {
    if (
      open &&
      sections.length > 0 &&
      !sectionId
    ) {
      setSectionId(
        sections[0].id
      );
    }
  }, [
    open,
    sections,
    sectionId,
  ]);

  const handleCreate = async () => {
    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      setError(
        "Issue title is required."
      );
      return;
    }

    if (!sectionId) {
      setError(
        "Please select a section."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const issue =
        await createIssue(
          sectionId,
          trimmedTitle,
          description.trim() ||
            undefined
        );

      onCreated(issue);

      setTitle("");
      setDescription("");
      setSectionId("");

      onOpenChange(false);
    } catch (error) {
      console.error(
        "Error creating issue:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create issue."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (
    value: boolean
  ) => {
    if (loading) {
      return;
    }

    if (!value) {
      setTitle("");
      setDescription("");
      setSectionId("");
      setError("");
    }

    onOpenChange(value);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogContent
        className="
          w-[calc(100%-1rem)]
          max-w-[500px]
          max-h-[90vh]
          overflow-hidden
          rounded-xl
          p-4
          sm:w-[calc(100%-2rem)]
          sm:p-6
        "
      >
        <DialogHeader>
          <DialogTitle>
            Create issue
          </DialogTitle>

          <DialogDescription>
            Create an issue and choose
            which section it belongs to.
          </DialogDescription>
        </DialogHeader>

        <div
          className="
            max-h-[65vh]
            space-y-5
            overflow-y-auto
            py-2
            pr-1
          "
        >
          {/* Title */}
          <div className="space-y-2">
            <label
              htmlFor="issue-title"
              className="text-sm font-medium"
            >
              Title
            </label>

            <Input
              id="issue-title"
              placeholder="e.g. Fix login button"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Section */}
          <div className="space-y-2">
            <label
              htmlFor="issue-section"
              className="text-sm font-medium"
            >
              Section
            </label>

            <select
              id="issue-section"
              value={sectionId}
              onChange={(event) =>
                setSectionId(
                  event.target.value
                )
              }
              disabled={
                loading ||
                sections.length === 0
              }
              className="
                flex
                h-10
                w-full
                min-w-0
                rounded-md
                border
                border-input
                bg-background
                px-3
                py-2
                text-sm
                outline-none
                focus:ring-2
                focus:ring-ring
                focus:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <option value="">
                Select a section
              </option>

              {sections.map(
                (section) => (
                  <option
                    key={section.id}
                    value={section.id}
                  >
                    {section.title}
                  </option>
                )
              )}
            </select>

            {sections.length ===
              0 && (
              <p className="text-xs text-muted-foreground">
                This board has no sections.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="issue-description"
              className="text-sm font-medium"
            >
              Description
            </label>

            <Textarea
              id="issue-description"
              placeholder="Describe the issue..."
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              disabled={loading}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="break-words rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter
          className="
            flex
            flex-col-reverse
            gap-2
            sm:flex-row
            sm:justify-end
          "
        >
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() =>
              handleOpenChange(false)
            }
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={handleCreate}
            disabled={
              loading ||
              !title.trim() ||
              !sectionId
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create issue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateIssueDialog;