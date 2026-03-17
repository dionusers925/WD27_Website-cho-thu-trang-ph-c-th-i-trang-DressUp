import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = ({ role }: { role?: string }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ❌ chưa đăng nhập
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // ❌ không phải admin
  if (role && user.role !== role) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
