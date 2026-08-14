import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "db/client";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const server = new WebSocketServer({ port: 3002 });

const ROOMS: any = {};

server.on("connection", (socket, request) => {
  // Get token from query string
  const url = new URL(
    request.url || "",
    `http://${request.headers.host}`
  );

  const token = url.searchParams.get("token");

  if (!token) {
    socket.close(1008, "Authentication required");
    return;
  }

  let userId: string;

  // Authenticate WebSocket connection
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
    };

    userId = decoded.userId;

    console.log("WebSocket user:", userId);

    socket.send(
      JSON.stringify({
        type: "authenticated",
        userId,
      })
    );
  } catch (error) {
    console.log("Invalid WebSocket token");

    socket.close(1008, "Invalid token");
    return;
  }

  // Handle messages
  socket.on("message", async (data) => {
    try {
      let parsedData;

      // Parse JSON
      try {
        parsedData = JSON.parse(data.toString());
      } catch {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Invalid JSON",
          })
        );

        return;
      }

      // Join board room
      if (parsedData.type === "join") {
        const boardId = parsedData.boardId;

        if (!boardId) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Board ID is required",
            })
          );

          return;
        }

        // Check if board exists
        const board = await prisma.board.findUnique({
          where: {
            id: boardId,
          },
        });

        if (!board) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "Board not found",
            })
          );

          return;
        }

        // Check if user belongs to the organization
        const membership = await prisma.membership.findFirst({
          where: {
            userId,
            organizationId: board.organizationId,
          },
        });

        if (!membership) {
          socket.send(
            JSON.stringify({
              type: "error",
              message: "You are not a member of this organization",
            })
          );

          return;
        }

        // Create room if it doesn't exist
        if (!ROOMS[boardId]) {
          ROOMS[boardId] = [];
        }

        // Tell existing users that someone joined
        for (let i = 0; i < ROOMS[boardId].length; i++) {
          const user = ROOMS[boardId][i];

          user.socket.send(
            JSON.stringify({
              type: "join",
              userId,
            })
          );
        }

        // Add current user to room
        ROOMS[boardId].push({
          userId,
          socket,
        });

        // Send existing users to the new user
        socket.send(
          JSON.stringify({
            type: "initial_stage",
            users: ROOMS[boardId]
              .filter((x) => x.userId !== userId)
              .map((u) => ({
                id: u.userId,
              })),
          })
        );

        // Tell user their own ID
        socket.send(
          JSON.stringify({
            type: "you",
            userId,
          })
        );
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);

      socket.send(
        JSON.stringify({
          type: "error",
          message: "Internal server error",
        })
      );
    }
  });

  // Handle disconnect
  socket.on("close", () => {
    Object.entries(ROOMS).forEach(([roomId, users]: [string, any[]]) => {
      const userExists = users.find(
        (user) => user.socket === socket
      );

      if (userExists) {
        // Remove user from room
        ROOMS[roomId] = users.filter(
          (user) => user.socket !== socket
        );

        // Notify remaining users
        ROOMS[roomId].forEach(({ socket }) => {
          socket.send(
            JSON.stringify({
              type: "leave",
              userId: userExists.userId,
            })
          );
        });

        // Remove empty room
        if (ROOMS[roomId].length === 0) {
          delete ROOMS[roomId];
        }
      }
    });
  });
});