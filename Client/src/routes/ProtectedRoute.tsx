import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  role?: string;
}

const ProtectedRoute = ({ role }: ProtectedRouteProps) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Chưa đăng nhập
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // Không phải admin
  if (role && user.role !== role) {
    return <Navigate to="/auth/login" replace />;
  }

  // Đã login + role hợp lệ
  return <Outlet />;
};

export default ProtectedRoute;
