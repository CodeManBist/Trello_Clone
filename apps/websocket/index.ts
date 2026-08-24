import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "db/client";

const JWT_SECRET =
  process.env.JWT_SECRET || "your_jwt_secret";

const server = new WebSocketServer({
  port: 3002,
});

type RoomUser = {
  userId: string;
  username: string;
  socket: WebSocket;
};

type Rooms = Record<string, RoomUser[]>;

const ROOMS: Rooms = {};

/* =========================================================
 * HELPERS
 * ========================================================= */

function send(socket: WebSocket, message: unknown) {
  if (socket.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    socket.send(JSON.stringify(message));
  } catch (error) {
    console.error("WS SEND ERROR:", error);
  }
}

function broadcast(
  users: RoomUser[],
  message: unknown
) {
  const payload = JSON.stringify(message);

  for (const roomUser of users) {
    if (roomUser.socket.readyState === WebSocket.OPEN) {
      try {
        roomUser.socket.send(payload);
      } catch (error) {
        console.error(
          "WS BROADCAST ERROR:",
          error
        );
      }
    }
  }
}

function removeSocketFromRoom(
  boardId: string,
  socket: WebSocket
) {
  const room = ROOMS[boardId];

  if (!room) {
    return;
  }

  ROOMS[boardId] = room.filter(
    (roomUser) => roomUser.socket !== socket
  );

  if (ROOMS[boardId].length === 0) {
    delete ROOMS[boardId];
  }
}

/* =========================================================
 * CONNECTION
 * ========================================================= */

