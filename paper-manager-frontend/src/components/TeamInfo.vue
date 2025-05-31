<template>
  <div class="team-info">
    <div class="info-section">
      <h3>基本信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>团队名称</label>
          <p>{{ team.name }}</p>
        </div>
        <div class="info-item">
          <label>团队描述</label>
          <p>{{ team.description || '暂无描述' }}</p>
        </div>
        <div class="info-item">
          <label>创建时间</label>
          <p>{{ formatDate(team.created_at) }}</p>
        </div>
        <div class="info-item">
          <label>最后更新</label>
          <p>{{ formatDate(team.updated_at) }}</p>
        </div>
        <div class="info-item">
          <label>成员数量</label>
          <p>{{ team.member_count || 0 }} 人</p>
        </div>
        <div class="info-item">
          <label>状态</label>
          <span :class="['status-badge', team.is_active ? 'active' : 'inactive']">
            {{ team.is_active ? '活跃' : '非活跃' }}
          </span>
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
import { ref } from 'vue';
import Modal from './Modal.vue';
import TeamForm from './TeamForm.vue';

const props = defineProps({
  team: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['updated']);

const showEditForm = ref(false);

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleTeamUpdated = (updatedTeam) => {
  showEditForm.value = false;
  emit('updated', updatedTeam);
};
</script>

<style scoped>
.team-info {
  max-width: 800px;
}

.info-section {
  margin-bottom: 2rem;
}

.info-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
}

.info-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.info-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.info-item label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.info-item p {
  margin: 0;
  color: #6b7280;
  line-height: 1.5;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.actions-section {
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
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
