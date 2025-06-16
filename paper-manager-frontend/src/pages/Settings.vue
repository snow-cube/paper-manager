<template>
  <StandardPageLayout
    title="账户设置"
    subtitle="管理您的账户偏好设置和隐私选项"
  >
    <div class="settings-page">
      <!-- 安全设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M5.338 1.59a61.44 61.44 0 0 0-2.837.856.481.481 0 0 0-.328.39c-.554 4.157.726 7.19 2.253 9.188a10.725 10.725 0 0 0 2.287 2.233c.346.244.652.42.893.533.12.057.218.095.293.118a.55.55 0 0 0 .101.025.615.615 0 0 0 .1-.025c.076-.023.174-.061.294-.118.24-.113.547-.29.893-.533a10.726 10.726 0 0 0 2.287-2.233c1.527-1.997 2.807-5.031 2.253-9.188a.48.48 0 0 0-.328-.39c-.651-.213-1.75-.56-2.837-.855C9.552 1.29 8.531 1.067 8 1.067c-.53 0-1.552.223-2.662.524zM5.072.56C6.157.265 7.31 0 8 0s1.843.265 2.928.56c1.11.3 2.229.655 2.887.87a1.54 1.54 0 0 1 1.044 1.262c.596 4.477-.787 7.795-2.465 9.99a11.775 11.775 0 0 1-2.517 2.453 7.159 7.159 0 0 1-1.048.625c-.28.132-.581.24-.829.24s-.548-.108-.829-.24a7.158 7.158 0 0 1-1.048-.625 11.777 11.777 0 0 1-2.517-2.453C1.928 10.487.545 7.169 1.141 2.692A1.54 1.54 0 0 1 2.185 1.43 62.456 62.456 0 0 1 5.072.56z"
              />
              <path
                d="M10.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 7.793l2.646-2.647a.5.5 0 0 1 .708 0z"
              />
            </svg>
            安全设置
          </h3>
          <p class="section-description">管理您的账户安全选项</p>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">账户状态</div>
              <div class="setting-description">您的账户当前状态</div>
            </div>
            <div class="setting-control">
              <span
                class="status-badge"
                :class="{ active: currentUser?.is_active }"
              >
                {{ currentUser?.is_active ? "活跃" : "已禁用" }}
              </span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">最后登录时间</div>
              <div class="setting-description">您上次登录系统的时间</div>
            </div>
            <div class="setting-control">
              <span class="setting-value">{{
                formatDate(currentUser?.updated_at)
              }}</span>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">权限级别</div>
              <div class="setting-description">您在系统中的权限等级</div>
            </div>
            <div class="setting-control">
              <span
                class="role-badge"
                :class="{ admin: currentUser?.is_superuser }"
              >
                {{ currentUser?.is_superuser ? "管理员" : "普通用户" }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 个人偏好设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"
              />
              <path
                d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"
              />
            </svg>
            个人偏好
          </h3>
          <p class="section-description">自定义您的使用体验</p>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">语言设置</div>
              <div class="setting-description">选择您的首选语言</div>
            </div>
            <div class="setting-control">
              <select v-model="preferences.language" class="setting-select">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">主题设置</div>
              <div class="setting-description">选择您的界面主题</div>
            </div>
            <div class="setting-control">
              <select v-model="preferences.theme" class="setting-select">
                <option value="light">浅色主题</option>
                <option value="dark">深色主题</option>
                <option value="auto">跟随系统</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">每页显示数量</div>
              <div class="setting-description">设置列表页面的默认显示数量</div>
            </div>
            <div class="setting-control">
              <select v-model="preferences.pageSize" class="setting-select">
                <option :value="10">10 条/页</option>
                <option :value="20">20 条/页</option>
                <option :value="50">50 条/页</option>
                <option :value="100">100 条/页</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 通知设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"
              />
            </svg>
            通知设置
          </h3>
          <p class="section-description">管理您接收通知的方式</p>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">邮件通知</div>
              <div class="setting-description">接收重要更新的邮件通知</div>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="notifications.email" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">系统通知</div>
              <div class="setting-description">显示系统级别的通知消息</div>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="notifications.system" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">团队通知</div>
              <div class="setting-description">接收团队相关活动的通知</div>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="notifications.team" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 隐私设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h3 class="section-title">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5h16V4a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 1-.5-.5z"
              />
              <path
                d="M11.5 6a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V6zM9 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1A.5.5 0 0 1 9 9V8z"
              />
            </svg>
            隐私设置
          </h3>
          <p class="section-description">控制您的信息可见性</p>
        </div>

        <div class="settings-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">个人资料可见性</div>
              <div class="setting-description">
                控制其他用户是否可以查看您的个人资料
              </div>
            </div>
            <div class="setting-control">
              <select
                v-model="privacy.profileVisibility"
                class="setting-select"
              >
                <option value="public">公开</option>
                <option value="team">仅团队成员</option>
                <option value="private">私有</option>
              </select>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">邮箱可见性</div>
              <div class="setting-description">
                控制其他用户是否可以看到您的邮箱
              </div>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="privacy.emailVisible" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">论文活动可见性</div>
              <div class="setting-description">
                控制您的论文相关活动是否对他人可见
              </div>
            </div>
            <div class="setting-control">
              <label class="toggle-switch">
                <input type="checkbox" v-model="privacy.activityVisible" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 保存设置按钮 -->
      <div class="settings-actions">
        <button
          @click="handleSaveSettings"
          class="btn btn-primary"
          :disabled="isSaving"
        >
          <LoadingSpinner v-if="isSaving" size="small" />
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
          保存设置
        </button>
      </div>

      <!-- 危险操作区域 -->
      <div class="settings-section danger-section">
        <div class="section-header">
          <h3 class="section-title danger">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-2.008 0L.127 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z"
              />
              <path
                d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z"
              />
            </svg>
            危险操作
          </h3>
          <p class="section-description">这些操作可能影响您的账户安全</p>
        </div>

        <div class="settings-card danger-card">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">清除所有数据</div>
              <div class="setting-description">
                删除您的所有个人数据和偏好设置
              </div>
            </div>
            <div class="setting-control">
              <button @click="handleClearData" class="btn btn-danger">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"
                  />
                </svg>
                清除数据
              </button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-label">注销账户</div>
              <div class="setting-description">
                永久删除您的账户和所有相关数据
              </div>
            </div>
            <div class="setting-control">
              <button @click="handleDeleteAccount" class="btn btn-danger">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path
                    d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5Zm-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5ZM4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06Zm6.53-.528a.5.5 0 0 1 .47.528l-.5 8.5a.5.5 0 1 1-.998-.058l.5-8.5a.5.5 0 0 1 .528-.47ZM8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5Z"
                  />
                </svg>
                注销账户
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </StandardPageLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useAuth } from "../composables/useAuth.js";
import { useToast } from "../composables/useToast.js";
import { useConfirmDialog } from "../composables/useConfirmDialog.js";
import StandardPageLayout from "../components/layout/StandardPageLayout.vue";
import LoadingSpinner from "../components/base/LoadingSpinner.vue";

