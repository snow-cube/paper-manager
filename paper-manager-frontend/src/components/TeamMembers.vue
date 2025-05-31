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
  margin-bottom: 2rem;
}

.members-header h3 {
  color: #333;
  margin: 0;
  font-size: 1.25rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-card {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.member-card:hover {
  border-color: #e5e7eb;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.2rem;
  margin-right: 1rem;
}

.member-info {
  flex: 1;
}

.member-name {
  color: #333;
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
}

.member-email {
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.75rem;
}

.role-badge.admin {
  background: #fef3c7;
  color: #92400e;
}

.role-badge.member {
  background: #e0e7ff;
  color: #3730a3;
}

.join-date {
  color: #9ca3af;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.role-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.btn-remove {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-remove:hover {
  background: #fee2e2;
}

.add-member-form {
  padding: 2rem;
  max-width: 400px;
}

.add-member-form h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
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

.btn-primary:hover:not(:disabled) {
  background: #5855eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #5b6470;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1rem;
}
</style>
