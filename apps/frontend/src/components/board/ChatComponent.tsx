import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ChatMessage = {
  id: string;
  type: "chat_message";
  content: string;
  userId: string;
  username: string;
  boardId: string;
  createdAt: string;
};

type ChatComponentProps = {
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
};

const getInitials = (username: string) => {
  const name = username.trim();

  if (!name) {
    return "?";
  }

  const parts = name.split(/\s+/);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
};

const formatMessageTime = (
  dateString: string
) => {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const ChatComponent = ({
  messages,
  currentUserId,
  onSendMessage,
  disabled = false,
}: ChatComponentProps) => {
  const [message, setMessage] = useState("");

  const containerRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  /*
   * Scroll whenever messages change.
   */

  useEffect(() => {
    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages]);

  /*
   * Send
   */

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    if (disabled) {
      return;
    }

    onSendMessage(trimmed);

    setMessage("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div className="mt-6 w-full overflow-hidden rounded-2xl border bg-background shadow-sm">

      {/* HEADER */}

      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">
              Board chat
            </h2>

            <p className="text-xs text-muted-foreground">
              Chat with people on this board
            </p>
          </div>

        </div>

        <div className="flex items-center gap-2 text-xs">
          <span
            className={[
              "h-2 w-2 rounded-full",
              disabled
                ? "bg-red-500"
                : "bg-green-500",
            ].join(" ")}
          />

          <span className="text-muted-foreground">
            {disabled
              ? "Offline"
              : "Live"}
          </span>
        </div>
      </div>

      {/* MESSAGES */}

      <div
        ref={containerRef}
        className="h-[380px] overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">

            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
              No messages yet
            </p>

            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Start a conversation with
              everyone working on this board.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {messages.map((chatMessage) => {
              const isOwnMessage =
                chatMessage.userId ===
                currentUserId;

              return (
                <div
                  key={chatMessage.id}
                  className={[
                    "flex w-full gap-2",
                    isOwnMessage
                      ? "justify-end"
                      : "justify-start",
                  ].join(" ")}
                >

                  {/* OTHER USER */}

                  {!isOwnMessage && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                      {getInitials(
                        chatMessage.username
                      )}
                    </div>
                  )}

                  <div
                    className={[
                      "flex max-w-[75%] flex-col",
                      isOwnMessage
                        ? "items-end"
                        : "items-start",
                    ].join(" ")}
                  >

                    {/* USERNAME */}

                    {!isOwnMessage && (
                      <span className="mb-1 px-1 text-[11px] font-semibold text-muted-foreground">
                        {chatMessage.username}
                      </span>
                    )}

                    {/* BUBBLE */}

                    <div
                      className={[
                        "break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                        isOwnMessage
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
                      ].join(" ")}
                    >
                      {chatMessage.content}
                    </div>

                    {/* TIME */}

                    <span className="mt-1 px-1 text-[10px] text-muted-foreground">
                      {formatMessageTime(
                        chatMessage.createdAt
                      )}
                    </span>

                  </div>

                  {/* OWN USER */}

                  {isOwnMessage && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {getInitials(
                        chatMessage.username
                      )}
                    </div>
                  )}

                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* INPUT */}

      <div className="border-t bg-muted/20 p-3">

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2"
        >

          <Input
            ref={inputRef}
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder={
              disabled
                ? "Connecting to chat..."
                : "Write a message..."
            }
            disabled={disabled}
            maxLength={1000}
            className="h-10 rounded-xl bg-background"
          />

          <Button
            type="submit"
            size="icon"
            disabled={
              disabled ||
              !message.trim()
            }
            className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>

        </form>

        <div className="mt-2 flex items-center justify-between px-1">

          <p className="text-[10px] text-muted-foreground">
            Messages are visible to everyone
            on this board.
          </p>

          <span className="text-[10px] text-muted-foreground">
            {message.length}/1000
          </span>

        </div>
      </div>

    </div>
  );
};

export default ChatComponent;