const { currentUser } = useAuth();
const { showToast } = useToast();
const { showConfirmDialog } = useConfirmDialog();

const isSaving = ref(false);

// 个人偏好设置
const preferences = reactive({
  language: "zh-CN",
  theme: "light",
  pageSize: 20,
});

// 通知设置
const notifications = reactive({
  email: true,
  system: true,
  team: true,
});

// 隐私设置
const privacy = reactive({
  profileVisibility: "team",
  emailVisible: false,
  activityVisible: true,
});

onMounted(() => {
  loadSettings();
});

// 加载设置（从localStorage或API）
const loadSettings = () => {
  try {
    const savedPreferences = localStorage.getItem("userPreferences");
    if (savedPreferences) {
      Object.assign(preferences, JSON.parse(savedPreferences));
    }

    const savedNotifications = localStorage.getItem("userNotifications");
    if (savedNotifications) {
      Object.assign(notifications, JSON.parse(savedNotifications));
    }

    const savedPrivacy = localStorage.getItem("userPrivacy");
    if (savedPrivacy) {
      Object.assign(privacy, JSON.parse(savedPrivacy));
    }
  } catch (error) {
    console.error("加载设置失败:", error);
  }
};

// 保存设置
const handleSaveSettings = async () => {
  isSaving.value = true;

  try {
    // 保存到localStorage（实际应用中应该保存到后端）
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    localStorage.setItem("userNotifications", JSON.stringify(notifications));
    localStorage.setItem("userPrivacy", JSON.stringify(privacy));

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    showToast("设置保存成功", "success");
  } catch (error) {
    console.error("保存设置失败:", error);
    showToast("保存设置失败，请稍后重试", "error");
  } finally {
    isSaving.value = false;
  }
};

