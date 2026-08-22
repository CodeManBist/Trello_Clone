import { apiRequest } from "./api";

/* ----------------------------- */
/* Types                         */
/* ----------------------------- */

export type IssueUser = {
  id: string;
  username: string;
  email: string;
};

export type IssueAssignee = {
  id: string;
  userId: string;
  issueId: string;
  user: IssueUser;
};

export type IssueComment = {
  id: string;
  content: string;
  userId: string;
  issueId: string;
  user: IssueUser;
  createdAt?: string;
};

export type Issue = {
  id: string;
  title: string;
  description: string | null;
  boardId: string;
  sectionId: string;

  assignees?: IssueAssignee[];
  comments?: IssueComment[];
};

export type CreateIssueResponse = Issue;

export type UpdateIssueResponse = Issue;

export type DeleteIssueResponse = {
  message: string;
};

/* ----------------------------- */
/* Get issues for a section       */
/* ----------------------------- */

export function getIssues(sectionId: string) {
  return apiRequest<Issue[]>(
    `/sections/${sectionId}/issues`
  );
}

/* ----------------------------- */
/* Get single issue               */
/* ----------------------------- */

export function getIssue(issueId: string) {
  return apiRequest<Issue>(
    `/issues/${issueId}`
  );
}

/* ----------------------------- */
/* Create issue                   */
/* ----------------------------- */

export function createIssue(
  sectionId: string,
  title: string,
  description?: string
) {
  return apiRequest<CreateIssueResponse>(
    `/sections/${sectionId}/issues`,
    {
      method: "POST",
      body: JSON.stringify({
        title,
        description,
      }),
    }
  );
}

/* ----------------------------- */
/* Update issue                   */
/* ----------------------------- */

export function updateIssue(
  issueId: string,
  title: string,
  description?: string
) {
  return apiRequest<UpdateIssueResponse>(
    `/issues/${issueId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title,
        description,
      }),
    }
  );
}

/* ----------------------------- */
/* Delete issue                   */
/* ----------------------------- */

export function deleteIssue(issueId: string) {
  return apiRequest<DeleteIssueResponse>(
    `/issues/${issueId}`,
    {
      method: "DELETE",
    }
  );
}

//move issues
export function moveIssue(issueId: string, sectionId: string) {
  return apiRequest<UpdateIssueResponse>(
    `/issues/${issueId}/move`,
    {
      method: "PUT",
      body: JSON.stringify({
        sectionId,
      }),
    }
  );
}