<template>
  <StandardPageLayout title="用户管理" subtitle="管理系统中的所有用户账户">
    <div class="user-management-page">
      <!-- 顶部操作栏 -->
      <div class="actions-bar">
        <div class="search-section">
          <div class="search-input-wrapper">
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="currentColor"
              class="search-icon"
            >
              <path
                d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
              />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索用户名或邮箱..."
              class="search-input"
              @input="handleSearch"
            />
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="clear-search-btn"
              title="清除搜索"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="filter-section">
          <select
            v-model="statusFilter"
            class="filter-select"
            @change="handleFilter"
          >
            <option value="">所有状态</option>
            <option value="active">活跃用户</option>
            <option value="inactive">已禁用</option>
          </select>

          <select
            v-model="roleFilter"
            class="filter-select"
            @change="handleFilter"
          >
            <option value="">所有角色</option>
            <option value="admin">管理员</option>
            <option value="user">普通用户</option>
          </select>
        </div>
      </div>

      <!-- 用户统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon active">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
              />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ activeUsers }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon admin">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="m8 0 6.61 3h.89a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H15v7a.5.5 0 0 1-.5.5H1.5a.5.5 0 0 1-.5-.5V6H.5a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 .5 3h.89L8 0ZM3.777 3h8.447L8 1.207 3.777 3ZM2 6v7h1V6H2Z"
              />
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ adminUsers }}</div>
            <div class="stat-label">管理员</div>
          </div>
        </div>
      </div>

      <!-- 用户列表 -->
      <div class="users-table-container">
        <div v-if="isLoading" class="loading-state">
          <LoadingSpinner />
          <p>正在加载用户数据...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
              />
              <path
                d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"
              />
            </svg>
          </div>
          <h3>加载失败</h3>
          <p>{{ error }}</p>
          <button @click="loadUsers" class="btn btn-primary">重试</button>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              />
            </svg>
          </div>
          <h3>暂无用户</h3>
          <p>
            {{
              searchQuery || statusFilter || roleFilter
                ? "没有找到符合条件的用户"
                : "系统中还没有用户"
            }}
          </p>
        </div>

        <div v-else class="users-table">
          <table>
            <thead>
              <tr>
                <th>用户信息</th>
                <th>角色</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>最后更新</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="user-row">
                <td class="user-info-cell">
                  <div class="user-info">
                    <div class="user-avatar">
                      <img
                        v-if="user.avatar"
                        :src="user.avatar"
                        :alt="user.username"
                        class="avatar-image"
                      />
                      <div v-else class="avatar-placeholder">
                        {{ getUserInitials(user) }}
                      </div>
                    </div>
                    <div class="user-details">
                      <div class="user-name">
                        {{ user.full_name || user.username }}
                      </div>
                      <div class="user-meta">
                        <span class="username">@{{ user.username }}</span>
                        <span class="email">{{
                          user.email || "未设置邮箱"
                        }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    class="role-badge"
                    :class="{ admin: user.is_superuser }"
                  >
                    {{ user.is_superuser ? "管理员" : "普通用户" }}
                  </span>
                </td>
                <td>
                  <span
                    class="status-badge"
                    :class="{ active: user.is_active }"
                  >
                    {{ user.is_active ? "活跃" : "已禁用" }}
                  </span>
                </td>
                <td class="date-cell">
                  {{ formatDate(user.created_at) }}
                </td>
                <td class="date-cell">
                  {{ formatDate(user.updated_at) }}
                </td>
                <td class="actions-cell">
                  <div class="action-buttons">
                    <button
                      @click="editUser(user)"
                      class="action-btn edit-btn"
                      title="编辑用户"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path
                          d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
                        />
                      </svg>
                    </button>
                    <button
                      @click="changePassword(user)"
                      class="action-btn password-btn"
                      title="修改密码"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path
                          d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
                        />
                      </svg>
                    </button>
                    <button
                      v-if="user.id !== currentUser?.id"
                      @click="toggleUserStatus(user)"
                      class="action-btn"
                      :class="user.is_active ? 'disable-btn' : 'enable-btn'"
                      :title="user.is_active ? '禁用用户' : '启用用户'"
                    >
                      <svg
                        v-if="user.is_active"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path
                          d="M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"
                        />
                      </svg>
                      <svg
                        v-else
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path
                          d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"
            />
          </svg>
          上一页
        </button>

        <div class="pagination-info">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </div>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          下一页
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path
              fill-rule="evenodd"
              d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"
            />
          </svg>
        </button>
      </div>
    </div>
    <!-- 编辑用户模态框 -->
    <Modal v-if="showEditModal" @close="closeEditModal" size="medium">
      <div class="edit-user-modal">
        <div class="modal-header">
          <h3 class="modal-title">编辑用户信息</h3>
          <p class="modal-subtitle">修改用户的基本信息和权限设置</p>
        </div>

        <form @submit.prevent="handleUpdateUser" class="edit-user-form">
          <div class="form-group">
            <label for="edit-email" class="form-label">邮箱地址</label>
            <input
              id="edit-email"
              v-model="editForm.email"
              type="email"
              class="form-input"
              :class="{ error: editErrors.email }"
              placeholder="请输入邮箱地址"
            />
            <div v-if="editErrors.email" class="error-message">
              {{ editErrors.email }}
            </div>
          </div>

          <div class="form-group">
            <label for="edit-full-name" class="form-label">姓名</label>
            <input
              id="edit-full-name"
              v-model="editForm.full_name"
              type="text"
              class="form-input"
              :class="{ error: editErrors.full_name }"
              placeholder="请输入姓名"
            />
            <div v-if="editErrors.full_name" class="error-message">
              {{ editErrors.full_name }}
            </div>
          </div>

          <div class="form-group">
            <label for="edit-username" class="form-label">用户名</label>
            <input
              id="edit-username"
              :value="editForm.username"
              type="text"
              class="form-input readonly"
              readonly
              disabled
            />
            <div class="form-help">用户名无法修改</div>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="editForm.is_active"
                  type="checkbox"
                  class="checkbox-input"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">用户状态：活跃</span>
              </label>
            </div>
          </div>

          <div class="form-group" v-if="currentUser?.is_superuser">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="editForm.is_superuser"
                  type="checkbox"
                  class="checkbox-input"
                  :disabled="editForm.id === currentUser?.id"
                />
                <span class="checkbox-custom"></span>
                <span class="checkbox-text">管理员权限</span>
              </label>
              <div v-if="editForm.id === currentUser?.id" class="form-help">
                不能修改自己的管理员权限
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="closeEditModal"
              class="btn btn-secondary"
              :disabled="isUpdating"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isUpdating"
              :class="{ loading: isUpdating }"
            >
              <LoadingSpinner v-if="isUpdating" size="small" />
              保存更改
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- 修改密码模态框 -->
    <Modal v-if="showPasswordModal" @close="closePasswordModal" size="medium">
      <div class="password-modal">
        <div class="modal-header">
          <h3 class="modal-title">修改密码</h3>
          <p class="modal-subtitle">
            为用户 {{ passwordForm.username }} 设置新密码
          </p>
        </div>

        <form @submit.prevent="handleUpdatePassword" class="password-form">
          <div class="form-group">
            <label for="new-password" class="form-label">新密码</label>
            <input
              id="new-password"
              v-model="passwordForm.password"
              type="password"
              class="form-input"
              :class="{ error: passwordErrors.password }"
              placeholder="请输入新密码"
              @input="onPasswordInput"
            />
            <div v-if="passwordErrors.password" class="error-message">
              {{ passwordErrors.password }}
            </div>

            <!-- 密码强度指示器 -->
            <div v-if="passwordForm.password" class="password-strength">
              <div class="strength-bar">
                <div
                  class="strength-fill"
                  :class="passwordStrength.class"
                  :style="{ width: passwordStrength.percentage + '%' }"
                ></div>
              </div>
              <div class="strength-text" :class="passwordStrength.class">
                密码强度：{{ passwordStrength.text }}
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="confirm-password" class="form-label">确认密码</label>
            <input
              id="confirm-password"
              v-model="passwordForm.confirmPassword"
              type="password"
              class="form-input"
              :class="{ error: passwordErrors.confirmPassword }"
              placeholder="请再次输入新密码"
              @input="onConfirmPasswordInput"
            />
            <div v-if="passwordErrors.confirmPassword" class="error-message">
              {{ passwordErrors.confirmPassword }}
            </div>
          </div>

          <div class="form-help">
            <h4>密码要求：</h4>
            <ul>
              <li>至少6个字符</li>
              <li>建议包含大小写字母、数字和特殊字符以提高安全性</li>
            </ul>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="closePasswordModal"
              class="btn btn-secondary"
              :disabled="isUpdatingPassword"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isUpdatingPassword || !isPasswordFormValid"
              :class="{ loading: isUpdatingPassword }"
            >
              <LoadingSpinner v-if="isUpdatingPassword" size="small" />
              更新密码
            </button>
          </div>
        </form>
      </div>
    </Modal>
  </StandardPageLayout>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useUserManagement } from "../composables/useUserManagement.js";
