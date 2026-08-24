import { useEffect, useRef, useState } from "react";
import { getChatMessages } from "@/services/chat";

export type OnlineUser = {
  id: string;
  username: string;
  online: boolean;
};

export type ChatMessage = {
  id: string;
  type: "chat_message";
  content: string;
  userId: string;
  username: string;
  boardId: string;
  createdAt: string;
};

type WebSocketMessage =
  | {
      type: "authenticated";
      userId: string;
    }
  | {
      type: "you";
      userId: string;
    }
  | {
      type: "initial_stage";
      users: {
        id: string;
        username: string;
        online?: boolean;
      }[];
    }
  | {
      type: "join";
      user: {
        id: string;
        username: string;
        online?: boolean;
      };
    }
  | {
      type: "chat_message";
      id: string;
      content: string;
      userId: string;
      username: string;
      boardId: string;
      createdAt: string;
    }
  | {
      type: "leave";
      userId: string;
    }
  | {
      type: "error";
      message: string;
    };

const useBoardWebSocket = (boardId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  /*
   * =====================================================
   * LOAD EXISTING DATABASE MESSAGES
   * =====================================================
   */
  useEffect(() => {
    if (!boardId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      try {
        const existingMessages = await getChatMessages(boardId);

        if (cancelled) {
          return;
        }

        setMessages(
          existingMessages.map((message) => ({
            id: message.id,
            type: "chat_message",
            content: message.content,
            userId: message.userId,
            username: message.username,
            boardId: message.boardId,
            createdAt: message.createdAt,
          }))
        );
      } catch (error) {
        console.error(
          "Failed to load chat messages:",
          error
        );
      }
    };

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [boardId]);

  /*
   * =====================================================
   * WEBSOCKET CONNECTION
   * =====================================================
   */
  useEffect(() => {
    if (!boardId) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      console.error("WS: No authentication token");
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:3002?token=${encodeURIComponent(token)}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WS: Connected");
      setConnected(true);
    };

    socket.onmessage = (event) => {
      console.log("WS RECEIVED:", event.data);

      let data: WebSocketMessage;

      try {
        data = JSON.parse(event.data);
      } catch {
        console.error("WS: Invalid JSON");
        return;
      }

      /*
       * =================================================
       * AUTHENTICATED
       * =================================================
       */
      if (data.type === "authenticated") {
        console.log(
          "WS: Authenticated:",
          data.userId
        );

        setCurrentUserId(data.userId);

        /*
         * IMPORTANT:
         * Join board only after authentication.
         */
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "join",
              boardId,
            })
          );
        }

        return;
      }

      /*
       * =================================================
       * CURRENT USER
       * =================================================
       */
      if (data.type === "you") {
        setCurrentUserId(data.userId);
        return;
      }

      /*
       * =================================================
       * INITIAL ONLINE USERS
       * =================================================
       */
      if (data.type === "initial_stage") {
        setOnlineUsers(
          data.users.map((user) => ({
            id: user.id,
            username: user.username,
            online: true,
          }))
        );

        return;
      }

      /*
       * =================================================
       * USER JOINED
       * =================================================
       */
      if (data.type === "join") {
        setOnlineUsers((previousUsers) => {
          const exists = previousUsers.some(
            (user) => user.id === data.user.id
          );

          if (exists) {
            return previousUsers;
          }

          return [
            ...previousUsers,
            {
              id: data.user.id,
              username: data.user.username,
              online: true,
            },
          ];
        });

        return;
      }

      /*
       * =================================================
       * CHAT MESSAGE
       * =================================================
       */
      if (data.type === "chat_message") {
        console.log(
          "WS CHAT MESSAGE:",
          data
        );

        /*
         * Only accept messages belonging
         * to this board.
         */
        if (data.boardId !== boardId) {
          return;
        }

        const incomingMessage: ChatMessage = {
          id: data.id,
          type: "chat_message",
          content: data.content,
          userId: data.userId,
          username: data.username,
          boardId: data.boardId,
          createdAt: data.createdAt,
        };

        setMessages((previousMessages) => {
          /*
           * Prevent duplicate messages.
           */
          const exists = previousMessages.some(
            (message) =>
              message.id === incomingMessage.id
          );

          if (exists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            incomingMessage,
          ];
        });

        return;
      }

      /*
       * =================================================
       * USER LEFT
       * =================================================
       */
      if (data.type === "leave") {
        setOnlineUsers((previousUsers) =>
          previousUsers.filter(
            (user) =>
              user.id !== data.userId
          )
        );

        return;
      }

      /*
       * =================================================
       * SERVER ERROR
       * =================================================
       */
      if (data.type === "error") {
        console.error(
          "WS SERVER ERROR:",
          data.message
        );

        return;
      }
    };

    socket.onerror = (error) => {
      console.error("WS ERROR:", error);
      setConnected(false);
    };

    socket.onclose = (event) => {
      console.log(
        "WS CLOSED:",
        event.code,
        event.reason
      );

      setConnected(false);
      setOnlineUsers([]);

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };

    return () => {
      socket.close();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [boardId]);

  /*
   * =====================================================
   * SEND MESSAGE
   * =====================================================
   */
  const sendMessage = (content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return;
    }

    if (!boardId) {
      console.error("WS: Missing boardId");
      return;
    }

    const socket = socketRef.current;

    if (!socket) {
      console.error("WS: Socket does not exist");
      return;
    }

    if (socket.readyState !== WebSocket.OPEN) {
      console.error("WS: Socket is not connected");
      return;
    }

    /*
     * DO NOT call createChatMessage() here.
     *
     * The WebSocket server must:
     *
     * 1. authenticate the user
     * 2. save the message to PostgreSQL
     * 3. broadcast the saved message to everyone
     *
     * This prevents duplicate database messages.
     */
    socket.send(
      JSON.stringify({
        type: "chat_message",
        boardId,
        content: trimmedContent,
      })
    );

    console.log(
      "WS SENT:",
      {
        type: "chat_message",
        boardId,
        content: trimmedContent,
      }
    );
  };

  return {
    onlineUsers,
    connected,
    messages,
    currentUserId,
    sendMessage,
  };
};

export default useBoardWebSocket;