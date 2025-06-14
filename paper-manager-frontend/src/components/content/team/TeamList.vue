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
      v-if="deletingTeam"
      title="删除团队"
      :message="`确定要删除团队 &quot;${deletingTeam.name}&quot; 吗？此操作不可撤销。`"
      @confirm="confirmDelete"
      @cancel="deletingTeam = null"
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
  deletingTeam.value = team;
};

const confirmDelete = async () => {
  if (!deletingTeam.value) return;

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
  padding: var(--space-lg);
}

.team-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.team-header h2 {
  color: var(--color-heading);
  margin: 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-2xl) var(--space-md);
  color: var(--color-text-light);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-md);
}

.teams-grid {
  display: grid;
  gap: var(--space-lg);
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.team-card {
  background: var(--white);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  cursor: pointer;
  transition: all var(--transition-bounce);
  position: relative;
}

.team-card:hover {
  border-color: var(--primary-500);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.team-info {
  margin-bottom: var(--space-md);
}

.team-name {
  color: #333;
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--text-xl);
}

.team-description {
  color: #666;
  margin: 0 0 var(--space-md) 0;
  font-size: var(--text-sm);
  line-height: 1.4;
}

.team-meta {
  display: flex;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: #888;
}

.member-count {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.team-actions {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  display: flex;
  gap: var(--space-sm);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.team-card:hover .team-actions {
  opacity: 1;
}

.btn-icon-small {
  background: none;
  border: none;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-icon-small:hover {
  background: rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #6366f1;
  color: white;
}

.btn-primary:hover {
  background: #5855eb;
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}
</style>
