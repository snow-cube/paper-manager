<template>
  <div class="team-members">
    <div class="members-header">
      <h3>团队成员</h3>
      <button @click="showAddMemberForm = true" class="btn btn-primary">
        <span class="btn-icon">➕</span>
        添加成员
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <LoadingSpinner />
      <p>加载成员中...</p>
    </div>

    <div v-else-if="members.length === 0" class="empty-state">
      <div class="empty-icon">👤</div>
      <h3>暂无成员</h3>
      <p>添加团队成员来开始协作</p>
    </div>

    <div v-else class="members-list">
      <div
        v-for="member in members"
        :key="member.id"
        class="member-card"
      >
        <div class="member-avatar">
          {{ member.full_name.charAt(0).toUpperCase() }}
        </div>
        <div class="member-info">
          <h4 class="member-name">{{ member.full_name }}</h4>
          <p class="member-email">{{ member.email }}</p>
          <div class="member-meta">
            <span :class="['role-badge', member.role.toLowerCase()]">
              {{ getRoleLabel(member.role) }}
            </span>
            <span class="join-date">
              加入于 {{ formatDate(member.joined_at) }}
            </span>
          </div>
        </div>
        <div class="member-actions">
          <select
            v-if="canManageMembers && !member.is_creator"
            :value="member.role"
            @change="updateMemberRole(member, $event.target.value)"
            class="role-select"
          >
            <option value="MEMBER">普通成员</option>
            <option value="ADMIN">管理员</option>
          </select>
          <button
            v-if="canManageMembers && !member.is_creator"
            @click="removeMember(member)"
            class="btn-remove"
            title="移除成员"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 添加成员模态框 -->
    <Modal v-if="showAddMemberForm" @close="showAddMemberForm = false">
      <div class="add-member-form">
        <h3>添加团队成员</h3>
        <form @submit.prevent="addMember">
          <div class="form-group">
            <label for="username">用户名</label>
            <input
              id="username"
              v-model="newMemberUsername"
              type="text"
              required
              placeholder="请输入用户名"
              class="form-control"
            />
          </div>
          <div v-if="addMemberError" class="error-message">
            {{ addMemberError }}
          </div>
          <div class="form-actions">
            <button
              type="button"
              @click="showAddMemberForm = false"
              class="btn btn-secondary"
            >
              取消
            </button>
            <button
              type="submit"
              :disabled="addingMember"
              class="btn btn-primary"
            >
              {{ addingMember ? '添加中...' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- 移除成员确认对话框 -->
    <ConfirmDialog
      v-if="removingMember"
      title="移除成员"
      :message="`确定要将 ${removingMember.full_name} 从团队中移除吗？`"
      @confirm="confirmRemoveMember"
      @cancel="removingMember = null"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getTeamMembers, addTeamMember, removeTeamMember, updateMemberRole as updateMemberRoleAPI } from '../services/api.js';
import { useAuth } from '../composables/useAuth.js';
import { useToast } from '../composables/useToast.js';
import LoadingSpinner from './LoadingSpinner.vue';
import Modal from './Modal.vue';
import ConfirmDialog from './ConfirmDialog.vue';

const props = defineProps({
  team: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['member-added', 'member-removed']);

const { currentUser } = useAuth();
const { showToast } = useToast();

const loading = ref(false);
const members = ref([]);
const showAddMemberForm = ref(false);
const newMemberUsername = ref('');
const addingMember = ref(false);
const addMemberError = ref('');
const removingMember = ref(null);

const canManageMembers = computed(() => {
  const currentMember = members.value.find(m => m.id === currentUser.value?.id);
  return currentMember?.role === 'ADMIN' || currentMember?.is_creator;
});

const loadMembers = async () => {
  loading.value = true;
  try {
    members.value = await getTeamMembers(props.team.id);
  } catch (error) {
    console.error('Failed to load team members:', error);
    showToast('加载团队成员失败', 'error');
  } finally {
    loading.value = false;
  }
};

const addMember = async () => {
  if (!newMemberUsername.value.trim()) {
    addMemberError.value = '请输入用户名';
    return;
  }

  addingMember.value = true;
  addMemberError.value = '';

  try {
    await addTeamMember(props.team.id, newMemberUsername.value.trim());
    await loadMembers(); // 重新加载成员列表
    showToast('成员添加成功', 'success');
    showAddMemberForm.value = false;
    newMemberUsername.value = '';
    emit('member-added');
  } catch (error) {
    console.error('Failed to add member:', error);
    if (error.response?.status === 404) {
      addMemberError.value = '用户不存在';
    } else if (error.response?.status === 400) {
      addMemberError.value = '用户已是团队成员';
    } else {
      addMemberError.value = '添加成员失败，请稍后重试';
    }
  } finally {
    addingMember.value = false;
  }
};

const removeMember = (member) => {
  removingMember.value = member;
};

const confirmRemoveMember = async () => {
  if (!removingMember.value) return;

  try {
    await removeTeamMember(props.team.id, removingMember.value.id);
    members.value = members.value.filter(m => m.id !== removingMember.value.id);
    showToast('成员移除成功', 'success');
    emit('member-removed');
  } catch (error) {
    console.error('Failed to remove member:', error);
    showToast('移除成员失败', 'error');
  } finally {
    removingMember.value = null;
  }
};

const updateMemberRole = async (member, newRole) => {
  try {
    await updateMemberRoleAPI(props.team.id, member.id, newRole);
    // 更新本地状态
    const memberIndex = members.value.findIndex(m => m.id === member.id);
    if (memberIndex !== -1) {
      members.value[memberIndex].role = newRole;
    }
    showToast('角色更新成功', 'success');
  } catch (error) {
    console.error('Failed to update member role:', error);
    showToast('角色更新失败', 'error');
  }
};

const getRoleLabel = (role) => {
  switch (role) {
    case 'ADMIN':
      return '管理员';
    case 'MEMBER':
      return '普通成员';
    default:
      return role;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

onMounted(() => {
  loadMembers();
});
</script>

<style scoped>
.team-members {
  max-width: 800px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.members-header h3 {
  color: var(--color-heading);
  margin: 0;
  font-size: var(--text-xl);
}

.loading-state,
.empty-state {
  text-align: center;
  padding: var(--space-3xl) var(--space-md);
  color: var(--color-text-light);
}

.empty-icon {
  font-size: var(--space-4xl);
  margin-bottom: var(--space-md);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.member-card {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  background: var(--color-bg-soft);
  border-radius: var(--border-radius);
  border: 2px solid transparent;
  transition: all var(--transition-normal);
}

.member-card:hover {
  border-color: var(--color-border);
  background: var(--white);
  box-shadow: var(--shadow-md);
}

.member-avatar {
  width: var(--space-3xl);
  height: var(--space-3xl);
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-lg);
  margin-right: var(--space-md);
}

.member-info {
  flex: 1;
}

.member-name {
  color: var(--color-heading);
  margin: 0 0 var(--space-xs) 0;
  font-size: var(--text-lg);
}

.member-email {
  color: var(--color-text-light);
  margin: 0 0 var(--space-sm) 0;
  font-size: var(--text-sm);
}

.member-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-xs);
}

.role-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: 9999px;
  font-weight: 600;
  font-size: var(--text-xs);
}

.role-badge.admin {
  background: var(--warning-100);
  color: var(--warning-800);
}

.role-badge.member {
  background: var(--primary-100);
  color: var(--primary-800);
}

.join-date {
  color: var(--color-text-light);
}

.member-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.role-select {
  padding: var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  background: var(--white);
  font-size: var(--text-sm);
}

.btn-remove {
  background: none;
  border: none;
  padding: var(--space-sm);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color var(--transition-normal);
}

.btn-remove:hover {
  background: var(--error-100);
}

.add-member-form {
  padding: var(--space-xl);
  max-width: 400px;
}

.add-member-form h3 {
  margin: 0 0 var(--space-lg) 0;
  color: var(--color-heading);
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-sm);
  color: var(--color-heading);
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  transition: border-color var(--transition-normal);
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.error-message {
  background: var(--error-50);
  color: var(--error-600);
  padding: 0.75rem;
  border-radius: var(--border-radius);
  margin-bottom: var(--space-md);
  font-size: var(--text-sm);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
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

.btn-primary {
  background: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-600);
}

.btn-secondary {
  background: var(--gray-600);
  color: var(--white);
}

.btn-secondary:hover {
  background: var(--gray-700);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1rem;
}
</style>
