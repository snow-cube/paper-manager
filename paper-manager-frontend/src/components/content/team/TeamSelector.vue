<template>
  <div class="team-selector">
    <div class="current-team" @click="toggleDropdown" :class="{ open: isOpen }">
      <div class="team-info">
        <span class="team-icon">👥</span>
        <div class="team-details">
          <span class="team-name">{{ currentTeam?.name || "选择团队" }}</span>
          <span v-if="currentTeam" class="team-label">当前团队</span>
        </div>
      </div>
      <span class="dropdown-arrow" :class="{ rotated: isOpen }">▼</span>
    </div>

    <transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-header">切换团队</div>
        <div
          v-for="team in userTeams"
          :key="team.id"
          @click="selectTeam(team)"
          :class="['dropdown-item', { active: team.id === currentTeam?.id }]"
        >
          <span class="team-icon">👥</span>
          <div class="team-info">
            <span class="team-name">{{ team.name }}</span>
            <span class="team-desc">{{ team.description }}</span>
          </div>
          <span v-if="team.id === currentTeam?.id" class="check-icon">✓</span>
        </div>

        <div class="dropdown-divider"></div>
        <RouterLink
          to="/teams"
          @click="closeDropdown"
          class="dropdown-item action-item"
        >
          <span class="action-icon">⚙️</span>
          <span>管理团队</span>
        </RouterLink>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useTeam } from "../../../composables/useTeam.js";

const { currentTeam, userTeams, switchTeam, onTeamUpdate, refreshTeams } = useTeam();
const isOpen = ref(false);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectTeam = (team) => {
  switchTeam(team);
  closeDropdown();
};

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (!event.target.closest(".team-selector")) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);

  // 监听团队更新事件
  onTeamUpdate(async () => {
    await refreshTeams();
  });
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.team-selector {
  position: relative;
  min-width: 180px;
  max-width: 220px;
  width: 100%;
}

.current-team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--primary-50);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.current-team:hover {
  background: var(--primary-100);
  border-color: var(--primary-300);
}

.current-team.open {
  background: var(--primary-100);
  border-color: var(--primary-400);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.team-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.team-icon {
  font-size: 1.125rem;
}

.team-details {
  display: flex;
  flex-direction: column;
}

.team-name {
  font-weight: 500;
  color: var(--primary-700);
  font-size: 0.875rem;
}

.team-label {
  font-size: 0.75rem;
  color: var(--primary-500);
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: var(--primary-500);
  transition: transform 0.2s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-top: none;
  border-radius: 0 0 var(--border-radius) var(--border-radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-header {
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-background-mute);
  border-bottom: 1px solid var(--color-border);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: inherit;
}

.dropdown-item:hover {
  background: var(--primary-50);
}

.dropdown-item.active {
  background: var(--primary-100);
  color: var(--primary-700);
}

.dropdown-item .team-info {
  flex: 1;
  gap: 0;
}

.dropdown-item .team-info .team-name {
  color: var(--color-text);
  font-size: 0.875rem;
  margin-bottom: 0.125rem;
}

.dropdown-item .team-desc {
  font-size: 0.75rem;
  color: var(--color-text-light);
}

.check-icon {
  color: var(--primary-600);
  font-weight: bold;
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.25rem 0;
}

.action-item {
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.action-item:hover {
  color: var(--color-text);
  background: var(--color-background-soft);
}

.action-icon {
  font-size: 1rem;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .team-selector {
    min-width: 150px;
  }

  .team-name {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown-item .team-desc {
    display: none;
  }
}
</style>
