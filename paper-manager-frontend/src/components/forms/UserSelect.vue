<template>
  <div class="user-select">
    <select
      v-model="modelValue"
      class="form-select"
      multiple
      :disabled="loading"
    >
      <option v-if="loading" disabled>加载作者中...</option>
      <option v-else-if="error" disabled>{{ error }}</option>
      <option v-else-if="users.length === 0" disabled>暂无作者数据</option>
      <option v-else v-for="u in users" :key="u.id" :value="u.id">
        {{ u.name }}
      </option>
    </select>
    <div v-if="error" class="user-select-error">
      <small class="error-text">{{ error }}</small>
      <button type="button" class="retry-btn" @click="loadUsers">
        🔄 重试
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getUsers } from "../../services/api";

const users = ref([]);
const loading = ref(true);
const error = ref(null);
const modelValue = defineModel();

const loadUsers = async () => {
  loading.value = true;
  error.value = null;
  try {
    const data = await getUsers();
    users.value = data || [];
  } catch (err) {
    console.error('加载作者失败:', err);
    error.value = err.message || '加载作者失败';
    users.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.user-select {
  position: relative;
}

.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-select-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: var(--error-50);
  border: 1px solid var(--error-200);
  border-radius: var(--border-radius);
}

.error-text {
  color: var(--error-600);
  font-size: var(--text-xs);
}

.retry-btn {
  background: none;
  border: none;
  color: var(--error-600);
  cursor: pointer;
  font-size: var(--text-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius);
  transition: background-color var(--transition-normal);
}

.retry-btn:hover {
  background: var(--error-100);
}
</style>
