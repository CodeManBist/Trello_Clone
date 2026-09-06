import { apiRequest } from "./api";

export type Section = {
  id: string;
  title: string;
  boardId: string;
};

export function getSections(boardId: string) {
  return apiRequest<Section[]>(
    `/boards/${boardId}/sections`
  );
}

export function createSection(boardId: string, title: string) {
  return apiRequest<Section>(`/boards/${boardId}/sections`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function updateSection(sectionId: string, title: string) {
  return apiRequest<Section>(`/sections/${sectionId}`, {
    method: "PUT",
    body: JSON.stringify({ title }),
  });
}

export function deleteSection(sectionId: string) {
  return apiRequest<{ message: string }>(`/sections/${sectionId}`, {
    method: "DELETE",
  });
}
