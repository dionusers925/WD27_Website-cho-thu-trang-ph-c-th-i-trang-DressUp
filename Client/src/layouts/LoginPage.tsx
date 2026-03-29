import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { loginApi } from "../api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<any>({});

  const navigate = useNavigate();

  const handleLogin = async () => {
    const newErrors: any = {};

    if (!email) {
      newErrors.email = "Email không được để trống";
    }

    if (!password) {
      newErrors.password = "Mật khẩu không được để trống";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await loginApi({
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      setErrors({
        api: "Email hoặc mật khẩu không đúng",
      });
    }
  };

  return (
    <div className="w-[1100px] h-[650px] bg-[#c48f7d] rounded-[30px] flex items-center justify-center shadow-2xl relative">
      <div className="absolute left-24 flex flex-col gap-6">
        <div className="w-20 h-6 bg-white/60 rounded-full rotate-45"></div>
        <div className="w-20 h-6 bg-white/60 rounded-full rotate-45"></div>
        <div className="w-20 h-6 bg-white/60 rounded-full rotate-45"></div>
      </div>

      <div className="w-[420px] bg-[#d2ada0] rounded-2xl p-4 shadow-xl text-white">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-serif">your</h1>
          <p className="tracking-[6px] text-sm">DRESS</p>
        </div>

        <h2 className="text-2xl font-semibold text-center">
          Chào mừng trở lại
        </h2>

        <p className="text-center text-sm opacity-80 mb-6">
          Đăng nhập vào tài khoản của bạn
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              placeholder="username@gmail.com"
              className="w-full mt-1 p-3 rounded-lg text-black bg-white"
              onChange={(e) => setEmail(e.target.value)}
            />

            {errors.email && (
              <p className="text-red-200 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="text-sm">Mật khẩu</label>
            <input
              type="password"
              placeholder="Mật khẩu"
              className="w-full mt-1 p-3 rounded-lg text-black bg-white"
              onChange={(e) => setPassword(e.target.value)}
            />

            {errors.password && (
              <p className="text-red-200 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <p className="text-xs cursor-pointer hover:underline">
            Quên mật khẩu?
          </p>

          {errors.api && (
            <p className="text-red-300 text-sm text-center">{errors.api}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full py-3 bg-[#8b5a4a] rounded-lg hover:bg-[#75473a]"
          >
            Đăng nhập
          </button>

          <div className="flex items-center gap-3 text-xs my-2">
            <div className="flex-1 h-[1px] bg-white/30"></div>
            hoặc tiếp tục với
            <div className="flex-1 h-[1px] bg-white/30"></div>
          </div>

          {/* <div className="flex justify-center gap-4">
          <button className="bg-white text-black px-5 py-2 rounded-lg">
            Google
          </button>

          <button className="bg-white text-black px-5 py-2 rounded-lg">
            Github
          </button>

          <button className="bg-white text-black px-5 py-2 rounded-lg">
            Facebook
          </button>
        </div> */}

          <p className="text-center text-sm mt-4">
            Chưa có tài khoản?{" "}
            <Link to="/auth/register" className="underline">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
