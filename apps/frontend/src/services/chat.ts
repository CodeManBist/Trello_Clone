import { apiRequest } from "./api";

export type ChatMessage = {
  id: string;
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
export function createChatMessage(
  boardId: string,
  content: string
) {
  return apiRequest<ChatMessage>(
    `/boards/${boardId}/chat-messages`,
    {
      method: "POST",
      body: JSON.stringify({
        content,
      }),
    }
  );
}