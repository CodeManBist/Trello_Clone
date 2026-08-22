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