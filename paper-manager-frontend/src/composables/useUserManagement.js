import { ref, computed, reactive } from "vue";
import { getUsers, updateUser as apiUpdateUser } from "../services/api.js";
import { useToast } from "./useToast.js";
import { useConfirmDialog } from "./useConfirmDialog.js";

export function useUserManagement() {
  const { showToast } = useToast();
  const { showConfirmDialog } = useConfirmDialog();

  // 状态管理
  const users = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // 搜索和过滤
  const searchQuery = ref("");
  const statusFilter = ref("");
  const roleFilter = ref("");

  // 分页
  const currentPage = ref(1);
  const pageSize = ref(20);

  // 编辑模态框
  const showEditModal = ref(false);
  const editForm = reactive({
    id: null,
    username: "",
    email: "",
    full_name: "",
    is_active: true,
    is_superuser: false,
  });
  const editErrors = ref({});
  const isUpdating = ref(false);

  // 计算属性
  const filteredUsers = computed(() => {
    let filtered = users.value;

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          (user.email && user.email.toLowerCase().includes(query)) ||
          (user.full_name && user.full_name.toLowerCase().includes(query))
      );
    }

    // 状态过滤
    if (statusFilter.value) {
      filtered = filtered.filter((user) => {
        if (statusFilter.value === "active") {
          return user.is_active;
        } else if (statusFilter.value === "inactive") {
          return !user.is_active;
        }
        return true;
      });
    }

    // 角色过滤
    if (roleFilter.value) {
      filtered = filtered.filter((user) => {
        if (roleFilter.value === "admin") {
          return user.is_superuser;
        } else if (roleFilter.value === "user") {
          return !user.is_superuser;
        }
        return true;
      });
    }

    return filtered;
  });

  const totalUsers = computed(() => users.value.length);
  const activeUsers = computed(
    () => users.value.filter((user) => user.is_active).length
  );
  const adminUsers = computed(
    () => users.value.filter((user) => user.is_superuser).length
  );

  const totalPages = computed(() =>
    Math.ceil(filteredUsers.value.length / pageSize.value)
  );

  const paginatedUsers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredUsers.value.slice(start, end);
  });

  // 方法
  const loadUsers = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      // 获取所有用户，不分页
      const response = await getUsers(0, 1000);
      users.value = response.users || response || [];

      console.log("加载用户列表成功:", users.value.length, "个用户");
    } catch (err) {
      console.error("加载用户列表失败:", err);
      error.value =
        err.response?.data?.detail || err.message || "加载用户列表失败";
      showToast("加载用户列表失败", "error");
    } finally {
      isLoading.value = false;
    }
  };

  const handleSearch = () => {
    currentPage.value = 1; // 重置到第一页
  };

  const handleFilter = () => {
    currentPage.value = 1; // 重置到第一页
  };

  const clearSearch = () => {
    searchQuery.value = "";
    handleSearch();
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
    }
  };

  const editUser = (user) => {
    // 重置编辑表单
    editForm.id = user.id;
    editForm.username = user.username;
    editForm.email = user.email || "";
    editForm.full_name = user.full_name || "";
    editForm.is_active = user.is_active;
    editForm.is_superuser = user.is_superuser;

    editErrors.value = {};
    showEditModal.value = true;
  };

  const closeEditModal = () => {
    showEditModal.value = false;
    editErrors.value = {};
  };

  const validateEditForm = () => {
    const errors = {};

    // 邮箱验证
    if (editForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email)) {
        errors.email = "请输入有效的邮箱地址";
      }
    }

    // 姓名验证
    if (editForm.full_name && editForm.full_name.length > 100) {
      errors.full_name = "姓名长度不能超过100个字符";
    }

    editErrors.value = errors;
    return Object.keys(errors).length === 0;
  };

  const updateUser = async () => {
    if (!validateEditForm()) {
      return;
    }

    try {
      isUpdating.value = true;

      const updateData = {
        email: editForm.email || null,
        full_name: editForm.full_name || null,
        is_active: editForm.is_active,
        is_superuser: editForm.is_superuser,
      };

      await apiUpdateUser(editForm.id, updateData);

      // 更新本地用户列表
      const userIndex = users.value.findIndex((u) => u.id === editForm.id);
      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...updateData };
      }

      showToast("用户信息更新成功", "success");
      closeEditModal();
    } catch (err) {
      console.error("更新用户失败:", err);
      const errorMessage =
        err.response?.data?.detail || err.message || "更新用户失败";
      showToast(errorMessage, "error");

      // 如果是验证错误，显示详细错误信息
      if (err.response?.status === 422 && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const newErrors = {};
          detail.forEach((error) => {
            const field = error.loc?.[error.loc.length - 1];
            if (field) {
              newErrors[field] = error.msg;
            }
          });
          editErrors.value = newErrors;
        }
      }
    } finally {
      isUpdating.value = false;
    }
  };

  const toggleUserStatus = async (user) => {
    const action = user.is_active ? "禁用" : "启用";
    const confirmMessage = `确定要${action}用户 "${user.username}" 吗？`;

    const confirmed = await showConfirmDialog({
      title: `${action}用户`,
      message: confirmMessage,
      confirmText: action,
      cancelText: "取消",
      type: user.is_active ? "warning" : "primary",
    });

    if (!confirmed) {
      return;
    }

    try {
      const updateData = {
        is_active: !user.is_active,
      };

      await apiUpdateUser(user.id, updateData);

      // 更新本地用户列表
      const userIndex = users.value.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        users.value[userIndex].is_active = !user.is_active;
      }

      showToast(`用户已${action}`, "success");
    } catch (err) {
      console.error(`${action}用户失败:`, err);
      const errorMessage =
        err.response?.data?.detail || err.message || `${action}用户失败`;
      showToast(errorMessage, "error");
    }
  };

  return {
    // 状态
    users,
    filteredUsers: paginatedUsers, // 使用分页后的数据
    totalUsers,
    activeUsers,
    adminUsers,
    isLoading,
    error,

    // 搜索和过滤
    searchQuery,
    statusFilter,
    roleFilter,

    // 分页
    currentPage,
    totalPages,

    // 编辑模态框
    showEditModal,
    editForm,
    editErrors,
    isUpdating,

    // 方法
    loadUsers,
    handleSearch,
    handleFilter,
    clearSearch,
    goToPage,
    editUser,
    closeEditModal,
    updateUser,
    toggleUserStatus,
  };
}
