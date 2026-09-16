import { apiRequest } from "./api";

export type ChatMessage = {
  id: string;
  type: "chat_message";
  content: string;
  userId: string;
  username: string;
  boardId: string;
  createdAt: string;
};

/*
 * Get previous chat messages
 */
export function getChatMessages(
  boardId: string
) {
  return apiRequest<ChatMessage[]>(
    `/boards/${boardId}/chat-messages`
  );
}

/*
 * Create a new chat message
 */
