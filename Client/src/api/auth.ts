import axios from "axios";

const API = "http://localhost:3000/api/auth";

export const loginApi = (data: any) => {
  return axios.post(`${API}/login`, data);
};

export const registerApi = async (data: any) => {
  try {
    const res = await axios.post(`${API}/register`, data);
    return res.data;
  } catch (error: any) {
    const msg = error?.response?.data?.message || "Đăng ký thất bại";
    throw msg;
  }
};
