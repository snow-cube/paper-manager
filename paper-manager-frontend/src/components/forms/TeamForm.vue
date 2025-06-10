<template>
  <div class="team-form">
    <div class="form-header">
      <h3>{{ team ? "编辑团队" : "创建团队" }}</h3>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">团队名称 *</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          placeholder="请输入团队名称"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="description">团队描述</label>
        <textarea
          id="description"
          v-model="formData.description"
          placeholder="请输入团队描述"
          class="form-control"
          rows="4"
        ></textarea>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div class="form-actions">
        <button
          type="button"
          @click="$emit('cancel')"
          class="btn btn-secondary"
        >
          取消
        </button>
        <button type="submit" :disabled="loading" class="btn btn-primary">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? "保存中..." : "保存" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from "vue";
import { createTeam, updateTeam } from "../../services/api.js";
import { useToast } from "../../composables/useToast.js";
import { useAuth } from "../../composables/useAuth.js";

const props = defineProps({
  team: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const { showToast } = useToast();
const { currentUser } = useAuth();
const loading = ref(false);
const error = ref("");

const formData = reactive({
  name: "",
  description: "",
});

// 监听 props 变化，初始化表单数据
watch(
  () => props.team,
  (newTeam) => {
    if (newTeam) {
      formData.name = newTeam.name || "";
      formData.description = newTeam.description || "";
    } else {
      formData.name = "";
      formData.description = "";
    }
  },
  { immediate: true }
);

const validateForm = () => {
  if (!formData.name.trim()) {
    error.value = "请输入团队名称";
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    let result;
    if (props.team) {
      // 编辑团队
      result = await updateTeam(props.team.id, formData);
      showToast("团队信息更新成功！", "success");
    } else {
      // 创建团队 - 添加creator_id字段
      const teamCreateData = {
        ...formData,
        creator_id: currentUser.value?.id,
      };

      if (!teamCreateData.creator_id) {
        error.value = "用户信息无效，请重新登录";
        return;
      }

      result = await createTeam(teamCreateData);
      showToast("团队创建成功！", "success");
    }

    emit("saved", result);
  } catch (err) {
    console.error("Team operation error:", err);
    error.value = err.response?.data?.detail || "操作失败，请稍后重试";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.team-form {
  padding: var(--space-lg);
}

.form-header {
  margin-bottom: var(--space-lg);
}

.form-header h3 {
  color: var(--color-heading);
  margin: 0;
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
  padding: 0.5rem;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  transition: border-color var(--transition-normal);
  font-family: inherit;
  height: var(--form-input-height);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
  height: auto;
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
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn-secondary {
  background: var(--gray-600);
  color: var(--white);
}

.btn-secondary:hover {
  background: var(--gray-700);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background: #5855eb;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