import { useAuth } from "../composables/useAuth.js";
import { useToast } from "../composables/useToast.js";
import { updateUser as apiUpdateUser } from "../services/api.js";
import {
  validatePassword,
  validatePasswordConfirm,
  calculatePasswordStrength,
} from "../config/userValidationConfig.js";
import StandardPageLayout from "../components/layout/StandardPageLayout.vue";
import LoadingSpinner from "../components/base/LoadingSpinner.vue";
import Modal from "../components/base/Modal.vue";

const { currentUser } = useAuth();
const { showToast } = useToast();
const {
  users,
  filteredUsers,
  totalUsers,
  activeUsers,
  adminUsers,
  isLoading,
  error,
  searchQuery,
  statusFilter,
  roleFilter,
  currentPage,
  totalPages,
  showEditModal,
  editForm,
  editErrors,
  isUpdating,
  loadUsers,
  handleSearch,
  handleFilter,
  clearSearch,
  goToPage,
  editUser,
  closeEditModal,
  updateUser,
  toggleUserStatus,
} = useUserManagement();

// 修改密码相关状态
const showPasswordModal = ref(false);
const isUpdatingPassword = ref(false);
const passwordForm = ref({
  id: null,
  username: "",
  password: "",
  confirmPassword: "",
});
const passwordErrors = ref({});

