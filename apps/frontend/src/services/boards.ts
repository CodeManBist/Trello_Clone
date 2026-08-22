import { apiRequest } from "./api";

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
