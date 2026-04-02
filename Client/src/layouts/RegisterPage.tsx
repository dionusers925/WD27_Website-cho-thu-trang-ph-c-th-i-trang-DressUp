import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import { message } from "antd";
import { registerApi } from "../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [errors, setErrors] = useState<any>({});

  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = async () => {
    const newErrors: any = {};

    // Email
    if (!form.email) {
      newErrors.email = "Email không được để trống";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Họ và tên
    if (!form.name) {
      newErrors.name = "Họ tên không được để trống";
    } else if (form.name.length < 3) {
      newErrors.name = "Họ tên phải ít nhất 3 ký tự";
    }

    // Số điện thoại
    if (!form.phone) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(form.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    // Mật khẩu
    if (!form.password) {
      newErrors.password = "Mật khẩu không được để trống";
    } else if (form.password.length < 6) {
      newErrors.password = "Mật khẩu phải ít nhất 6 ký tự";
    }

    // Nhập lại mật khẩu
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng nhập lại mật khẩu";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      await registerApi({
        email: form.email,
        name: form.name,
        phone: form.phone,
        password: form.password,
      });

      message.success("Đăng ký thành công");
      navigate("/auth/login");
    } catch (error: any) {
      const msg = error || "Đăng ký thất bại";

      // 👉 Gán lỗi đúng field
      if (msg.toLowerCase().includes("điện thoại")) {
        setErrors((prev: any) => ({ ...prev, phone: msg }));
      } else if (msg.toLowerCase().includes("email")) {
        setErrors((prev: any) => ({ ...prev, email: msg }));
      } else {
        setErrors((prev: any) => ({ ...prev, api: msg }));
      }

      message.error(msg);
    }
  };

  return (
    <div className="w-[500px] bg-[#d2ada0] rounded-2xl p-4 shadow-xl text-white relative">
      <Link
        to="/auth/login"
        className="absolute right-6 top-6 bg-white/30 px-4 py-1 rounded-full text-sm"
      >
        Quay lại Đăng nhập
      </Link>

      <div className="text-center mb-6">
        <h1 className="text-4xl font-serif">your</h1>
        <p className="tracking-[6px] text-sm">DRESS</p>
      </div>

      <h2 className="text-2xl font-semibold text-center">Tạo tài khoản</h2>

      <p className="text-center text-sm opacity-80 mb-6">
        Bắt đầu thuê thời trang ngay hôm nay
      </p>

      <div className="space-y-4">
        {/* EMAIL */}
        <div>
          <label className="text-sm">Email</label>
          <input
            placeholder="username@gmail.com"
            className="w-full p-3 rounded-lg text-black bg-white"
            onChange={(e) => {
              setForm({ ...form, email: e.target.value });
              setErrors((prev: any) => ({ ...prev, email: "" }));
            }}
          />
          {errors.email && (
            <p className="text-red-200 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* NAME */}
        <div>
          <label className="text-sm">Họ và tên</label>
          <input
            placeholder="Họ và tên"
            className="w-full p-3 rounded-lg text-black bg-white"
            onChange={(e) => {
              setForm({ ...form, name: e.target.value });
              setErrors((prev: any) => ({ ...prev, name: "" }));
            }}
          />
          {errors.name && (
            <p className="text-red-200 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* PHONE */}
        <div>
          <label className="text-sm">Số điện thoại</label>
          <input
            placeholder="Số điện thoại"
            className="w-full p-3 rounded-lg text-black bg-white"
            onChange={(e) => {
              setForm({ ...form, phone: e.target.value });
              setErrors((prev: any) => ({ ...prev, phone: "" }));
            }}
          />
          {errors.phone && (
            <p className="text-red-200 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div>
          <label className="text-sm">Mật khẩu</label>
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full p-3 rounded-lg text-black bg-white"
            onChange={(e) => {
              setForm({ ...form, password: e.target.value });
              setErrors((prev: any) => ({ ...prev, password: "" }));
            }}
          />
          {errors.password && (
            <p className="text-red-200 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="text-sm">Nhập lại mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="w-full p-3 rounded-lg text-black bg-white"
            onChange={(e) => {
              setForm({ ...form, confirmPassword: e.target.value });
              setErrors((prev: any) => ({
                ...prev,
                confirmPassword: "",
              }));
            }}
          />
          {errors.confirmPassword && (
            <p className="text-red-200 text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* API ERROR */}
        {errors.api && (
          <p className="text-red-200 text-sm text-center">{errors.api}</p>
        )}

        <button
          onClick={handleRegister}
          className="w-full py-3 bg-[#7d4b3b] rounded-lg hover:bg-[#6a3e30]"
        >
          Tạo tài khoản
        </button>

        <p className="text-center text-sm">
          Đã có tài khoản?{" "}
          <Link to="/auth/login" className="underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
