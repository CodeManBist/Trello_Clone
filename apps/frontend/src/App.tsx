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
import Organizations from "./pages/Organizations";
import Invitations from "./pages/Invitations";

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
          <Route
              path="/invitations"
              element={<Invitations />}
            />

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
                path="/organizations"
                element={<Organizations />}
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