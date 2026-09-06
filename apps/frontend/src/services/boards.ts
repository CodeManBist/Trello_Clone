import { apiRequest } from "./api";
import type { OrganizationMember } from "./organizations";

export type BoardMembersResponse = {
    members: OrganizationMember[];
    canManageAssignments: boolean;
};

export type Board = {
    id: string;
    title: string;
    description: string | null;
    organizationId: string;
}

export function getBoards(organizationId: string) {
    return apiRequest<Board[]>(`/organizations/${organizationId}/boards`);
}

export function createBoard(organizationId: string, title: string, description?: string) {
    return apiRequest<Board>(`/organizations/${organizationId}/boards`, {
        method: "POST",
        body: JSON.stringify({ title, description }),
    });
}

export function updateBoard(boardId: string, title: string, description?: string) {
    return apiRequest<Board>(`/boards/${boardId}`, {
        method: "PUT",
        body: JSON.stringify({ title, description }),
    });
}

export function deleteBoard(boardId: string) {
    return apiRequest<void>(`/boards/${boardId}`, {
        method: "DELETE",
    }); 
}

export function getBoardMembers(boardId: string) {
    return apiRequest<BoardMembersResponse>(`/boards/${boardId}/members`);
}
