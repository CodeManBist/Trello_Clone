// import { useRef, useState } from "react";

// function App() {
//   const socketRef = useRef<WebSocket | null>(null);

//   const [token, setToken] = useState("");
//   const [boardId, setBoardId] = useState("");
//   const [status, setStatus] = useState("Disconnected");
//   const [userId, setUserId] = useState("");
//   const [users, setUsers] = useState<string[]>([]);
//   const [events, setEvents] = useState<string[]>([]);

//   const addEvent = (message: string) => {
//     setEvents((prev) => [...prev, message]);
//   };

//   const connect = () => {
//     if (!token) {
//       addEvent("Token is required");
//       return;
//     }

//     const socket = new WebSocket(
//       `ws://localhost:3002?token=${token}`
//     );

//     socketRef.current = socket;

//     socket.onopen = () => {
//       setStatus("Connected");
//       addEvent("WebSocket connected");
//     };

//     socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);

//       console.log("Received:", data);

//       if (data.type === "authenticated") {
//         setUserId(data.userId);
//         addEvent(`Authenticated: ${data.userId}`);
//       }

//       if (data.type === "you") {
//         setUserId(data.userId);
//         addEvent(`Your user ID: ${data.userId}`);
//       }

//       if (data.type === "initial_stage") {
//         setUsers(data.users.map((user: { id: string }) => user.id));
//         addEvent("Received initial users");
//       }

//       if (data.type === "join") {
//         setUsers((prev) => [...prev, data.userId]);
//         addEvent(`User joined: ${data.userId}`);
//       }

//       if (data.type === "leave") {
//         setUsers((prev) =>
//           prev.filter((id) => id !== data.userId)
//         );
//         addEvent(`User left: ${data.userId}`);
//       }

//       if (data.type === "error") {
//         addEvent(`Error: ${data.message}`);
//       }
//     };

//     socket.onclose = () => {
//       setStatus("Disconnected");
//       addEvent("WebSocket disconnected");
//     };

//     socket.onerror = () => {
//       addEvent("WebSocket error");
//     };
//   };

//   const joinBoard = () => {
//     if (!socketRef.current) {
//       addEvent("Connect to WebSocket first");
//       return;
//     }

//     if (!boardId) {
//       addEvent("Board ID is required");
//       return;
//     }

//     socketRef.current.send(
//       JSON.stringify({
//         type: "join",
//         boardId,
//       })
//     );

//     addEvent(`Joining board: ${boardId}`);
//   };

//   return (
//     <div
//       style={{
//         maxWidth: "700px",
//         margin: "40px auto",
//         padding: "20px",
//         fontFamily: "Arial",
//       }}
//     >
//       <h1 className="text-5xl underline text-red-500">WebSocket Test</h1>

//       <div>
//         <label>JWT Token</label>

//         <input
//           type="text"
//           value={token}
//           onChange={(e) => setToken(e.target.value)}
//           placeholder="Paste JWT token"
//           style={{
//             width: "100%",
//             padding: "10px",
//             margin: "8px 0 20px",
//           }}
//         />
//       </div>

//       <div>
//         <label>Board ID</label>

//         <input
//           type="text"
//           value={boardId}
//           onChange={(e) => setBoardId(e.target.value)}
//           placeholder="Enter board ID"
//           style={{
//             width: "100%",
//             padding: "10px",
//             margin: "8px 0 20px",
//           }}
//         />
//       </div>

//       <button onClick={connect}>
//         Connect
//       </button>

//       <button
//         onClick={joinBoard}
//         style={{ marginLeft: "10px" }}
//       >
//         Join Board
//       </button>

//       <hr />

//       <h3>Status</h3>
//       <p>{status}</p>

//       <h3>Current User</h3>
//       <p>{userId || "Not authenticated"}</p>

//       <h3>Users in Board</h3>

//       {users.length === 0 ? (
//         <p>No other users</p>
//       ) : (
//         <ul>
//           {users.map((id) => (
//             <li key={id}>{id}</li>
//           ))}
//         </ul>
//       )}

//       <h3>Events</h3>

//       <div
//         style={{
//           border: "1px solid #ccc",
//           padding: "10px",
//           minHeight: "150px",
//         }}
//       >
//         {events.length === 0 ? (
//           <p>No events yet</p>
//         ) : (
//           events.map((event, index) => (
//             <div key={index}>{event}</div>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/context/AuthContext";

import { Auth } from "@/pages/Auth";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Board from "@/pages/Board";
import Issue from "@/pages/Issue";
import CreateOrganization from "@/pages/CreateOrganization";

import { PublicRoute } from "@/components/auth/PublicRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import OrganizationRequiredRoute from "@/components/auth/OrganizationRequiredRoute";

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =========================
              Public
          ========================= */}

          <Route
            path="/"
            element={<LandingPage />}
          />

          <Route element={<PublicRoute />}>
            <Route
              path="/signin"
              element={<Auth mode="signin" />}
            />

            <Route
              path="/signup"
              element={<Auth mode="signup" />}
            />
          </Route>


          {/* =========================
              Authenticated
          ========================= */}

          <Route element={<ProtectedRoute />}>

            {/* User is authenticated,
                organization is NOT required */}
            <Route
              path="/create-organization"
              element={<CreateOrganization />}
            />

            {/* User is authenticated AND
                must have an organization */}
            <Route element={<OrganizationRequiredRoute />}>

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />

              <Route
                path="/boards/:boardId"
                element={<Board />}
              />

              <Route
                path="/issues/:issueId"
                element={<Issue />}
              />

            </Route>

          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;