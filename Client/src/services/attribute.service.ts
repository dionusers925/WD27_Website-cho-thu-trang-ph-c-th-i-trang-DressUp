import axios from "axios";
import { Attribute } from "../types/attribute";

const API = "http://localhost:3000/attributes";

export const getAttributes = () => axios.get<Attribute[]>(API);

export const createAttribute = (data: Partial<Attribute>) =>
  axios.post(API, data);

export const updateAttribute = (id: string, data: Partial<Attribute>) =>
  axios.put(`${API}/${id}`, data);

export const deleteAttribute = (id: string) =>
  axios.delete(`${API}/${id}`);