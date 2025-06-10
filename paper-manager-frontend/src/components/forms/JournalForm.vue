<template>
  <div class="journal-form">
    <form @submit.prevent="handleSubmit" class="form">
      <!-- 基本信息 -->
      <div class="form-section">
        <h3 class="section-title">
          <span class="section-icon">📖</span>
          基本信息
        </h3>

        <FormField
          id="name"
          v-model="form.name"
          type="text"
          label="期刊名称"
          placeholder="请输入期刊名称"
          required
          :error="getFieldError('name')"
          @blur="markTouched('name')"
          @input="validateField('name')"
        />

        <FormField
          id="grade"
          v-model="form.grade"
          type="select"
          label="期刊等级"
          required
          :error="getFieldError('grade')"
          @change="markTouched('grade')"
        >
          <option value="">请选择期刊等级</option>
          <option
            v-for="grade in journalGrades"
            :key="grade.value"
            :value="grade.value"
          >
            {{ grade.label }}
          </option>
        </FormField>

        <FormField
          id="description"
          v-model="form.description"
          type="textarea"
          label="期刊描述"
          placeholder="请输入期刊描述（可选）"
          :rows="3"
          :error="getFieldError('description')"
          @blur="markTouched('description')"
        />
      </div>

      <!-- 表单操作 -->
      <div class="form-actions">
        <button type="button" @click="handleCancel" class="btn btn-secondary">
          取消
        </button>

        <button
          type="submit"
          :disabled="!isFormValid || submitting"
          class="btn btn-primary"
        >
          <span v-if="submitting" class="btn-spinner">⟳</span>
          <span v-else class="btn-icon">{{ isEdit ? "💾" : "➕" }}</span>
          {{ submitting ? "保存中..." : isEdit ? "更新期刊" : "创建期刊" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { FormField } from "./fields";
import { useJournals } from "../../composables/useJournals";
import { useToast } from "../../composables/useToast";

const props = defineProps({
  journal: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const { createJournal, updateJournal, fetchJournalGrades } = useJournals();
const { showToast } = useToast();

// 表单数据
const form = ref({
  name: "",
  grade: "",
  description: "",
});

// 验证状态
const errors = ref({});
const touched = ref({});
const submitting = ref(false);

// 期刊等级选项
const journalGrades = ref([]);

// 计算属性
const isEdit = computed(() => !!props.journal);

const isFormValid = computed(() => {
  return (
    form.value.name.trim() &&
    form.value.grade &&
    Object.keys(errors.value).length === 0
  );
});

// 验证方法
const validateField = (fieldName) => {
  const value = form.value[fieldName];

  switch (fieldName) {
    case "name":
      if (!value || !value.trim()) {
        errors.value.name = "期刊名称不能为空";
      } else if (value.trim().length < 2) {
        errors.value.name = "期刊名称至少需要2个字符";
      } else if (value.trim().length > 200) {
        errors.value.name = "期刊名称不能超过200个字符";
      } else {
        delete errors.value.name;
      }
      break;

    case "grade":
      if (!value) {
        errors.value.grade = "请选择期刊等级";
      } else {
        delete errors.value.grade;
      }
      break;

    case "description":
      if (value && value.length > 1000) {
        errors.value.description = "描述不能超过1000个字符";
      } else {
        delete errors.value.description;
      }
      break;
  }
};

const markTouched = (fieldName) => {
  touched.value[fieldName] = true;
  validateField(fieldName);
};

const getFieldError = (fieldName) => {
  return touched.value[fieldName] ? errors.value[fieldName] : null;
};

// 加载期刊等级列表
const loadJournalGrades = async () => {
  try {
    const response = await fetchJournalGrades();
    journalGrades.value = response.grades || [];
  } catch (error) {
    console.error("加载期刊等级失败:", error);
    showToast("加载期刊等级失败", "error");
  }
};

// 初始化表单
const initializeForm = () => {
  if (props.journal) {
    form.value = {
      name: props.journal.name || "",
      grade: props.journal.grade || "",
      description: props.journal.description || "",
    };
  } else {
    form.value = {
      name: "",
      grade: "",
      description: "",
    };
  }

  // 清空验证状态
  errors.value = {};
  touched.value = {};
};

// 表单提交
const handleSubmit = async () => {
  // 验证所有字段
  Object.keys(form.value).forEach(validateField);

  if (!isFormValid.value) {
    showToast("请检查表单错误", "error");
    return;
  }

  submitting.value = true;

  try {
    const formData = {
      name: form.value.name.trim(),
      grade: form.value.grade,
      description: form.value.description?.trim() || null,
    };

    if (isEdit.value) {
      await updateJournal(props.journal.id, formData);
      showToast("期刊更新成功", "success");
    } else {
      await createJournal(formData);
      showToast("期刊创建成功", "success");
    }

    emit("saved");
  } catch (error) {
    console.error("保存期刊失败:", error);
    showToast(isEdit.value ? "更新期刊失败" : "创建期刊失败", "error");
  } finally {
    submitting.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  emit("cancel");
};

// 监听 props 变化
watch(
  () => props.journal,
  () => {
    initializeForm();
  },
  { immediate: true }
);

// 初始化
onMounted(async () => {
  await loadJournalGrades();
  initializeForm();
});
</script>

<style scoped>
.journal-form {
  max-width: 100%;
  padding: var(--space-xl);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.form-section {
  background: var(--color-background-soft);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  border: 1px solid var(--color-border-light);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary-700);
  margin-bottom: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-left: var(--space-sm);
  border-left: 4px solid var(--primary-500);
}

.section-icon {
  font-size: var(--text-xl);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--color-border-light);
}

.btn {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius-lg);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 120px;
  justify-content: center;
}

.btn-secondary {
  background: var(--white);
  border: 2px solid var(--gray-300);
  color: var(--gray-700);
}

.btn-secondary:hover {
  border-color: var(--gray-400);
  background: var(--gray-50);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  border: 2px solid var(--primary-500);
  color: var(--white);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.btn-icon {
  font-size: var(--text-base);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .journal-form {
    padding: var(--space-lg);
  }

  .form-actions {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .journal-form {
    padding: var(--space-md);
  }

  .form-section {
    padding: var(--space-md);
  }

  .section-title {
    font-size: var(--text-base);
    padding-left: var(--space-xs);
  }
}
</style>
