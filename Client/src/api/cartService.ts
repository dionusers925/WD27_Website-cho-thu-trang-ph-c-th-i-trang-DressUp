import axios from "axios";

export const getCart = async (userId?: string) => {
  const url = userId ? `http://localhost:3000/api/cart?userId=${userId}` : "http://localhost:3000/api/cart";
  const res = await axios.get(url);
  return res.data;
};

export const updateCartItem = async (itemId: string, quantity: number) => {
  return axios.put(`http://localhost:3000/api/cart/${itemId}`, {
    quantity,
  });
};

export const removeCartItem = async (itemId: string) => {
  return axios.delete(`http://localhost:3000/api/cart/${itemId}`);
};

export const clearCart = async (userId?: string) => {
  const url = userId ? `http://localhost:3000/api/cart?userId=${userId}` : "http://localhost:3000/api/cart";
  return axios.delete(url);
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity = 1,
  days = 1,
  deposit = 0,
  rentalPrice = 0,
  total = 0,
  size?: string,
  color?: string,
  startDate?: string,
  endDate?: string,
) => {
  const res = await axios.post("http://localhost:3000/api/cart", {
    userId,
    productId,
    quantity,
    days,
    deposit,
    rentalPrice,
    total,
    size,
    color,
    startDate,
    endDate,
  });
  console.log("📤 cartService gửi:", { userId, productId, startDate, endDate });
  console.log("📦 Back-end nhận:", { userId, productId, startDate, endDate, days });

  return res.data;
};