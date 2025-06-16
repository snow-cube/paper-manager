<template>
  <div class="team-list">
    <div class="team-header">
      <h2>我的团队</h2>
      <button @click="showCreateForm = true" class="btn btn-primary">
        <span class="btn-icon">➕</span>
        创建团队
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>加载团队中...</p>
    </div>

    <div v-else-if="teams.length === 0" class="empty-state">
      <div class="empty-icon">👥</div>
      <h3>暂无团队</h3>
      <p>创建一个团队来开始协作管理文献</p>
      <button @click="showCreateForm = true" class="btn btn-primary">
        创建团队
      </button>
    </div>

    <div v-else class="teams-grid">
      <div
        v-for="team in teams"
        :key="team.id"
        class="team-card"
        @click="selectTeam(team)"
      >
        <div class="team-info">
          <h3 class="team-name">{{ team.name }}</h3>
          <p class="team-description">{{ team.description || "暂无描述" }}</p>
          <div class="team-meta">
            <span class="member-count">
              <span class="icon">👤</span>
              {{ team.member_count || 0 }} 人
            </span>
            <span class="created-date">
              创建于 {{ formatDate(team.created_at) }}
            </span>
          </div>
        </div>
        <div class="team-actions" @click.stop>
          <button
            @click="editTeam(team)"
            class="btn-icon-small"
            title="编辑团队"
          >
            ✏️
          </button>
          <button
            @click="deleteTeam(team)"
            class="btn-icon-small"
            title="删除团队"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑团队模态框 -->
    <Modal v-if="showCreateForm || editingTeam" @close="closeForm">
      <TeamForm
        :team="editingTeam"
        @saved="handleTeamSaved"
        @cancel="closeForm"
      />
    </Modal>
    <!-- 删除确认对话框 -->
    <ConfirmDialog
      :visible="!!deletingTeam"
      title="删除团队"
      :message="`确定要删除团队 &quot;${deletingTeam?.name}&quot; 吗？此操作不可撤销。`"
      @confirm="confirmDelete"
      @cancel="deletingTeam = null"
      @close="deletingTeam = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  getTeams,
  deleteTeam as deleteTeamApi,
} from "../../../services/api.js";
import { useToast } from "../../../composables/useToast.js";
import { useTeamEvents } from "../../../composables/useTeamEvents.js";
import LoadingSpinner from "../../base/LoadingSpinner.vue";
import Modal from "../../base/Modal.vue";
import TeamForm from "../../forms/TeamForm.vue";
import ConfirmDialog from "../../base/ConfirmDialog.vue";

const emit = defineEmits(["team-selected"]);

const { showToast } = useToast();
const { triggerTeamUpdate } = useTeamEvents();
const loading = ref(false);
const teams = ref([]);
const showCreateForm = ref(false);
const editingTeam = ref(null);
const deletingTeam = ref(null);

const loadTeams = async () => {
  loading.value = true;
  try {
    teams.value = await getTeams();
  } catch (error) {
    console.error("Failed to load teams:", error);
    showToast("加载团队失败", "error");
  } finally {
    loading.value = false;
  }
};

const selectTeam = (team) => {
  emit("team-selected", team);
};

const editTeam = (team) => {
  editingTeam.value = team;
};

const deleteTeam = (team) => {
  console.log("Delete team clicked:", team);
  deletingTeam.value = team;
  console.log("deletingTeam.value set to:", deletingTeam.value);
  console.log("deletingTeam reactive value:", deletingTeam);
};

const confirmDelete = async () => {
  if (!deletingTeam.value) return;

  console.log("Confirming delete for team:", deletingTeam.value);

  try {
    await deleteTeamApi(deletingTeam.value.id);
    teams.value = teams.value.filter((t) => t.id !== deletingTeam.value.id);
    showToast("团队删除成功", "success");

    // Trigger team update event to notify other components
    triggerTeamUpdate();
  } catch (error) {
    console.error("Failed to delete team:", error);
    showToast("删除团队失败", "error");
  } finally {
    deletingTeam.value = null;
  }
};