// 清除数据
const handleClearData = async () => {
  const confirmed = await showConfirmDialog({
    title: "清除所有数据",
    message: "此操作将清除您的所有个人偏好设置和应用数据。您确定要继续吗？",
    type: "warning",
    confirmText: "确认清除",
    cancelText: "取消",
  });

  if (confirmed) {
    try {
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("userNotifications");
      localStorage.removeItem("userPrivacy");

      // 重置为默认值
      Object.assign(preferences, {
        language: "zh-CN",
        theme: "light",
        pageSize: 20,
      });

      Object.assign(notifications, {
        email: true,
        system: true,
        team: true,
      });

      Object.assign(privacy, {
        profileVisibility: "team",
        emailVisible: false,
        activityVisible: true,
      });

      showToast("数据已清除", "success");
    } catch (error) {
      console.error("清除数据失败:", error);
      showToast("清除数据失败", "error");
    }
  }
};

// 注销账户
const handleDeleteAccount = async () => {
  const confirmed = await showConfirmDialog({
    title: "注销账户",
    message:
      "此操作将永久删除您的账户和所有相关数据，无法恢复。您确定要继续吗？",
    type: "danger",
    confirmText: "确认注销",
    cancelText: "取消",
  });

  if (confirmed) {
    const doubleConfirmed = await showConfirmDialog({
      title: "最后确认",
      message: "请再次确认您要永久删除账户。此操作无法撤销！",
      type: "danger",
      confirmText: "我确定要删除",
      cancelText: "取消",
    });

    if (doubleConfirmed) {
      showToast("账户注销功能暂未开放，请联系管理员", "info");
    }
  }
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
</script>

<style scoped>
.settings-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.section-title.danger {
  color: #dc2626;
}

.section-description {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

.settings-card {
  padding: 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.setting-description {
  color: #6b7280;
  font-size: 0.9rem;
}

.setting-control {
  flex-shrink: 0;
  margin-left: 1rem;
}

.setting-value {
  color: #374151;
  font-weight: 500;
}

.setting-select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  color: #374151;
  min-width: 150px;
}

.setting-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 切换开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: all 0.3s ease;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: all 0.3s ease;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

input:checked + .toggle-slider {
  background-color: #667eea;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* 状态徽章 */
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

/* 按钮样式 */
.settings-actions {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
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

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-danger {
  background: #dc2626;
  color: white;
  font-size: 0.8rem;
  padding: 0.5rem 1rem;
  min-width: auto;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

/* 危险区域样式 */
.danger-section {
  border-color: #fecaca;
}

.danger-section .section-header {
  background: #fef2f2;
  border-bottom-color: #fecaca;
}

.danger-card {
  background: #fffbfb;
}

.danger-card .setting-item {
  border-bottom-color: #fecaca;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
    gap: 1.5rem;
  }

  .section-header {
    padding: 1rem;
  }

  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }

  .setting-control {
    margin-left: 0;
    width: 100%;
  }

  .setting-select {
    width: 100%;
  }
}
</style>
