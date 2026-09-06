import { apiRequest } from "./api";
import type { IssueComment } from "./issue";

export function getComments(issueId: string) {
  return apiRequest<IssueComment[]>(`/issues/${issueId}/comments`);
}

export function createComment(issueId: string, content: string) {
  return apiRequest<IssueComment>(`/issues/${issueId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updateComment(commentId: string, content: string) {
  return apiRequest<IssueComment>(`/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export function deleteComment(commentId: string) {
  return apiRequest<{ message: string }>(`/comments/${commentId}`, {
    method: "DELETE",
  });
}
