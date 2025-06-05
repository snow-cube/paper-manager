<template>
  <form @submit.prevent="handleSubmit" class="paper-form">    <div class="form-header">
      <h2 class="form-title">
        {{ isEdit ? "编辑论文" : "添加论文" }}
      </h2>

      <!-- 表单进度指示器 -->
      <div class="form-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: formCompleteness + '%' }"
            :class="{
              'progress-low': formCompleteness < 50,
              'progress-medium': formCompleteness >= 50 && formCompleteness < 80,
              'progress-high': formCompleteness >= 80
            }"
          ></div>
        </div>
        <span class="progress-text">{{ formCompleteness }}% 完成</span>
      </div>

      <!-- 验证状态摘要 -->
      <div v-if="hasErrors && Object.keys(touched).length > 0" class="validation-summary">
        <div class="validation-summary-header">
          <span class="validation-icon">⚠️</span>
          <span class="validation-text">表单有 {{ errorCount }} 个错误需要修正</span>
        </div>
        <ul class="validation-errors">
          <li v-for="error in getAllErrors" :key="error" class="validation-error-item">
            {{ error }}
          </li>
        </ul>
      </div>
    </div>    <!-- 论文类型选择 -->
    <FormField
      id="paper_type"
      v-model="form.paper_type"
      type="select"
      label="论文类型"
      required
      :disabled="isEdit"
      :error="getFieldError('paper_type')"
      @blur="markTouched('paper_type')"
      @change="validateFieldRealtime('paper_type', $event.target.value)"
    >
      <option value="">请选择论文类型</option>
      <option value="literature">📚 文献（阅读的论文）</option>
      <option value="published">🎓 发表论文（自己发表的）</option>
    </FormField>
    <small v-if="isEdit" class="form-hint">编辑时无法修改论文类型</small>    <!-- 基本信息 -->
    <FormField
      id="title"
      v-model="form.title"
      type="text"
      label="论文标题"
      placeholder="请输入论文标题"
      required
      :error="getFieldError('title')"
      @blur="markTouched('title')"
      @input="validateFieldRealtime('title', $event)"
    />    <FormField
      id="author_names"
      v-model="form.author_names"
      type="textarea"
      label="作者"
      placeholder="请输入作者（用逗号分隔多个作者，例如：张三, 李四, 王五）"
      required
      :rows="3"
      :error="getFieldError('author_names')"
      @blur="markTouched('author_names')"
      @input="validateFieldRealtime('author_names', $event)"
    />

    <div class="form-row">
      <FormField
        id="keyword_names"
        v-model="form.keyword_names"
        type="text"
        :label="`关键词${form.paper_type === 'published' ? ' *' : ''}`"
        placeholder="用逗号分隔多个关键词"
        :required="form.paper_type === 'published'"
        :error="getFieldError('keyword_names')"
        @blur="markTouched('keyword_names')"
        @input="validateFieldRealtime('keyword_names', $event)"
      />

      <FormField
        id="category_ids"
        v-model="form.category_ids"
        type="select"
        label="分类"
        :multiple="form.paper_type === 'published'"
        @change="markTouched('category_ids')"
      >
        <option value="" v-if="form.paper_type === 'literature'">请选择分类</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </FormField>
    </div>
    <small class="form-hint" v-if="form.paper_type === 'published'">按住Ctrl键可选择多个分类</small>    <!-- 发表论文专有字段 -->
    <PublishedPaperFields
      v-if="form.paper_type === 'published'"
      v-model:journal="form.journal"
      v-model:publication-date="form.publication_date"
      v-model:doi="form.doi"
      v-model:corresponding-author="form.corresponding_author_name"
      :errors="{
        journal: getFieldError('journal'),
        publication_date: getFieldError('publication_date'),
        doi: getFieldError('doi'),
        corresponding_author_name: getFieldError('corresponding_author_name')
      }"
      @field-blur="markTouched"
      @field-input="validateFieldRealtime"
    />    <!-- 作者贡献比例 -->
    <AuthorContributions
      v-if="form.paper_type === 'published'"
      :authors="authorList"
      v-model="authorContributions"
      :error="getFieldError('author_contributions')"
    /><!-- 文献专有字段 -->
    <LiteratureFields
      v-if="form.paper_type === 'literature'"
      v-model:doi="form.doi"
      :errors="{ doi: getFieldError('doi') }"
      @field-blur="markTouched"
      @field-input="validateFieldRealtime"
    /><!-- 摘要 -->
    <FormField
      id="abstract"
      v-model="form.abstract"
      type="textarea"
      label="摘要"
      placeholder="请输入论文摘要"
      :rows="4"
      :error="getFieldError('abstract')"
      @blur="markTouched('abstract')"
      @input="validateFieldRealtime('abstract', $event)"
    />    <!-- 文件上传 -->
    <FileUpload
      v-model="file"
      label="论文文件"
      accept=".pdf,.doc,.docx"
      :error="getFieldError('file')"
      @change="validateFieldRealtime('file', $event)"
    />    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="handleReset">
        重置
      </button>
      <div class="submit-section">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!isValidForm || submitting || hasErrors"
          :title="!isValidForm ? '请完成必填字段' : hasErrors ? '请先修正表单错误' : ''"
        >
          <span v-if="submitting" class="btn-spinner">⟳</span>
          {{ submitting ? "提交中..." : (isEdit ? "更新论文" : "添加论文") }}
        </button>
        <div v-if="!isValidForm || hasErrors" class="submit-hint">
          <span v-if="hasErrors">请先修正 {{ errorCount }} 个错误</span>
          <span v-else-if="formCompleteness < 100">请完成必填字段 ({{ formCompleteness }}%)</span>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { computed } from "vue";
