import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const API = `${API_BASE_URL}/api/products`;

export const getProducts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
}) => axios.get(API, { params });

export const getProduct = (id: string) =>
  axios.get(`${API}/${id}`);

export const getProductVariantHistory = (
  id: string,
  params?: {
    page?: number;
    limit?: number;
    sku?: string;
    action?: string;
  }
) => axios.get(`${API}/${id}/variant-history`, { params });

export const createProduct = (data: any) =>
  axios.post(API, data);

export const updateProduct = (id: string, data: any) =>
  axios.put(`${API}/${id}`, data);

export const deleteProduct = (id: string) =>
  axios.delete(`${API}/${id}`);
