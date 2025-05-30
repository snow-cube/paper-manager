import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Paper APIs
export const getPapers = async (categoryId = null) => {
  const params = categoryId ? { category_id: categoryId } : {};
  return (await api.get("/paper", { params })).data;
};

export const uploadPaper = async (formData) =>
  (await api.post("/paper/upload", formData)).data;

export const updatePaper = async (id, data) =>
  (await api.put(`/paper/${id}`, data)).data;

export const deletePaper = async (id) =>
  (await api.delete(`/paper/${id}`)).data;

// Download paper file
export const downloadPaper = async (id) => {
  const response = await api.get(`/paper/${id}/download`, {
    responseType: 'blob'
  });
  return response;
};

// Get papers by type (literature or published)
export const getPapersByType = async (paperType, categoryId = null) => {
  const params = { paper_type: paperType };
  if (categoryId) {
    params.category_id = categoryId;
  }
  return (await api.get("/paper", { params })).data;
};

// Create paper with type
export const createPaper = async (data) =>
  (await api.post("/paper", data)).data;

// Category APIs (Tree structure)
export const getCategories = async () => (await api.get("/category")).data;

export const createCategory = async (data) =>
  (await api.post("/category", data)).data;

export const updateCategory = async (id, data) =>
  (await api.put(`/category/${id}`, data)).data;

export const deleteCategory = async (id) =>
  (await api.delete(`/category/${id}`)).data;

export const getCategoryTree = async () =>
  (await api.get("/category/tree")).data;

// User APIs
export const getUsers = async () => (await api.get("/user")).data;
