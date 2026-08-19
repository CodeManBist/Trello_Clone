import { Navigate, Outlet } from "react-router-dom";

export function PublicRoute() {
  const token = localStorage.getItem("token");

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}