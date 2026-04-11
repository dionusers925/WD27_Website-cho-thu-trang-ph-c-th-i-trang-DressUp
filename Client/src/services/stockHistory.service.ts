import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const getStockHistory = (params?: {
  page?: number;
  limit?: number;
  sku?: string;
  action?: string;
  productId?: string;
  from?: string;
  to?: string;
}) => axios.get(`${API_BASE_URL}/api/stock-history`, { params });

export const adjustStock = (data: {
  variantId: string;
  change: number;
  note?: string;
}) => axios.post(`${API_BASE_URL}/api/stock-adjust`, data);

export const processReturn = (data: {
  historyId: string;
  decision: "restock" | "discard";
  reason?: string;
}) => axios.post(`${API_BASE_URL}/api/stock-return`, data);