import FormField from "./forms/FormField.vue";
import FileUpload from "./forms/FileUpload.vue";
import AuthorContributions from "./forms/AuthorContributions.vue";
import PublishedPaperFields from "./forms/PublishedPaperFields.vue";
import LiteratureFields from "./forms/LiteratureFields.vue";
import { usePaperFormInitialization } from "../composables/usePaperFormInitialization";
import { usePaperFormValidation } from "../composables/usePaperFormValidation";
import { usePaperFormData } from "../composables/usePaperFormData";
import { useCategories } from "../composables/useCategories";

const props = defineProps({
  paper: {
    type: Object,
    default: null,
  },
  paperType: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["saved", "cancel"]);

// 使用组合式函数
const { categories } = useCategories();
const { form, file, authorContributions, isEdit, initializeForm, resetForm } = usePaperFormInitialization(props);
const {
  errors,
  isValidForm,
  validateForm,
  validateFieldRealtime,
  markTouched,
  getFieldError,
  hasFieldError,
  resetValidation
} = usePaperFormValidation(form);
const { submitting, handleSubmit: submitForm } = usePaperFormData(form, file, authorContributions);

// 计算属性：作者列表
const authorList = computed(() => {
  if (!form.value.author_names) return [];
  return form.value.author_names
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
});

// 计算表单完成度
const formCompleteness = computed(() => {
  if (!form.value) return 0;

  const requiredFields = ['title', 'author_names', 'paper_type'];
  if (form.value.paper_type === 'published') {
    requiredFields.push('keyword_names', 'journal');
  }

  const completedFields = requiredFields.filter(field => {
    const value = form.value[field];
    return value && (typeof value === 'string' ? value.trim() : true);
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
});

// 处理表单提交
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    const result = await submitForm(props, isEdit.value);
    emit("saved", result);
    if (!isEdit.value) {
      resetForm();
    }
  } catch (error) {
    console.error("提交失败:", error);
  }
};

// 处理重置
const handleReset = () => {
  resetForm();
  resetValidation();
};

// 初始化表单
initializeForm();
</script>

<style scoped>
.paper-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: var(--space-xl);
}

.form-header {
  text-align: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-md);
  border-bottom: 2px solid var(--color-border);
}

.form-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
}

.form-hint {
  color: var(--color-text-light);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
  font-style: italic;
  display: block;
}

.form-row {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}

.form-row:has(> *:nth-child(2)) {
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  align-items: flex-start;
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.submit-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
}

.submit-hint {
  font-size: var(--text-xs);
  color: var(--color-text-light);
  font-style: italic;
}

.btn-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 表单进度指示器 */
.form-progress {
  margin: var(--space-md) 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.progress-low {
  background: #f87171;
}

.progress-medium {
  background: #fbbf24;
}

.progress-high {
  background: #10b981;
}

.progress-text {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
  min-width: 70px;
  text-align: right;
}

/* 验证摘要样式 */
.validation-summary {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius);
  padding: var(--space-md);
  margin-top: var(--space-md);
}

.validation-summary-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.validation-icon {
  font-size: var(--text-lg);
}

.validation-text {
  font-weight: 500;
  color: #dc2626;
}

.validation-errors {
  list-style: none;
  padding: 0;
  margin: 0;
}

.validation-error-item {
  color: #dc2626;
  font-size: var(--text-sm);
  padding: var(--space-xs) 0;
  border-bottom: 1px solid #fecaca;
}

.validation-error-item:last-child {
  border-bottom: none;
}

/* 错误状态的表单字段 */
.form-group.has-error .form-input,
.form-group.has-error .form-textarea,
.form-group.has-error .form-select {
  border-color: var(--color-error);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.form-group.has-error .form-label {
  color: var(--color-error);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr !important;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
