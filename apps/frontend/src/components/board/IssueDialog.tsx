import { useEffect, useState } from "react";
import { Loader2, Pencil, Trash2, UserMinus, UserPlus } from "lucide-react";

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
  assignUserToIssue,
  createIssue,
  getIssueAssignees,
  removeUserFromIssue,
  updateIssue,
  type IssueAssignee,
  type IssueComment,
  type Issue,
} from "@/services/issue";
import { getBoardMembers } from "@/services/boards";
import type { OrganizationMember } from "@/services/organizations";
import { createComment, deleteComment, getComments, updateComment } from "@/services/comments";
import { useAuth } from "@/context/AuthContext";

import type { Section } from "@/services/section";

type IssueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: Section[];
  boardId: string;
  onCreated?: (issue: Issue) => void;
  onUpdated?: (issue: Issue) => void;
  editingIssue?: Issue | null;
  onAssigneesChanged?: (issueId: string, assignees: IssueAssignee[]) => void;
};

const IssueDialog = ({
  open,
  onOpenChange,
  sections,
  boardId,
  onCreated,
  onUpdated,
  editingIssue = null,
  onAssigneesChanged,
}: IssueDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [assignees, setAssignees] = useState<IssueAssignee[]>([]);
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [canManageAssignments, setCanManageAssignments] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [changingUserId, setChangingUserId] = useState<string | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentSaving, setCommentSaving] = useState(false);

  const isEditing = !!editingIssue;

  // Reset form when dialog opens or editing issue changes
  useEffect(() => {
    console.log("IssueDialog useEffect - open:", open, "editingIssue:", editingIssue);
    if (open) {
      if (editingIssue) {
        // Edit mode - populate form with issue data
        console.log("Populating form with issue data:", editingIssue);
        setTitle(editingIssue.title);
        setDescription(editingIssue.description || "");
        setSectionId(editingIssue.sectionId);
      } else if (sections.length > 0 && !sectionId) {
        // Create mode - select first section
        setSectionId(sections[0].id);
      }
    }
  }, [open, editingIssue, sections]);

  useEffect(() => {
    if (!open || !editingIssue) return;

    const loadAssigneeData = async () => {
      try {
        setAssigneesLoading(true);
        setCommentsLoading(true);
        const [boardMemberData, issueAssignees, issueComments] = await Promise.all([
          getBoardMembers(boardId),
          getIssueAssignees(editingIssue.id),
          getComments(editingIssue.id),
        ]);
        setMembers(boardMemberData.members);
        setCanManageAssignments(boardMemberData.canManageAssignments);
        setAssignees(issueAssignees);
        setComments(issueComments);
        setSelectedMemberId("");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load assignees.");
      } finally {
        setAssigneesLoading(false);
        setCommentsLoading(false);
      }
    };

    loadAssigneeData();
  }, [open, editingIssue, boardId]);

  // Reset form when dialog closes
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSectionId(sections.length > 0 ? sections[0].id : "");
    setError("");
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Issue title is required.");
      return;
    }

    if (!sectionId) {
      setError("Please select a section.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let issue: Issue;

      if (isEditing && editingIssue) {
        // Update existing issue
        console.log("Updating issue:", editingIssue.id, trimmedTitle);
        issue = await updateIssue(
          editingIssue.id,
          trimmedTitle,
          description.trim() || undefined
        );
        onUpdated?.(issue);
      } else {
        // Create new issue
        console.log("Creating issue:", trimmedTitle);
        issue = await createIssue(
          sectionId,
          trimmedTitle,
          description.trim() || undefined
        );
        onCreated?.(issue);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error(
        isEditing ? "Error updating issue:" : "Error creating issue:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : isEditing
            ? "Failed to update issue."
            : "Failed to create issue."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (loading) {
      return;
    }

    if (!value) {
      resetForm();
    }

    onOpenChange(value);
  };

  const assignSelectedMember = async () => {
    if (!editingIssue) return;

    const member = members.find((item) => item.userId === selectedMemberId);
    if (!member) return;

    try {
      setChangingUserId(member.userId);
      const assignment = await assignUserToIssue(editingIssue.id, member.userId);
      const nextAssignees = [...assignees, assignment];
      setAssignees(nextAssignees);
      setSelectedMemberId("");
      onAssigneesChanged?.(editingIssue.id, nextAssignees);
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : "Failed to update assignee.");
    } finally {
      setChangingUserId(null);
    }
  };

  const removeAssignee = async (assignee: IssueAssignee) => {
    if (!editingIssue) return;

    try {
      setChangingUserId(assignee.userId);
      await removeUserFromIssue(editingIssue.id, assignee.userId);
      const nextAssignees = assignees.filter((item) => item.userId !== assignee.userId);
      setAssignees(nextAssignees);
      onAssigneesChanged?.(editingIssue.id, nextAssignees);
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : "Failed to remove assignee.");
    } finally {
      setChangingUserId(null);
    }
  };

  const saveComment = async () => {
    if (!editingIssue || !commentContent.trim()) return;
    try {
      setCommentSaving(true);
      const saved = editingCommentId
        ? await updateComment(editingCommentId, commentContent.trim())
        : await createComment(editingIssue.id, commentContent.trim());
      setComments((previous) => editingCommentId
        ? previous.map((comment) => comment.id === saved.id ? saved : comment)
        : [...previous, saved]);
      setCommentContent("");
      setEditingCommentId(null);
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Failed to save comment.");
    } finally {
      setCommentSaving(false);
    }
  };

  const startEditingComment = (comment: IssueComment) => {
    setEditingCommentId(comment.id);
    setCommentContent(comment.content);
  };

  const removeComment = async (comment: IssueComment) => {
    if (!confirm("Delete this comment?")) return;
    try {
      setCommentSaving(true);
      await deleteComment(comment.id);
      setComments((previous) => previous.filter((item) => item.id !== comment.id));
      if (editingCommentId === comment.id) {
        setEditingCommentId(null);
        setCommentContent("");
      }
    } catch (commentError) {
      setError(commentError instanceof Error ? commentError.message : "Failed to delete comment.");
    } finally {
      setCommentSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {isEditing ? "Edit issue" : "Create issue"}
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Update the issue details below."
              : "Create an issue and choose which section it belongs to."
            }
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
            <label htmlFor="issue-title" className="text-sm font-medium">
              Title
            </label>

            <Input
              id="issue-title"
              placeholder="e.g. Fix login button"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Section - Disabled in edit mode */}
          <div className="space-y-2">
            <label htmlFor="issue-section" className="text-sm font-medium">
              Section
            </label>

            <select
              id="issue-section"
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              disabled={
                loading ||
                sections.length === 0 ||
                isEditing // Disable section change in edit mode
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
              <option value="">Select a section</option>

              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>

            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Section cannot be changed while editing.
              </p>
            )}

            {sections.length === 0 && (
              <p className="text-xs text-muted-foreground">
                This board has no sections.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="issue-description" className="text-sm font-medium">
              Description
            </label>

            <Textarea
              id="issue-description"
              placeholder="Describe the issue..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={loading}
              rows={5}
              className="resize-none"
            />
          </div>

          {isEditing && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Assignees</label>
              {assigneesLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading members...
                </div>
              ) : (
                <>
                  <div className="space-y-1 rounded-md border p-2">
                    {assignees.length === 0 ? (
                      <p className="px-1 py-2 text-sm text-muted-foreground">No one is assigned.</p>
                    ) : (
                      assignees.map((assignee) => (
                        <div key={assignee.id} className="flex items-center justify-between gap-3 rounded px-1 py-1.5">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{assignee.user.username}</span>
                            <span className="block truncate text-xs text-muted-foreground">{assignee.user.email}</span>
                          </span>
                          {canManageAssignments && (
                            <Button type="button" size="sm" variant="ghost" className="shrink-0 text-destructive hover:text-destructive" onClick={() => removeAssignee(assignee)} disabled={changingUserId !== null}>
                              {changingUserId === assignee.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="mr-1 h-4 w-4" />}
                              Remove
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {canManageAssignments ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        aria-label="Member to assign"
                        value={selectedMemberId}
                        onChange={(event) => setSelectedMemberId(event.target.value)}
                        disabled={changingUserId !== null || members.length === assignees.length}
                        className="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a member</option>
                        {members.filter((member) => !assignees.some((assignee) => assignee.userId === member.userId)).map((member) => (
                          <option key={member.id} value={member.userId}>{member.user.username} ({member.user.email})</option>
                        ))}
                      </select>
                      <Button type="button" onClick={assignSelectedMember} disabled={!selectedMemberId || changingUserId !== null}>
                        {changingUserId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        Assign
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Only organization admins can assign or remove assignees.</p>
                  )}
                </>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-3 border-t pt-5">
              <label className="text-sm font-medium">Comments</label>
              {commentsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading comments...</div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const isAuthor = comment.userId === user?.id;
                    return (
                      <div key={comment.id} className="rounded-md border bg-muted/20 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{comment.user.username}</p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.content}</p>
                          </div>
                          {isAuthor && (
                            <div className="flex shrink-0">
                              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditingComment(comment)} disabled={commentSaving} aria-label="Edit comment"><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeComment(comment)} disabled={commentSaving} aria-label="Delete comment"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="space-y-2">
                <Textarea value={commentContent} onChange={(event) => setCommentContent(event.target.value)} disabled={commentSaving} rows={3} placeholder="Write a comment..." className="resize-none" />
                <div className="flex justify-end gap-2">
                  {editingCommentId && <Button type="button" variant="outline" onClick={() => { setEditingCommentId(null); setCommentContent(""); }} disabled={commentSaving}>Cancel</Button>}
                  <Button type="button" onClick={saveComment} disabled={!commentContent.trim() || commentSaving}>
                    {commentSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingCommentId ? "Save comment" : "Add comment"}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !sectionId}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              isEditing ? "Update issue" : "Create issue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IssueDialog;