// 密码强度计算
const passwordStrength = computed(() => {
  return calculatePasswordStrength(passwordForm.value.password);
});

// 检查密码表单是否有效
const isPasswordFormValid = computed(() => {
  return (
    passwordForm.value.password &&
    passwordForm.value.confirmPassword &&
    Object.keys(passwordErrors.value).length === 0
  );
});

onMounted(() => {
  loadUsers();
});

// 获取用户头像首字母
const getUserInitials = (user) => {
  if (!user) return "U";
  const name = user.full_name || user.username || "User";
  return name.charAt(0).toUpperCase();
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "未知";
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 处理更新用户
const handleUpdateUser = async () => {
  await updateUser();
};

// 修改密码功能
const changePassword = (user) => {
  passwordForm.value = {
    id: user.id,
    username: user.username,
    password: "",
    confirmPassword: "",
  };
  passwordErrors.value = {};
  showPasswordModal.value = true;
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
  passwordForm.value = {
    id: null,
    username: "",
    password: "",
    confirmPassword: "",
  };
  passwordErrors.value = {};
};

// 密码输入验证
const onPasswordInput = () => {
  const result = validatePassword(passwordForm.value.password);
  if (result === true) {
    delete passwordErrors.value.password;
  } else {
    passwordErrors.value.password = result;
  }

  // 如果确认密码已输入，重新验证确认密码
  if (passwordForm.value.confirmPassword) {
    onConfirmPasswordInput();
  }
};

const onConfirmPasswordInput = () => {
  const result = validatePasswordConfirm(
    passwordForm.value.password,
    passwordForm.value.confirmPassword
  );
  if (result === true) {
    delete passwordErrors.value.confirmPassword;
  } else {
    passwordErrors.value.confirmPassword = result;
  }
};

// 处理密码更新
const handleUpdatePassword = async () => {
  try {
    isUpdatingPassword.value = true;

    // 最终验证
    const passwordResult = validatePassword(passwordForm.value.password);
    const confirmResult = validatePasswordConfirm(
      passwordForm.value.password,
      passwordForm.value.confirmPassword
    );

    if (passwordResult !== true || confirmResult !== true) {
      passwordErrors.value = {
        ...(passwordResult !== true && { password: passwordResult }),
        ...(confirmResult !== true && { confirmPassword: confirmResult }),
      };
      return;
    } // 调用API更新密码
    await apiUpdateUser(passwordForm.value.id, {
      password: passwordForm.value.password,
    });

    showToast({
      type: "success",
      message: "密码修改成功",
    });

    closePasswordModal();
  } catch (error) {
    console.error("修改密码失败:", error);
    showToast({
      type: "error",
      message: error.response?.data?.detail || "修改密码失败，请重试",
    });
  } finally {
    isUpdatingPassword.value = false;
  }
};
</script>

<style scoped>
.user-management-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* 顶部操作栏 */
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: #374151;
  background: #f3f4f6;
}

