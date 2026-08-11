import { useEffect, useState } from "react";
import { APITester } from "./APITester";
import "./index.css";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import { Route, Routes, BrowserRouter, useParams } from "react-router";

export function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/board/:boardId" element={<Board />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function Board() {
  const { boardId } = useParams();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3002/board/${boardId}`);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);

      if(data.type === "initial_stage") {
        setUsers(data.users);
      }

      if(data.type === "join") {
        setUsers(u => [...u, { id: data.userId }]);
      }

      if(data.type === "leave") {
        setUsers(u => u.filter(x => x.id !== data.userId));
      }

      if (data.type === "you") {
        console.log("My userId is", data.userId);
      }
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join",
        boardId: boardId
      }))
    }

    return () => {
      ws.close();
    };
  }, [boardId]);

  return <div>
    You are on board { boardId } 

    Currently active users - { JSON.stringify(users) }
  </div>
}

export default App;