server.on(
  "connection",
  async (socket, request) => {
    console.log(
      "========== WS CONNECTION =========="
    );

    let databaseUser:
      | {
          id: string;
          username: string;
        }
      | null = null;

    let joinedBoardId: string | null = null;

    /* =====================================================
     * AUTH TOKEN
     * ===================================================== */

    const url = new URL(
      request.url || "",
      `http://${request.headers.host}`
    );

    const token = url.searchParams.get("token");

    if (!token) {
      console.error("WS ERROR: No token");

      socket.close(
        1008,
        "Authentication required"
      );

      return;
    }

    /* =====================================================
     * JWT AUTHENTICATION
     * ===================================================== */

    let userId: string;

    try {
      const decoded = jwt.verify(
        token,
        JWT_SECRET
      ) as {
        userId?: string;
      };

      if (!decoded.userId) {
        throw new Error(
          "JWT does not contain userId"
        );
      }

      userId = decoded.userId;

      console.log(
        "WS JWT USER:",
        userId
      );
    } catch (error) {
      console.error(
        "Invalid WebSocket token:",
        error
      );

      socket.close(
        1008,
        "Invalid token"
      );

      return;
    }

    /* =====================================================
     * GET USER
     * ===================================================== */

    try {
      databaseUser =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
            username: true,
          },
        });
    } catch (error) {
      console.error(
        "Error fetching WebSocket user:",
        error
      );

      socket.close(
        1011,
        "Internal server error"
      );

      return;
    }

    if (!databaseUser) {
      console.error(
        "WS ERROR: User not found"
      );

      socket.close(
        1008,
        "User not found"
      );

      return;
    }

    console.log(
      `WS AUTHENTICATED: ${databaseUser.username} (${databaseUser.id})`
    );

    /* =====================================================
     * AUTH SUCCESS
     * ===================================================== */

    send(socket, {
      type: "authenticated",
      userId: databaseUser.id,
    });

    /* =====================================================
     * MESSAGE HANDLER
     * ===================================================== */

    socket.on("message", async (rawData) => {
      try {
        let data: any;

        try {
          data = JSON.parse(
            rawData.toString()
          );
        } catch {
          send(socket, {
            type: "error",
            message: "Invalid JSON",
          });

          return;
        }

        /* =================================================
         * JOIN BOARD
         * ================================================= */

        if (data.type === "join") {
          const boardId = data.boardId;

          if (
            typeof boardId !== "string" ||
            !boardId
          ) {
            send(socket, {
              type: "error",
              message: "Board ID is required",
            });

            return;
          }

          /*
           * Already joined this exact board.
           */
          if (joinedBoardId === boardId) {
            console.log(
              `${databaseUser!.username} already joined ${boardId}`
            );

            return;
          }

          /*
           * If this socket was previously in another
           * board, remove it first.
           */
          if (joinedBoardId) {
            removeSocketFromRoom(
              joinedBoardId,
              socket
            );

            joinedBoardId = null;
          }

          /* ===============================================
           * FIND BOARD
           * =============================================== */

          const board =
            await prisma.board.findUnique({
              where: {
                id: boardId,
              },
            });

          if (!board) {
            send(socket, {
              type: "error",
              message: "Board not found",
            });

            return;
          }

          /* ===============================================
           * MEMBERSHIP
           * =============================================== */

          const membership =
            await prisma.membership.findFirst({
              where: {
                userId: databaseUser!.id,
                organizationId:
                  board.organizationId,
              },
            });

          if (!membership) {
            send(socket, {
              type: "error",
              message:
                "You are not a member of this organization",
            });

            return;
          }

          /* ===============================================
           * CREATE ROOM
           * =============================================== */

          if (!ROOMS[boardId]) {
            ROOMS[boardId] = [];
          }

          /*
           * Remove ANY stale connection for this same
           * user in this board.
           *
           * This is important.
           */
          const oldConnections =
            ROOMS[boardId].filter(
              (roomUser) =>
                roomUser.userId ===
                databaseUser!.id
            );

          for (const oldConnection of oldConnections) {
            if (
              oldConnection.socket !== socket
            ) {
              try {
                oldConnection.socket.close(
                  1000,
                  "Replaced by new connection"
                );
              } catch {
                // Ignore close errors.
              }
            }
          }

          ROOMS[boardId] =
            ROOMS[boardId].filter(
              (roomUser) =>
                roomUser.userId !==
                databaseUser!.id
            );

          /* ===============================================
           * GET EXISTING USERS
           * =============================================== */

          const existingUsers =
            ROOMS[boardId].map(
              (roomUser) => ({
                id: roomUser.userId,
                username:
                  roomUser.username,
                online: true,
              })
            );

          /* ===============================================
           * ADD CURRENT USER
           * =============================================== */

          const currentUser: RoomUser = {
            userId:
              databaseUser!.id,
            username:
              databaseUser!.username,
            socket,
          };

          ROOMS[boardId].push(
            currentUser
          );

          joinedBoardId = boardId;

          console.log(
            `USER ${databaseUser!.username} JOINED BOARD ${boardId}`
          );

          console.log(
            `ROOM ${boardId} USERS:`,
            ROOMS[boardId].map(
              (roomUser) => ({
                userId:
                  roomUser.userId,
                username:
                  roomUser.username,
                socketOpen:
                  roomUser.socket.readyState ===
                  WebSocket.OPEN,
              })
            )
          );

          /* ===============================================
           * SEND EXISTING USERS TO CURRENT USER
           * =============================================== */

          send(socket, {
            type: "initial_stage",
            users: existingUsers,
          });

          /* ===============================================
           * SEND CURRENT USER ID
           * =============================================== */

          send(socket, {
            type: "you",
            userId:
              databaseUser!.id,
          });

          /* ===============================================
           * TELL OTHER USERS
           * =============================================== */

          const joinedNotification = {
            type: "join",
            user: {
              id:
                databaseUser!.id,
              username:
                databaseUser!.username,
              online: true,
            },
          };

          for (const roomUser of ROOMS[
            boardId
          ]) {
            if (
              roomUser.socket !== socket
            ) {
              send(
                roomUser.socket,
                joinedNotification
              );
            }
          }

          return;
        }

        /* =================================================
         * CHAT MESSAGE
         * ================================================= */

        if (
          data.type === "chat_message"
        ) {
          const boardId =
            data.boardId;

          const content =
            data.content;

          /* ===============================================
           * VALIDATION
           * =============================================== */

          if (
            typeof boardId !==
              "string" ||
            !boardId
          ) {
            send(socket, {
              type: "error",
              message:
                "Board ID is required",
            });

            return;
          }

          if (
            typeof content !==
              "string" ||
            !content.trim()
          ) {
            send(socket, {
              type: "error",
              message:
                "Message cannot be empty",
            });

            return;
          }

          const trimmedContent =
            content.trim();

          if (
            trimmedContent.length >
            1000
          ) {
            send(socket, {
              type: "error",
              message:
                "Message cannot exceed 1000 characters",
            });

            return;
          }

          /* ===============================================
           * VERIFY SOCKET IS IN THIS BOARD
           * =============================================== */

          if (
            joinedBoardId !==
            boardId
          ) {
            send(socket, {
              type: "error",
              message:
                "You are not connected to this board",
            });

            return;
          }

          const room =
            ROOMS[boardId];

          if (!room) {
            send(socket, {
              type: "error",
              message:
                "Board room does not exist",
            });

            return;
          }

          const roomUser =
            room.find(
              (user) =>
                user.socket === socket
            );

          if (!roomUser) {
            send(socket, {
              type: "error",
              message:
                "You are not joined to this board",
            });

            return;
          }

          /* ===============================================
           * SAVE MESSAGE
           * =============================================== */

          const savedMessage =
            await prisma.chatMessage.create(
              {
                data: {
                  content:
                    trimmedContent,
                  userId:
                    databaseUser!.id,
                  boardId,
                },

                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              }
            );

          /* ===============================================
           * MESSAGE FOR CLIENTS
           * =============================================== */

          const chatMessage = {
            type: "chat_message",
            id: savedMessage.id,
            content:
              savedMessage.content,
            userId:
              savedMessage.userId,
            username:
              savedMessage.user.username,
            boardId:
              savedMessage.boardId,
            createdAt:
              savedMessage.createdAt.toISOString(),
          };

          console.log(
            "================================"
          );

          console.log(
            "WS BROADCAST CHAT MESSAGE"
          );

          console.log(
            "Board:",
            boardId
          );

          console.log(
            "Sender:",
            databaseUser!.username
          );

          console.log(
            "Message:",
            trimmedContent
          );

          console.log(
            "Recipients:",
            room.length
          );

          console.log(
            "Sockets:",
            room.map(
              (user) => ({
                username:
                  user.username,
                state:
                  user.socket.readyState,
              })
            )
          );

          console.log(
            "================================"
          );

          /* ===============================================
           * BROADCAST TO EVERYONE
           * =============================================== */

          broadcast(
            room,
            chatMessage
          );

          return;
        }

        /* =================================================
         * UNKNOWN MESSAGE
         * ================================================= */

        send(socket, {
          type: "error",
          message:
            "Unknown message type",
        });
      } catch (error) {
        console.error(
          "ERROR HANDLING WS MESSAGE:",
          error
        );

        send(socket, {
          type: "error",
          message:
            "Internal server error",
        });
      }
    });

    /* =====================================================
     * CLOSE
     * ===================================================== */

    socket.on("close", () => {
      console.log(
        `WS CLOSED: ${databaseUser!.username}`
      );

      if (joinedBoardId) {
        const boardId =
          joinedBoardId;

        const room =
          ROOMS[boardId];

        if (room) {
          const disconnectedUser =
            room.find(
              (roomUser) =>
                roomUser.socket ===
                socket
            );

          if (disconnectedUser) {
            ROOMS[boardId] =
              room.filter(
                (roomUser) =>
                  roomUser.socket !==
                  socket
              );

            console.log(
              `${disconnectedUser.username} left board ${boardId}`
            );

            /* =============================================
             * NOTIFY OTHER USERS
             * ============================================= */

            broadcast(
              ROOMS[boardId],
              {
                type: "leave",
                userId:
                  disconnectedUser.userId,
              }
            );

            /* =============================================
             * DELETE EMPTY ROOM
             * ============================================= */

            if (
              ROOMS[boardId].length ===
              0
            ) {
              delete ROOMS[boardId];

              console.log(
                `ROOM ${boardId} deleted`
              );
            }
          }
        }

        joinedBoardId = null;
      }
    });

    /* =====================================================
     * SOCKET ERROR
     * ===================================================== */

    socket.on("error", (error) => {
      console.error(
        `WebSocket error for ${databaseUser!.username}:`,
        error
      );
    });
  }
);

/* =========================================================
 * SERVER START
 * ========================================================= */

console.log(
  "WebSocket server running on ws://localhost:3002"
);