import axios from "axios";
import { type ICategory } from "../types/category";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const API = `${API_BASE_URL}/categories`;

export const getCategories = () => axios.get<ICategory[]>(API);
