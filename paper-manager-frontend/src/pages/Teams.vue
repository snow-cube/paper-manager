<template>
  <StandardPageLayout
    title="团队管理"
    icon="👥"
    description="创建和管理您的科研团队"
  >
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
  </StandardPageLayout>
</template>

<script setup>
import { ref } from "vue";
import {
  StandardPageLayout,
  TeamList,
  TeamInfo,
  TeamMembers,
  TeamReferences,
} from "@/components";

const selectedTeam = ref(null);
const activeTab = ref("info");

const tabs = [
  { key: "info", label: "团队信息", icon: "ℹ️" },
  { key: "members", label: "团队成员", icon: "👤" },
  { key: "references", label: "参考文献", icon: "📚" },
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
.teams-overview {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
}

.team-detail {
  background: var(--white);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--primary-100);
  overflow: hidden;
}

.team-header {
  padding: var(--space-xl);
  border-bottom: 1px solid var(--primary-100);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: linear-gradient(135deg, var(--white), var(--primary-25));
}

.team-header h2 {
  color: var(--color-heading);
  margin: 0;
  flex: 1;
  font-size: var(--text-xl);
  font-weight: 600;
}

.team-tabs {
  display: flex;
  border-bottom: 1px solid var(--primary-100);
  background: var(--primary-25);
}

.tab-btn {
  padding: var(--space-md) var(--space-xl);
  border: none;
  background: none;
  cursor: pointer;
  font-size: var(--text-base);
  color: var(--color-text);
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  border-bottom: 3px solid transparent;
  font-weight: 500;
}

.tab-btn:hover {
  background: var(--primary-50);
  color: var(--primary-700);
}

.tab-btn.active {
  color: var(--primary-600);
  border-bottom-color: var(--primary-500);
  background: var(--white);
  font-weight: 600;
}

.tab-icon {
  font-size: var(--text-lg);
}

.tab-content {
  padding: var(--space-xl);
  min-height: 400px;
  background: var(--white);
}

.btn {
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-secondary {
  background: var(--gray-600);
  color: var(--white);
}

.btn-secondary:hover {
  background: var(--gray-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

@media (max-width: 768px) {
  .team-header {
    padding: var(--space-lg) var(--space-md);
    flex-direction: column;
    align-items: flex-start;
  }

  .team-tabs {
    flex-direction: column;
  }

  .tab-btn {
    padding: var(--space-md);
    justify-content: center;
  }

  .tab-content {
    padding: var(--space-lg) var(--space-md);
  }
}
</style>
