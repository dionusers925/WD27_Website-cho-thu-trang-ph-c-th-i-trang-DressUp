import { Outlet, Navigate } from "react-router-dom";

const ShipperProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // ❌ chưa đăng nhập
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  // ❌ không phải admin và shipper
  if (user.role !== "shipper" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // ✅ là shipper hoặc admin
  return <Outlet />;
};

export default ShipperProtectedRoute;
