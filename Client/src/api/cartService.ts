import axios from "axios";

export const getCart = async () => {
  const res = await axios.get("http://localhost:3000/api/cart");
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

export const clearCart = async () => {
  return axios.delete(`http://localhost:3000/api/cart`);
};

export const addToCart = async (productId: string, quantity = 1, days = 1) => {
  const res = await axios.post("http://localhost:3000/api/cart", {
    productId,
    quantity,
    days,
  });

  return res.data;
};
