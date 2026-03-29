import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { logout } from "../../utils/auth";

function Header() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await axios.get("http://localhost:3000/cart");

        const total = res.data.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0,
        );

        setCartCount(total);
      } catch (error) {
        console.log(error);
      }
    };

    loadCart();
  }, []);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-black shadow-lg px-6 py-5 md:px-16 flex justify-between items-center">
      {/* Logo */}
      <Link
        to="/"
        className="text-3xl font-serif italic tracking-tighter text-white"
      >
        DressUp.
      </Link>

      {/* Điều hướng */}
      <nav className="hidden md:flex gap-12 text-[10px] uppercase tracking-[0.3em] font-medium text-white">
        <a href="/" className="hover:opacity-50 transition-all">
          Trang chủ
        </a>
        <Link to="/catalog" className="hover:opacity-50 transition-all">
          sản phẩm
        </Link>
        <a href="/cart" className="hover:opacity-50 transition-all">
          Giỏ hàng
        </a>
        <a href="/policy" className="hover:opacity-50 transition-all">
          Hướng dẫn mua hàng
        </a>
      </nav>

      {/* Icons bên phải */}
      <div className="flex items-center gap-8 text-white">
        <button className="text-[10px] text-white uppercase tracking-widest hidden md:block border-b border-white pb-1 hover:text-gray-300 hover:border-gray-300 transition-all">
          Search
        </button>

        <Link to="/cart">
          <div className="relative cursor-pointer hover:scale-110 transition-transform">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>

            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </div>
        </Link>
        {token ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">Xin chào, {user.name}</span>

            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link
            to="/auth/login"
            className="text-[10px] uppercase tracking-widest border-b border-white pb-1 hover:text-gray-300 hover:border-gray-300 transition-all"
          >
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
