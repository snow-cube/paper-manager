import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

export const getPapers = async () => (await api.get("/paper")).data;
export const getUsers = async () => (await api.get("/user")).data;
export const getCategories = async () => (await api.get("/category")).data;
export const createPaper = async (paper) =>
  (await api.post("/paper", paper)).data;