.filter-section {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.stat-icon.active {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.stat-icon.admin {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #374151;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

/* 表格容器 */
.users-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  margin-bottom: 2rem;
}

.users-table {
  overflow-x: auto;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.users-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  white-space: nowrap;
}

.user-row:hover {
  background: #f9fafb;
}

.user-info-cell {
  min-width: 280px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  flex-shrink: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
}

.avatar-image {
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.username {
  font-size: 0.8rem;
  color: #667eea;
  font-weight: 500;
}

.email {
  font-size: 0.8rem;
  color: #6b7280;
}

.role-badge,
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.role-badge {
  background: #e0e7ff;
  color: #3730a3;
}

.role-badge.admin {
  background: #fce7f3;
  color: #be185d;
}

.status-badge {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.date-cell {
  font-size: 0.9rem;
  color: #6b7280;
  white-space: nowrap;
}

.actions-cell {
  width: 120px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn {
  background: #e0f2fe;
  color: #0369a1;
}

.edit-btn:hover {
  background: #bae6fd;
  transform: scale(1.1);
}

.password-btn {
  background: #fef3c7;
  color: #92400e;
}

.password-btn:hover {
  background: #fde68a;
  transform: scale(1.1);
}

.disable-btn {
  background: #fee2e2;
  color: #dc2626;
}

.disable-btn:hover {
  background: #fecaca;
  transform: scale(1.1);
}

.enable-btn {
  background: #dcfce7;
  color: #16a34a;
}

.enable-btn:hover {
  background: #bbf7d0;
  transform: scale(1.1);
}

/* 状态页面 */
.loading-state,
.error-state,
.empty-state {
  padding: 3rem 2rem;
  text-align: center;
  color: #6b7280;
}

.error-state h3,
.empty-state h3 {
  color: #374151;
  margin: 1rem 0 0.5rem 0;
  font-size: 1.25rem;
}

.error-icon,
.empty-icon {
  color: #d1d5db;
  margin-bottom: 1rem;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.9rem;
}

/* 编辑表单 */
.edit-user-modal {
  max-width: 100%;
  padding: 1.5rem;
}

.edit-user-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input.readonly {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-help {
  font-size: 0.8rem;
  color: #6b7280;
}

.form-help h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
}

.form-help ul {
  margin: 0;
  padding-left: 1.25rem;
  color: #6b7280;
  font-size: 0.8rem;
}

.form-help li {
  margin-bottom: 0.25rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: white;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: #667eea;
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  color: #374151;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  min-width: 100px;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn.loading {
  pointer-events: none;
}

/* 模态框标题 */
.modal-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.modal-subtitle {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

/* 修改密码模态框 */
.password-modal {
  max-width: 100%;
  padding: 1.5rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 密码强度指示器 */
.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 3px;
}

.strength-fill.weak {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.strength-fill.medium {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.strength-fill.strong {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
}

.strength-fill.very-strong {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
}

.strength-text {
  font-size: 0.8rem;
  font-weight: 500;
}

.strength-text.weak {
  color: #ef4444;
}

.strength-text.medium {
  color: #f59e0b;
}

.strength-text.strong {
  color: #10b981;
}

.strength-text.very-strong {
  color: #059669;
}
</style>
