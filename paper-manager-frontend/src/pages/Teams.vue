<template>
  <StandardPageLayout
    title="团队管理"
    icon="👥"
    description="创建和管理您的科研团队"
  >
    <!-- 团队概览页面 -->
    <div v-if="!selectedTeam" class="teams-overview">
      <div class="overview-header">
        <div class="header-content">
          <div class="title-section">
            <h1 class="page-title">
              <span class="title-icon">👥</span>
              我的科研团队
            </h1>
            <p class="page-subtitle">协作共享，推动学术研究进步</p>
          </div>
        </div>
      </div>
      <TeamList @team-selected="handleTeamSelected" />
    </div>

    <!-- 团队详情页面 -->
    <div v-else class="team-detail">
      <!-- 优雅的返回按钮和团队标题 -->
      <div class="team-header">
        <div class="header-left">
          <button @click="selectedTeam = null" class="back-btn">
            <span class="back-icon">←</span>
            <span>返回</span>
          </button>
          <div class="team-title-section">
            <h2 class="team-title">{{ selectedTeam.name }}</h2>
            <p class="team-subtitle" v-if="selectedTeam.description">
              {{ selectedTeam.description }}
            </p>
          </div>
        </div>
        <div class="header-right">
          <div class="team-badge">
            <span class="badge-icon">👤</span>
            <span>{{ selectedTeam.member_count || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 现代化标签页 -->
      <div class="team-tabs">
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
            <div class="tab-indicator"></div>
          </button>
        </div>
      </div>

      <!-- 标签内容区域 -->
      <div class="tab-content">
        <div class="content-wrapper">
          <!-- 团队信息 -->
          <div v-if="activeTab === 'info'" class="team-info-tab">
            <TeamInfo :team="selectedTeam" @updated="handleTeamUpdated" />
          </div>

          <!-- 团队成员 -->
          <div v-if="activeTab === 'members'" class="team-members-tab">
            <TeamMembers
              :team="selectedTeam"
              @member-added="handleMemberAdded"
              @member-removed="handleMemberRemoved"
            />
          </div>
        </div>
      </div>
    </div>
  </StandardPageLayout>
</template>

<script setup>
import { ref } from "vue";
import {
  StandardPageLayout,
  TeamList,
  TeamInfo,
  TeamMembers,
} from "@/components";

const selectedTeam = ref(null);
const activeTab = ref("info");

const tabs = [
  { key: "info", label: "团队信息", icon: "ℹ️" },
  { key: "members", label: "团队成员", icon: "👤" },
];

const handleTeamSelected = (team) => {
  selectedTeam.value = team;
  activeTab.value = "info";
};

const handleTeamUpdated = (updatedTeam) => {
  selectedTeam.value = updatedTeam;
};

const handleMemberAdded = () => {
  // 可以在这里刷新团队信息
};

const handleMemberRemoved = () => {
  // 可以在这里刷新团队信息
};
</script>

<style scoped>
/* 团队概览页面样式 */
.teams-overview {
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-25) 100%);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
  overflow: hidden;
}

.overview-header {
  background: linear-gradient(
    135deg,
    var(--primary-600) 0%,
    var(--primary-700) 100%
  );
  color: var(--white);
  padding: var(--space-lg) var(--space-xl);
  position: relative;
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 var(--space-xs) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  line-height: 1.2;
  color: var(--white);
}

.title-icon {
  font-size: 2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.page-subtitle {
  font-size: 1rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
  color: var(--white);
}

/* 团队详情页面样式 */
.team-detail {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
  overflow: hidden;
}

.team-header {
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-25) 100%);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--primary-100);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--white);
  border: 2px solid var(--primary-200);
  border-radius: var(--border-radius);
  color: var(--primary-700);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 2px 6px rgba(125, 108, 192, 0.08);
  font-size: 0.9rem;
}

.back-btn:hover {
  background: var(--primary-50);
  border-color: var(--primary-300);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(125, 108, 192, 0.15);
}

.back-icon {
  font-size: 1.2rem;
  transition: transform var(--transition-normal);
}

.back-btn:hover .back-icon {
  transform: translateX(-2px);
}

.team-title-section {
  flex: 1;
}

.team-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 var(--space-xs) 0;
  line-height: 1.3;
}

.team-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin: 0;
  opacity: 0.8;
}

.header-right {
  display: flex;
  align-items: center;
}

.team-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--primary-600);
  color: var(--white);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.85rem;
  box-shadow: 0 2px 6px rgba(125, 108, 192, 0.2);
}

.badge-icon {
  font-size: 1rem;
}

/* 现代化标签页样式 */
.team-tabs {
  background: var(--primary-25);
  border-bottom: 1px solid var(--primary-100);
  padding: 0 var(--space-xl);
}

.tabs-container {
  display: flex;
  gap: var(--space-xs);
}

.tab-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) var(--space-lg);
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  transition: all var(--transition-normal);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
  margin-bottom: -1px;
}

.tab-btn:hover {
  background: var(--primary-50);
  color: var(--primary-700);
  transform: translateY(-2px);
}

.tab-btn.active {
  background: var(--white);
  color: var(--primary-700);
  box-shadow: 0 -2px 8px rgba(125, 108, 192, 0.1);
}

.tab-icon {
  font-size: 1rem;
  transition: transform var(--transition-normal);
}

.tab-btn:hover .tab-icon,
.tab-btn.active .tab-icon {
  transform: scale(1.1);
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: var(--primary-600);
  border-radius: 2px;
  transition: width var(--transition-normal);
}

.tab-btn.active .tab-indicator {
  width: 80%;
}

/* 标签内容区域 */
.tab-content {
  background: var(--white);
  min-height: 400px;
}

.content-wrapper {
  padding: var(--space-xl);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .overview-header,
  .team-header,
  .content-wrapper {
    padding-left: var(--space-lg);
    padding-right: var(--space-lg);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .team-title {
    font-size: 1.25rem;
  }
}

@media (max-width: 768px) {
  .overview-header,
  .team-header,
  .content-wrapper {
    padding: var(--space-md);
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .team-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
    width: 100%;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .team-title {
    font-size: 1.1rem;
  }

  .tabs-container {
    flex-direction: column;
    gap: 0;
  }

  .tab-btn {
    border-radius: 0;
    justify-content: center;
    border-bottom: 1px solid var(--primary-100);
  }

  .tab-btn:last-child {
    border-bottom: none;
  }

  .tab-indicator {
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

.team-detail,
.teams-overview {
  animation: fadeInUp 0.5s ease-out;
}

/* 深色模式适配（如果需要） */
@media (prefers-color-scheme: dark) {
  .team-detail,
  .teams-overview {
    background: var(--gray-900);
    border-color: var(--gray-700);
  }

  .overview-header {
    background: linear-gradient(
      135deg,
      var(--gray-800) 0%,
      var(--gray-900) 100%
    );
  }

  .team-header {
    background: linear-gradient(
      135deg,
      var(--gray-900) 0%,
      var(--gray-800) 100%
    );
    border-bottom-color: var(--gray-700);
  }
}
</style>
