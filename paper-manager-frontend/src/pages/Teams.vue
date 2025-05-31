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
  background: #f8fafc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.page-icon {
  font-size: 2.5rem;
}

.page-description {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.teams-overview {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.team-detail {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.team-header {
  padding: 2rem;
  border-bottom: 1px solid #e1e5e9;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.team-header h2 {
  color: #333;
  margin: 0;
  flex: 1;
}

.team-tabs {
  display: flex;
  border-bottom: 1px solid #e1e5e9;
}

.tab-btn {
  padding: 1rem 2rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #f8fafc;
  color: #333;
}

.tab-btn.active {
  color: #6366f1;
  border-bottom-color: #6366f1;
  background: #f8fafc;
}

.tab-content {
  padding: 2rem;
  min-height: 400px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #5b6470;
}
</style>
