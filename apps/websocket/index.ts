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

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const send = (
  socket: WebSocket,
  message: unknown
) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
};

const broadcast = (
  users: RoomUser[],
  message: unknown,
  exceptSocket?: WebSocket
) => {
  for (const roomUser of users) {
    if (roomUser.socket === exceptSocket) {
      continue;
    }

    send(roomUser.socket, message);
  }
};

/*
|--------------------------------------------------------------------------
| WebSocket Connection
|--------------------------------------------------------------------------
*/

server.on("connection", async (socket, request) => {
  console.log("========== WS CONNECTION ==========");

  /*
  |--------------------------------------------------------------------------
  | Get JWT from query string
  |--------------------------------------------------------------------------
  */

  const url = new URL(
    request.url || "",
    `http://${request.headers.host}`
  );

  const token = url.searchParams.get("token");

  if (!token) {
    console.log("WS ERROR: No token");

    socket.close(
      1008,
      "Authentication required"
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Authenticate JWT
  |--------------------------------------------------------------------------
  */

  let userId: string;

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as {
      userId: string;
    };

    if (!decoded.userId) {
      throw new Error("JWT does not contain userId");
    }

    userId = decoded.userId;

    console.log(
      "JWT USER ID:",
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

  /*
  |--------------------------------------------------------------------------
  | Get user from database
  |--------------------------------------------------------------------------
  */

  let databaseUser;

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

    console.log(
      "DATABASE USER:",
      databaseUser
    );
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
    console.log(
      "WS ERROR: User not found"
    );

    socket.close(
      1008,
      "User not found"
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | Tell frontend authentication succeeded
  |--------------------------------------------------------------------------
  */

  send(socket, {
    type: "authenticated",
    userId: databaseUser.id,
  });

  /*
  |--------------------------------------------------------------------------
  | Handle incoming messages
  |--------------------------------------------------------------------------
  */

  socket.on("message", async (data) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | Parse JSON
      |--------------------------------------------------------------------------
      */

      let parsedData: any;

      try {
        parsedData = JSON.parse(
          data.toString()
        );
      } catch {
        send(socket, {
          type: "error",
          message: "Invalid JSON",
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | JOIN BOARD
      |--------------------------------------------------------------------------
      */

      if (parsedData.type === "join") {
        const boardId = parsedData.boardId;

        if (!boardId) {
          send(socket, {
            type: "error",
            message: "Board ID is required",
          });

          return;
        }

        console.log(
          `USER ${databaseUser.username} JOINING BOARD ${boardId}`
        );

        /*
        |--------------------------------------------------------------------------
        | Check board
        |--------------------------------------------------------------------------
        */

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

        /*
        |--------------------------------------------------------------------------
        | Check organization membership
        |--------------------------------------------------------------------------
        */

        const membership =
          await prisma.membership.findFirst({
            where: {
              userId: databaseUser.id,
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

        /*
        |--------------------------------------------------------------------------
        | Prevent duplicate socket in same board
        |--------------------------------------------------------------------------
        */

        if (!ROOMS[boardId]) {
          ROOMS[boardId] = [];
        }

        const existingConnection =
          ROOMS[boardId].find(
            (roomUser) =>
              roomUser.socket === socket
          );

        if (existingConnection) {
          console.log(
            `${databaseUser.username} is already in board ${boardId}`
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Remove this user's old connection
        |
        | This prevents duplicate users if the same
        | browser reconnects without the old socket
        | being cleaned up yet.
        |--------------------------------------------------------------------------
        */

        ROOMS[boardId] =
          ROOMS[boardId].filter(
            (roomUser) =>
              roomUser.userId !==
                databaseUser.id ||
              roomUser.socket === socket
          );

        /*
        |--------------------------------------------------------------------------
        | Get existing users BEFORE adding current user
        |--------------------------------------------------------------------------
        */

        const existingUsers =
          ROOMS[boardId].map(
            (roomUser) => ({
              id: roomUser.userId,
              username:
                roomUser.username,
              online: true,
            })
          );

        console.log(
          "EXISTING USERS:",
          existingUsers
        );

        /*
        |--------------------------------------------------------------------------
        | Add current user to room
        |--------------------------------------------------------------------------
        */

        const currentUser: RoomUser = {
          userId: databaseUser.id,
          username:
            databaseUser.username,
          socket,
        };

        ROOMS[boardId].push(
          currentUser
        );

        console.log(
          `ROOM ${boardId}:`,
          ROOMS[boardId].map(
            (user) => ({
              id: user.userId,
              username: user.username,
            })
          )
        );

        /*
        |--------------------------------------------------------------------------
        | Send existing users to current user
        |--------------------------------------------------------------------------
        */

        send(socket, {
          type: "initial_stage",
          users: existingUsers,
        });

        /*
        |--------------------------------------------------------------------------
        | Tell current user who they are
        |--------------------------------------------------------------------------
        */

        send(socket, {
          type: "you",
          userId: databaseUser.id,
        });

        /*
        |--------------------------------------------------------------------------
        | Tell OTHER users that current user joined
        |--------------------------------------------------------------------------
        */

        broadcast(
          ROOMS[boardId],
          {
            type: "join",
            user: {
              id: databaseUser.id,
              username:
                databaseUser.username,
              online: true,
            },
          },
          socket
        );

        console.log(
          `${databaseUser.username} joined board ${boardId}`
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Unknown message
      |--------------------------------------------------------------------------
      */

      send(socket, {
        type: "error",
        message: "Unknown message type",
      });
    } catch (error) {
      console.error(
        "Error handling WebSocket message:",
        error
      );

      send(socket, {
        type: "error",
        message: "Internal server error",
      });
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Handle disconnect
  |--------------------------------------------------------------------------
  */

  socket.on("close", () => {
    console.log(
      `WS CLOSED: ${databaseUser.username}`
    );

    /*
    |--------------------------------------------------------------------------
    | Find every room this socket belongs to
    |--------------------------------------------------------------------------
    */

    for (const [
      boardId,
      users,
    ] of Object.entries(ROOMS)) {
      const disconnectedUser =
        users.find(
          (roomUser) =>
            roomUser.socket === socket
        );

      if (!disconnectedUser) {
        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | Remove user
      |--------------------------------------------------------------------------
      */

      ROOMS[boardId] =
        users.filter(
          (roomUser) =>
            roomUser.socket !== socket
        );

      console.log(
        `${disconnectedUser.username} left board ${boardId}`
      );

      /*
      |--------------------------------------------------------------------------
      | Tell remaining users
      |--------------------------------------------------------------------------
      */

      broadcast(
        ROOMS[boardId],
        {
          type: "leave",
          userId:
            disconnectedUser.userId,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Delete empty room
      |--------------------------------------------------------------------------
      */

      if (
        ROOMS[boardId].length === 0
      ) {
        delete ROOMS[boardId];

        console.log(
          `ROOM ${boardId} deleted`
        );
      }
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Handle WebSocket errors
  |--------------------------------------------------------------------------
  */

  socket.on("error", (error) => {
    console.error(
      `WebSocket error for ${databaseUser.username}:`,
      error
    );
  });
});

/*
|--------------------------------------------------------------------------
| Server started
|--------------------------------------------------------------------------
*/

console.log(
  "WebSocket server running on ws://localhost:3002"
);