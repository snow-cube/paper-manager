<template>
  <div class="team-info">
    <div class="info-header">
      <div class="header-content">
        <h3 class="section-title">
          <span class="title-icon">ℹ️</span>
          团队基本信息
        </h3>
        <p class="section-subtitle">查看和管理团队的详细信息</p>
      </div>
      <div class="header-decoration">
        <div class="decoration-dots"></div>
      </div>
    </div>

    <div class="info-content">
      <div class="info-grid">
        <div class="info-card">
          <div class="card-header">
            <span class="card-icon">🏷️</span>
            <label>团队名称</label>
          </div>
          <p class="card-value">{{ team.name }}</p>
        </div>

        <div class="info-card">
          <div class="card-header">
            <span class="card-icon">📝</span>
            <label>团队描述</label>
          </div>
          <p class="card-value">{{ team.description || "暂无描述" }}</p>
        </div>

        <div class="info-card">
          <div class="card-header">
            <span class="card-icon">📅</span>
            <label>创建时间</label>
          </div>
          <p class="card-value">{{ formatDate(team.created_at) }}</p>
        </div>

        <div class="info-card">
          <div class="card-header">
            <span class="card-icon">🔄</span>
            <label>最后更新</label>
          </div>
          <p class="card-value">{{ formatDate(team.updated_at) }}</p>
        </div>

        <div class="info-card">
          <div class="card-header">
            <span class="card-icon">👥</span>
            <label>成员数量</label>
          </div>
          <p class="card-value">
            <span class="member-count">{{ team.member_count || 0 }}</span> 人
          </p>
        </div>

        <div class="info-card">
          <div class="card-header">
            <span class="card-icon">⚡</span>
            <label>团队状态</label>
          </div>
          <div class="card-value">
            <span
              :class="['status-badge', team.is_active ? 'active' : 'inactive']"
            >
              {{ team.is_active ? "活跃" : "非活跃" }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="actions-section">
      <button @click="showEditForm = true" class="btn btn-primary">
        <span class="btn-icon">✏️</span>
        编辑团队信息
      </button>
    </div>

    <!-- 编辑表单模态框 -->
    <Modal v-if="showEditForm" @close="showEditForm = false">
      <TeamForm
        :team="team"
        @saved="handleTeamUpdated"
        @cancel="showEditForm = false"
      />
    </Modal>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Modal from "../../base/Modal.vue";
import TeamForm from "../../forms/TeamForm.vue";

const props = defineProps({
  team: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["updated"]);

const showEditForm = ref(false);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const handleTeamUpdated = (updatedTeam) => {
  showEditForm.value = false;
  emit("updated", updatedTeam);
};
</script>

<style scoped>
.team-info {
  max-width: 1000px;
  margin: 0 auto;
}

/* 信息头部 */
.info-header {
  background: linear-gradient(
    135deg,
    var(--primary-25) 0%,
    var(--primary-50) 100%
  );
  border-radius: var(--border-radius-xl);
  padding: var(--space-xl) var(--space-xxl);
  margin-bottom: var(--space-xl);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--primary-100);
}

.header-content {
  position: relative;
  z-index: 2;
}

.section-title {
  color: var(--color-heading);
  margin: 0 0 var(--space-sm) 0;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.title-icon {
  font-size: 1.75rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.section-subtitle {
  color: var(--color-text-light);
  margin: 0;
  font-size: 1rem;
  opacity: 0.8;
}

.header-decoration {
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 100%;
  pointer-events: none;
}

.decoration-dots {
  position: absolute;
  top: 10px;
  right: 20px;
  width: 120px;
  height: 60px;
  background-image: radial-gradient(
    circle,
    var(--primary-300) 2px,
    transparent 2px
  );
  background-size: 20px 20px;
  opacity: 0.3;
}

/* 信息内容区域 */
.info-content {
  margin-bottom: var(--space-xl);
}

.info-grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

/* 信息卡片 */
.info-card {
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-25) 100%);
  border: 2px solid var(--primary-100);
  border-radius: var(--border-radius-lg);
  padding: var(--space-xl);
  transition: all var(--transition-bounce);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(125, 108, 192, 0.08);
}

.info-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.info-card:hover {
  border-color: var(--primary-300);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(125, 108, 192, 0.15);
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-50) 100%);
}

.info-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.card-icon {
  font-size: 1.25rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
}

.card-header label {
  font-weight: 600;
  color: var(--color-heading);
  font-size: 1rem;
  margin: 0;
}

.card-value {
  margin: 0;
  color: var(--color-text);
  line-height: 1.5;
  font-size: 1.1rem;
  font-weight: 500;
}

.member-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-600);
}

/* 状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
  font-size: 0.9rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
}

.status-badge.active {
  background: linear-gradient(135deg, var(--success-100), var(--success-200));
  color: var(--success-700);
  border: 1px solid var(--success-300);
}

.status-badge.inactive {
  background: linear-gradient(135deg, var(--error-100), var(--error-200));
  color: var(--error-700);
  border: 1px solid var(--error-300);
}

/* 操作区域 */
.actions-section {
  padding: var(--space-xl);
  background: linear-gradient(
    135deg,
    var(--gray-25) 0%,
    var(--primary-25) 100%
  );
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-100);
  text-align: center;
}

/* 按钮样式 */
.btn {
  padding: var(--space-md) var(--space-xl);
  border: none;
  border-radius: var(--border-radius-lg);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-bounce);
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  color: var(--white);
  box-shadow: 0 4px 8px rgba(125, 108, 192, 0.2);
}

.btn-primary::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.6s ease;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-700), var(--primary-800));
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(125, 108, 192, 0.3);
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-icon {
  font-size: 1rem;
  transition: transform var(--transition-normal);
}

.btn:hover .btn-icon {
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-header {
    padding: var(--space-lg);
    text-align: center;
  }

  .section-title {
    font-size: 1.25rem;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  .info-card {
    padding: var(--space-lg);
  }

  .actions-section {
    padding: var(--space-lg);
  }

  .decoration-dots {
    display: none;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-card {
  animation: fadeInUp 0.4s ease-out;
}

.info-card:nth-child(even) {
  animation-delay: 0.1s;
}

.info-card:nth-child(3n) {
  animation-delay: 0.2s;
}
</style>
