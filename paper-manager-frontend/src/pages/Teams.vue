<template>
  <div class="teams-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">
          <span class="page-icon">👥</span>
          团队管理
        </h1>
        <p class="page-description">创建和管理您的科研团队</p>
      </div>

      <div v-if="!selectedTeam" class="teams-overview">
        <TeamList @team-selected="handleTeamSelected" />
      </div>

      <div v-else class="team-detail">
        <div class="team-header">
          <button @click="selectedTeam = null" class="btn btn-secondary">
            ← 返回团队列表
          </button>
          <h2>{{ selectedTeam.name }}</h2>
        </div>

        <div class="team-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <div class="tab-content">
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

          <!-- 团队参考文献 -->
          <div v-if="activeTab === 'references'" class="team-references-tab">
            <TeamReferences :team="selectedTeam" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import TeamList from '../components/TeamList.vue';
import TeamInfo from '../components/TeamInfo.vue';
import TeamMembers from '../components/TeamMembers.vue';
import TeamReferences from '../components/TeamReferences.vue';

const selectedTeam = ref(null);
const activeTab = ref('info');

const tabs = [
  { key: 'info', label: '团队信息', icon: 'ℹ️' },
  { key: 'members', label: '团队成员', icon: '👤' },
  { key: 'references', label: '参考文献', icon: '📚' }
];

const handleTeamSelected = (team) => {
  selectedTeam.value = team;
  activeTab.value = 'info';
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
.teams-page {
  min-height: 100vh;
  background: var(--color-bg-soft);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-xl);
}

.page-header {
  text-align: center;
  margin-bottom: var(--space-3xl);
}

.page-title {
  font-size: var(--text-3xl);
  color: var(--color-heading);
  margin-bottom: var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.page-icon {
  font-size: var(--text-3xl);
}

.page-description {
  color: var(--color-text-light);
  font-size: var(--text-lg);
  margin: 0;
}

.teams-overview {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
}

.team-detail {
  background: var(--white);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.team-header {
  padding: var(--space-xl);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.team-header h2 {
  color: var(--color-heading);
  margin: 0;
  flex: 1;
}

.team-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  padding: var(--space-md) var(--space-xl);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--text-base);
  color: var(--color-text-light);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: var(--color-background-soft);
  color: var(--color-heading);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  background: var(--color-background-soft);
}

.tab-content {
  padding: var(--space-xl);
  min-height: 400px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-secondary {
  background: var(--gray-600);
  color: var(--white);
}

.btn-secondary:hover {
  background: var(--gray-700);
}
</style>
