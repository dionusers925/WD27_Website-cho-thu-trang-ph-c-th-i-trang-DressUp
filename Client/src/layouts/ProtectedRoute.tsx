import { Outlet, Navigate } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ❌ chưa đăng nhập
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // ❌ không phải admin
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ là admin
  return <Outlet />;
};

export default ProtectedRoute;
