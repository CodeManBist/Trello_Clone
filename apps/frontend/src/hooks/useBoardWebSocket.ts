import { useEffect, useState } from "react";

export type OnlineUser = {
  id: string;
  username: string;
  online: boolean;
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
      type: "leave";
      userId: string;
    }
  | {
      type: "error";
      message: string;
    };

const useBoardWebSocket = (boardId?: string) => {
  const [onlineUsers, setOnlineUsers] =
    useState<OnlineUser[]>([]);

  const [connected, setConnected] =
    useState(false);

  useEffect(() => {
    if (!boardId) {
      console.log("WS: no boardId");
      return;
    }

    const token =
      localStorage.getItem("token");

    if (!token) {
      console.error(
        "WS: no token found"
      );
      return;
    }

    console.log(
      "================================"
    );
    console.log(
      "WS: CONNECTING"
    );
    console.log(
      "WS: BOARD:",
      boardId
    );
    console.log(
      "================================"
    );

    const socket = new WebSocket(
      `ws://localhost:3002?token=${encodeURIComponent(
        token
      )}`
    );

    /*
     * WebSocket opened.
     *
     * IMPORTANT:
     * We DO NOT join the board here.
     *
     * We wait for the server to tell us
     * that authentication succeeded.
     */
    socket.onopen = () => {
      console.log(
        "WS: CONNECTION OPEN"
      );

      setConnected(true);
    };

    /*
     * Server messages
     */
    socket.onmessage = (event) => {
      console.log(
        "================================"
      );

      console.log(
        "WS: RECEIVED RAW:"
      );

      console.log(event.data);

      console.log(
        "================================"
      );

      let data: WebSocketMessage;

      try {
        data = JSON.parse(
          event.data
        );
      } catch (error) {
        console.error(
          "WS: JSON PARSE ERROR:",
          error
        );

        return;
      }

      console.log(
        "WS: PARSED MESSAGE:",
        data
      );

      /*
       * ================================
       * AUTHENTICATED
       * ================================
       */

      if (
        data.type ===
        "authenticated"
      ) {
        console.log(
          "WS: AUTHENTICATED"
        );

        console.log(
          "WS: USER ID:",
          data.userId
        );

        /*
         * NOW join the board.
         */
        const joinMessage = {
          type: "join",
          boardId,
        };

        console.log(
          "WS: SENDING JOIN:",
          joinMessage
        );

        if (
          socket.readyState ===
          WebSocket.OPEN
        ) {
          socket.send(
            JSON.stringify(
              joinMessage
            )
          );
        }

        return;
      }

      /*
       * ================================
       * YOU
       * ================================
       */

      if (data.type === "you") {
        console.log(
          "WS: THIS USER:",
          data.userId
        );

        return;
      }

      /*
       * ================================
       * INITIAL USERS
       * ================================
       */

      if (
        data.type ===
        "initial_stage"
      ) {
        console.log(
          "WS: INITIAL USERS:"
        );

        console.log(
          data.users
        );

        const users: OnlineUser[] =
          data.users.map(
            (user) => ({
              id: user.id,
              username:
                user.username,
              online: true,
            })
          );

        setOnlineUsers(users);

        console.log(
          "WS: ONLINE USERS STATE:",
          users
        );

        return;
      }

      /*
       * ================================
       * USER JOINED
       * ================================
       */

      if (data.type === "join") {
        console.log(
          "WS: USER JOINED:"
        );

        console.log(
          data.user
        );

        setOnlineUsers(
          (previousUsers) => {
            /*
             * Don't add duplicate users.
             */
            const alreadyExists =
              previousUsers.some(
                (user) =>
                  user.id ===
                  data.user.id
              );

            if (
              alreadyExists
            ) {
              console.log(
                "WS: USER ALREADY EXISTS:",
                data.user.id
              );

              return previousUsers;
            }

            const newUser: OnlineUser =
              {
                id: data.user.id,
                username:
                  data.user.username,
                online: true,
              };

            const updatedUsers = [
              ...previousUsers,
              newUser,
            ];

            console.log(
              "WS: UPDATED ONLINE USERS:",
              updatedUsers
            );

            return updatedUsers;
          }
        );

        return;
      }

      /*
       * ================================
       * USER LEFT
       * ================================
       */

      if (
        data.type === "leave"
      ) {
        console.log(
          "WS: USER LEFT:",
          data.userId
        );

        setOnlineUsers(
          (previousUsers) => {
            const updatedUsers =
              previousUsers.filter(
                (user) =>
                  user.id !==
                  data.userId
              );

            console.log(
              "WS: USERS AFTER LEAVE:",
              updatedUsers
            );

            return updatedUsers;
          }
        );

        return;
      }

      /*
       * ================================
       * ERROR
       * ================================
       */

      if (
        data.type === "error"
      ) {
        console.error(
          "WS SERVER ERROR:",
          data.message
        );

        return;
      }

      console.warn(
        "WS: UNKNOWN MESSAGE:",
        data
      );
    };

    /*
     * ================================
     * ERROR
     * ================================
     */

    socket.onerror = (error) => {
      console.error(
        "================================"
      );

      console.error(
        "WS ERROR:",
        error
      );

      console.error(
        "================================"
      );

      setConnected(false);
    };

    /*
     * ================================
     * CLOSED
     * ================================
     */

    socket.onclose = (event) => {
      console.log(
        "================================"
      );

      console.log(
        "WS CLOSED"
      );

      console.log(
        "CODE:",
        event.code
      );

      console.log(
        "REASON:",
        event.reason
      );

      console.log(
        "================================"
      );

      setConnected(false);
      setOnlineUsers([]);
    };

    /*
     * ================================
     * CLEANUP
     * ================================
     */

    return () => {
      console.log(
        "WS: CLEANUP"
      );

      socket.close();
    };
  }, [boardId]);

  return {
    onlineUsers,
    connected,
  };
};

export default useBoardWebSocket;