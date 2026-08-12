import { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 3002 });

const ROOMS: any = {
    
}

server.on("connection", (socket) => {
    socket.on("message", (data) => {
        let parsedData;
        try {
            parsedData = JSON.parse(data);
        } catch {
            return;
        }

        if(parsedData.type == "join") {
            const boardId = parsedData.boardId;

            if(!ROOMS[boardId]) {
                ROOMS[boardId] = [];
            }

            const newUserId = Math.random();

            for(let i = 0; i < ROOMS[boardId].length; i++) {
                const user = ROOMS[boardId][i];
                user.socket.send(JSON.stringify({
                    type: "join",
                    userId: newUserId
                }))
            }

            ROOMS[boardId].push({ userId: newUserId, socket: socket });

            socket.send(JSON.stringify({
                type: "initial_stage",
                users: ROOMS[boardId].filter(x => x.userId != newUserId).map(u => ({ id: u.userId }))
            }));

            socket.send(JSON.stringify({ type: "you", userId: newUserId }));
        }
    })

    socket.on("close", () => {
        Object.entries(ROOMS).forEach(([roomId, users]) => {
            const userExists = users.find(u => u.socket === socket);

            if(userExists) {
                users = users.filter(u => u.socket != socket); 
                ROOMS[roomId] = ROOMS[roomId].filter(u => u.socket != socket);
                users.forEach(({ socket }) => {
                    socket.send(JSON.stringify({
                        type: "leave",
                        userId: userExists.userId
                    }))
                }) 
            }
        })
    })
})
