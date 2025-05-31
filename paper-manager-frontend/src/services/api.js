import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Token管理
let token = localStorage.getItem('token');

// 请求拦截器 - 添加认证头
api.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理认证错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除无效token
      localStorage.removeItem('token');
      token = null;
      // 可以在这里添加重定向到登录页面的逻辑
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 设置token的辅助函数
export const setAuthToken = (newToken) => {
  token = newToken;
  if (newToken) {
    localStorage.setItem('token', newToken);
  } else {
    localStorage.removeItem('token');
  }
};

// ==================== 用户认证 APIs ====================
// 用户登录
export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return (await api.post("/users/token", formData)).data;
};

// 用户注册
export const register = async (userData) =>
  (await api.post("/users/", userData)).data;

// 获取当前用户信息
export const getCurrentUser = async () =>
  (await api.get("/users/me")).data;

// 获取用户列表
export const getUsers = async (skip = 0, limit = 100) => {
  const params = { skip, limit };
  return (await api.get("/users/", { params })).data;
};

// 获取单个用户信息
export const getUser = async (userId) =>
  (await api.get(`/users/${userId}`)).data;

// 更新用户信息
export const updateUser = async (userId, userData) =>
  (await api.patch(`/users/${userId}`, userData)).data;

// ==================== 论文管理 APIs ====================
// 获取论文列表
export const getPapers = async (params = {}) => {
  return (await api.get("/papers/", { params })).data;
};

// 创建论文
export const createPaper = async (paperData) =>
  (await api.post("/papers/", paperData)).data;

// 获取单个论文
export const getPaper = async (paperId) =>
  (await api.get(`/papers/${paperId}`)).data;

// 更新论文
export const updatePaper = async (paperId, paperData) =>
  (await api.patch(`/papers/${paperId}`, paperData)).data;

// 删除论文
export const deletePaper = async (paperId) =>
  (await api.delete(`/papers/${paperId}`)).data;

// 上传论文文件（创建论文并上传文件）
export const uploadPaper = async (formData) => {
  return (await api.post("/papers/upload", formData)).data;
};

// 下载论文文件
export const downloadPaper = async (paperId) => {
  const response = await api.get(`/papers/${paperId}/download`, {
    responseType: "blob",
  });
  return response;
};

// 通过标题下载论文
export const downloadPaperByTitle = async (title) => {
  const response = await api.get("/papers/download/by-title", {
    params: { title },
    responseType: "blob",
  });
  return response;
};

// 计算论文工作量
export const getPaperWorkload = async (paperId) =>
  (await api.get(`/papers/${paperId}/workload`)).data;

// 计算作者工作量（通过ID）
export const getAuthorWorkload = async (authorId) =>
  (await api.get(`/papers/authors/${authorId}/workload`)).data;

// 计算作者工作量（通过名字）
export const getAuthorWorkloadByName = async (authorName) => {
  const params = { author_name: authorName };
  return (await api.get("/papers/authors/workload/by-name", { params })).data;
};

// 获取作者合作网络
export const getAuthorCollaborationNetwork = async (authorName) => {
  const params = { author_name: authorName };
  return (await api.get("/papers/authors/collaboration-network", { params })).data;
};

// ==================== 分类管理 APIs ====================
// 获取分类列表
export const getCategories = async (skip = 0, limit = 100) => {
  const params = { skip, limit };
  return (await api.get("/categories/", { params })).data;
};

// 获取分类树（兼容旧版本调用）
export const getCategoryTree = async () => {
  const categories = await getCategories();
  return { categories }; // 包装为兼容格式
};

// 创建分类
export const createCategory = async (categoryData) =>
  (await api.post("/categories/", categoryData)).data;

// 获取单个分类
export const getCategory = async (categoryId) =>
  (await api.get(`/categories/${categoryId}`)).data;

// ==================== 团队管理 APIs ====================
// 获取团队列表
export const getTeams = async () =>
  (await api.get("/teams/")).data;

// 创建团队
export const createTeam = async (teamData) =>
  (await api.post("/teams/", teamData)).data;

// 获取团队信息
export const getTeam = async (teamId) =>
  (await api.get(`/teams/${teamId}`)).data;

// 更新团队信息
export const updateTeam = async (teamId, teamData) =>
  (await api.patch(`/teams/${teamId}`, teamData)).data;

// 删除团队
export const deleteTeam = async (teamId) =>
  (await api.delete(`/teams/${teamId}`)).data;

// 添加团队成员
export const addTeamMember = async (teamId, username) =>
  (await api.post(`/teams/${teamId}/members/${username}`)).data;

// 获取团队成员列表
export const getTeamMembers = async (teamId) =>
  (await api.get(`/teams/${teamId}/members`)).data;

// 移除团队成员
export const removeTeamMember = async (teamId, userId) =>
  (await api.delete(`/teams/${teamId}/members/${userId}`)).data;

// 更新成员角色
export const updateMemberRole = async (teamId, userId, role) => {
  const params = { role };
  return (await api.patch(`/teams/${teamId}/members/${userId}/role`, null, { params })).data;
};

// ==================== 参考文献管理 APIs ====================
// 获取参考文献列表
export const getReferences = async (teamId, params = {}) => {
  const queryParams = { team_id: teamId, ...params };
  return (await api.get("/references/", { params: queryParams })).data;
};

// 创建参考文献
export const createReference = async (referenceData) =>
  (await api.post("/references/", referenceData)).data;

// 获取单个参考文献
export const getReference = async (referenceId) =>
  (await api.get(`/references/${referenceId}`)).data;

// 更新参考文献
export const updateReference = async (referenceId, referenceData) =>
  (await api.patch(`/references/${referenceId}`, referenceData)).data;

// 删除参考文献
export const deleteReference = async (referenceId) =>
  (await api.delete(`/references/${referenceId}`)).data;

// 上传参考文献文件
export const uploadReference = async (referenceId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return (await api.post(`/references/${referenceId}/upload`, formData)).data;
};

// 下载参考文献文件
export const downloadReference = async (referenceId) => {
  const response = await api.get(`/references/${referenceId}/download`, {
    responseType: "blob",
  });
  return response;
};

// 通过标题下载参考文献
export const downloadReferenceByTitle = async (title, teamId) => {
  const response = await api.get("/references/download/by-title", {
    params: { title, team_id: teamId },
    responseType: "blob",
  });
  return response;
};
