<template>
  <StandardPageLayout title="个人资料" subtitle="管理您的个人信息和偏好设置">
    <div class="profile-page">
      <!-- 用户信息概览卡片 -->
      <div class="profile-overview-card">
        <div class="profile-header">
          <div class="profile-avatar">
            <img
              v-if="currentUser?.avatar"
              :src="currentUser.avatar"
              :alt="currentUser.username"
              class="avatar-image"
            />
            <div v-else class="avatar-placeholder">
              {{ getUserInitials(currentUser) }}
            </div>
            <button class="avatar-edit-btn" title="更换头像">
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
          </div>
          <div class="profile-info">
            <h3 class="profile-name">
              {{ currentUser?.full_name || currentUser?.username || "用户" }}
            </h3>
            <p class="profile-username">@{{ currentUser?.username }}</p>
            <div class="profile-meta">
              <span class="meta-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l1.326-.795 5.64 3.47A1 1 0 0 1 14 13H8.5a.5.5 0 0 0 0 1H14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"
                  />
                </svg>
                {{ currentUser?.email || "未设置邮箱" }}
              </span>
              <span class="meta-item">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                  />
                </svg>
                加入于 {{ formatDate(currentUser?.created_at) }}
              </span>
              <span class="meta-item" v-if="currentUser?.is_superuser">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
                  />
                </svg>
                管理员权限
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 编辑个人信息表单 -->
      <div class="profile-form-card">
        <div class="card-header">
          <h4 class="card-title">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              <path
                fill-rule="evenodd"
                d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z"
              />
            </svg>
            编辑个人信息
          </h4>
          <p class="card-description">更新您的个人信息和账户设置</p>
        </div>

        <form @submit.prevent="handleUpdateProfile" class="profile-form">
          <!-- 邮箱 -->
          <div class="form-group">
            <label for="email" class="form-label">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l1.326-.795 5.64 3.47A1 1 0 0 1 14 13H8.5a.5.5 0 0 0 0 1H14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2Zm3.708 6.208L1 11.105V5.383l4.708 2.825ZM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2-7-4.2Z"
                />
              </svg>
              邮箱地址
            </label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              class="form-input"
              :class="{ error: validationErrors.email }"
              placeholder="请输入您的邮箱地址"
            />
            <div v-if="validationErrors.email" class="error-message">
              {{ validationErrors.email }}
            </div>
          </div>
          <!-- 全名 -->
          <div class="form-group">
            <label for="full_name" class="form-label">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"
                />
              </svg>
              姓名
            </label>
            <input
              id="full_name"
              v-model="profileForm.full_name"
              type="text"
              class="form-input"
              :class="{ error: validationErrors.full_name }"
              placeholder="请输入您的真实姓名"
            />
            <div v-if="validationErrors.full_name" class="error-message">
              {{ validationErrors.full_name }}
            </div>
          </div>

          <!-- 用户名（只读） -->
          <div class="form-group">
            <label for="username" class="form-label">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 13.5A.5.5 0 0 1 3 13h10a.5.5 0 0 1 .5.5 1.5 1.5 0 0 1-1.5 1.5H4a1.5 1.5 0 0 1-1.5-1.5Z"
                />
              </svg>
              用户名
            </label>
            <input
              id="username"
              :value="currentUser?.username"
              type="text"
              class="form-input readonly"
              readonly
              disabled
            />
            <div class="form-help">用户名无法修改</div>
          </div>

          <!-- 密码修改 -->
          <div class="form-section">
            <h5 class="section-title">修改密码</h5>
            <p class="section-description">留空则不修改密码</p>
            <div class="form-group">
              <label for="password" class="form-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2ZM6 7v-.5A2.5 2.5 0 0 1 8.5 4h-1A1.5 1.5 0 0 0 6 5.5V7Z"
                  />
                  <path
                    d="M5.5 9A1.5 1.5 0 0 0 4 10.5v2A1.5 1.5 0 0 0 5.5 14h5a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 10.5 9h-5Z"
                  />
                </svg>
                新密码
              </label>
              <input
                id="password"
                v-model="profileForm.password"
                type="password"
                class="form-input"
                :class="{ error: validationErrors.password }"
                placeholder="请输入新密码（至少8个字符，包含大小写字母、数字、特殊字符中的至少三种）"
              />
              <div v-if="validationErrors.password" class="error-message">
                {{ validationErrors.password }}
              </div>
              <!-- 密码强度指示器 -->
              <div v-if="profileForm.password" class="password-strength">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="passwordStrength.class"
                    :style="{ width: passwordStrength.percentage + '%' }"
                  ></div>
                </div>
                <span class="strength-text" :class="passwordStrength.class">
                  密码强度：{{ passwordStrength.text }}
                </span>
              </div>
            </div>

            <div class="form-group" v-if="profileForm.password">
              <label for="confirmPassword" class="form-label">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2ZM6 7v-.5A2.5 2.5 0 0 1 8.5 4h-1A1.5 1.5 0 0 0 6 5.5V7Z"
                  />
                  <path
                    d="M5.5 9A1.5 1.5 0 0 0 4 10.5v2A1.5 1.5 0 0 0 5.5 14h5a1.5 1.5 0 0 0 1.5-1.5v-2A1.5 1.5 0 0 0 10.5 9h-5Z"
                  />
                </svg>
                确认新密码
              </label>
              <input
                id="confirmPassword"
                v-model="profileForm.confirmPassword"
                type="password"
                class="form-input"
                :class="{ error: validationErrors.confirmPassword }"
                placeholder="请再次输入新密码"
              />
              <div
                v-if="validationErrors.confirmPassword"
                class="error-message"
              >
                {{ validationErrors.confirmPassword }}
              </div>
            </div>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <button
              type="button"
              @click="handleResetForm"
              class="btn btn-secondary"
              :disabled="isUpdating"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z"
                />
                <path
                  d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z"
                />
              </svg>
              重置
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="!hasChanges || isUpdating"
              :class="{ loading: isUpdating }"
            >
              <LoadingSpinner v-if="isUpdating" size="small" />
              <svg
                v-else
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path
                  d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"
                />
              </svg>
              保存更改
            </button>
          </div>
        </form>
      </div>

      <!-- 账户信息卡片 -->
      <div class="account-info-card">
        <div class="card-header">
          <h4 class="card-title">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3Zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
              />
            </svg>
            账户信息
          </h4>
        </div>

        <div class="account-info-list">
          <div class="info-item">
            <div class="info-label">用户ID</div>
            <div class="info-value">{{ currentUser?.id }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">账户状态</div>
            <div class="info-value">
              <span
                class="status-badge"
                :class="{ active: currentUser?.is_active }"
              >
                {{ currentUser?.is_active ? "活跃" : "已禁用" }}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">权限级别</div>
            <div class="info-value">
              <span
                class="role-badge"
                :class="{ admin: currentUser?.is_superuser }"
              >
                {{ currentUser?.is_superuser ? "管理员" : "普通用户" }}
              </span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">
              {{ formatDate(currentUser?.created_at) }}
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">最后更新</div>
            <div class="info-value">
              {{ formatDate(currentUser?.updated_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </StandardPageLayout>
</template>

<script setup>
import { onMounted } from "vue";
import { useAuth } from "../composables/useAuth.js";
import { useUserProfile } from "../composables/useUserProfile.js";
import StandardPageLayout from "../components/layout/StandardPageLayout.vue";
import LoadingSpinner from "../components/base/LoadingSpinner.vue";

const { currentUser } = useAuth();
const {
  profileForm,
  isUpdating,
  validationErrors,
  hasChanges,
  passwordStrength,
  initializeForm,
  updateProfile,
  resetForm,
} = useUserProfile();

onMounted(() => {
  initializeForm();
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
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 处理表单提交
const handleUpdateProfile = async () => {
  await updateProfile();
};

// 重置表单
const handleResetForm = () => {
  resetForm();
};
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 个人资料概览卡片 */
.profile-overview-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.profile-overview-card::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(30%, -30%);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  position: relative;
  z-index: 1;
}

.profile-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.avatar-image {
  object-fit: cover;
}

.avatar-placeholder {
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: white;
}

.avatar-edit-btn {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  border: none;
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.avatar-edit-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.profile-username {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.meta-item svg {
  opacity: 0.8;
}

/* 表单卡片 */
.profile-form-card,
.account-info-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.card-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.card-description {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

/* 表单样式 */
.profile-form {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.form-input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
  background: white;
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

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* 密码强度指示器 */
.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.strength-fill.medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.strength-fill.strong {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.strength-fill.very-strong {
  background: linear-gradient(90deg, #059669, #10b981);
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

.form-section {
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.section-description {
  color: #6b7280;
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
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
  min-width: 120px;
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

/* 账户信息列表 */
.account-info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.9rem;
}

.info-value {
  color: #374151;
  font-weight: 500;
}

.status-badge,
.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.role-badge {
  background: #e0e7ff;
  color: #3730a3;
}

.role-badge.admin {
  background: #fce7f3;
  color: #be185d;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
    gap: 1.5rem;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .profile-meta {
    align-items: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
