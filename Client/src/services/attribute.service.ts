import axios from "axios";
import { type Attribute } from "../types/attribute";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const API = `${API_BASE_URL}/attributes`;

export const getAttributes = () => axios.get<Attribute[]>(API);

export const createAttribute = (data: Partial<Attribute>) =>
  axios.post(API, data);

export const updateAttribute = (id: string, data: Partial<Attribute>) =>
  axios.put(`${API}/${id}`, data);

export const deleteAttribute = (id: string) => axios.delete(`${API}/${id}`);