const handleTeamSaved = (savedTeam) => {
  if (editingTeam.value) {
    // 更新现有团队
    const index = teams.value.findIndex((t) => t.id === savedTeam.id);
    if (index !== -1) {
      teams.value[index] = savedTeam;
    }
  } else {
    // 添加新团队
    teams.value.unshift(savedTeam);
  }
  closeForm();
};

const closeForm = () => {
  showCreateForm.value = false;
  editingTeam.value = null;
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("zh-CN");
};

onMounted(() => {
  loadTeams();
});
</script>

<style scoped>
.team-list {
  padding: 0;
}

/* 团队列表头部 */
.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg) var(--space-xl);
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-25) 100%);
  border-bottom: 1px solid var(--primary-100);
}

.team-header h2 {
  color: var(--color-heading);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
  background: var(--white);
  gap: var(--space-md);
}

.loading-state p {
  color: var(--color-text-light);
  font-size: 1rem;
  margin: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-xl);
  background: var(--white);
  text-align: center;
}

.empty-state h3 {
  color: var(--color-heading);
  margin: var(--space-md) 0 var(--space-sm) 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.empty-state p {
  color: var(--color-text-light);
  margin: 0 0 var(--space-lg) 0;
  font-size: 1rem;
  max-width: 400px;
  line-height: 1.6;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-sm);
  opacity: 0.7;
}

/* 团队网格布局 */
.teams-grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  padding: var(--space-xl);
  background: var(--white);
}

/* 团队卡片样式 */
.team-card {
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-25) 100%);
  border: 2px solid var(--primary-100);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-bounce);
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(125, 108, 192, 0.05);
}

.team-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.team-card:hover {
  border-color: var(--primary-300);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(125, 108, 192, 0.12),
    0 4px 8px rgba(125, 108, 192, 0.08);
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-50) 100%);
}

.team-card:hover::before {
  opacity: 1;
}

.team-info {
  margin-bottom: var(--space-md);
  position: relative;
  z-index: 2;
}

.team-name {
  color: var(--color-heading);
  margin: 0 0 var(--space-xs) 0;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
}

.team-description {
  color: var(--color-text);
  margin: 0 0 var(--space-md) 0;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.8;
}

.team-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-light);
  gap: var(--space-sm);
}

.member-count {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  background: var(--primary-100);
  border-radius: var(--border-radius);
  color: var(--primary-700);
  font-weight: 600;
}

.member-count .icon {
  font-size: 0.9rem;
}

.created-date {
  opacity: 0.7;
}

/* 团队操作按钮 */
.team-actions {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  display: flex;
  gap: var(--space-xs);
  opacity: 0.6;
  transition: opacity var(--transition-normal);
  z-index: 3;
}

.team-card:hover .team-actions {
  opacity: 1;
}

.btn-icon-small {
  background: var(--white);
  border: 1px solid var(--primary-200);
  padding: var(--space-xs);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-normal);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  box-shadow: 0 2px 4px rgba(125, 108, 192, 0.08);
  font-size: 0.9rem;
}

.btn-icon-small:hover {
  background: var(--primary-50);
  border-color: var(--primary-300);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(125, 108, 192, 0.15);
}

/* 按钮样式 */
.btn {
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-bounce);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
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
  font-size: 0.9rem;
  transition: transform var(--transition-normal);
}

.btn:hover .btn-icon {
  transform: scale(1.1);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .teams-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-md);
    padding: var(--space-lg);
  }
}

@media (max-width: 768px) {
  .team-header {
    flex-direction: column;
    gap: var(--space-sm);
    padding: var(--space-md);
    text-align: center;
  }

  .teams-grid {
    grid-template-columns: 1fr;
    gap: var(--space-md);
    padding: var(--space-md);
  }

  .team-card {
    padding: var(--space-md);
  }

  .team-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
  }

  .empty-state {
    padding: var(--space-xl) var(--space-md);
  }
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.team-card {
  animation: fadeIn 0.4s ease-out;
}

.team-card:nth-child(even) {
  animation-delay: 0.1s;
}

.team-card:nth-child(3n) {
  animation-delay: 0.2s;
}
</style>
