import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8d6ce] relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-white/20 rounded-full -left-40 bottom-0 blur-3xl"></div>
      <div className="absolute w-[600px] h-[600px] bg-white/20 rounded-full -right-40 top-0 blur-3xl"></div>

      <Outlet />
    </div>
  );
}
