<template>
  <div class="paper-form-container">
    <form @submit.prevent="handleSubmit" class="paper-form">
      <!-- 表单头部 -->
      <div class="form-header">
        <div class="title-wrapper">
          <!-- Mode switch next to title -->
          <ModeSwitch
            v-model="form.paper_type"
            :options="modeOptions"
            :disabled="isEdit"
            class="mode-switch"
          />
          <h2 class="form-title">
            <span class="title-icon">{{ isEdit ? "✏️" : "📝" }}</span>
            {{
              isEdit
                ? `编辑${form.paper_type === "literature" ? "文献" : "论文"}`
                : `添加新${form.paper_type === "literature" ? "文献" : "论文"}`
            }}
          </h2>
        </div>

        <!-- 验证状态摘要 -->
        <div
          v-if="hasErrors && Object.keys(touched).length > 0"
          class="validation-summary"
        >
          <div class="validation-summary-header">
            <span class="validation-icon">⚠️</span>
            <span class="validation-text"
              >表单有 {{ errorCount }} 个错误需要修正</span
            >
          </div>
          <ul class="validation-errors">
            <li
              v-for="error in getAllErrors"
              :key="error"
              class="validation-error-item"
            >
              {{ error }}
            </li>
          </ul>
        </div>
      </div>
      <!-- 表单内容区域 -->
      <div class="form-content">
        <!-- 论文类型选择 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">🎯</span>
              基本信息
            </h3>
          </div>

          <!-- 基本信息字段 -->
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
          />
          <FormField
            v-if="form.paper_type === 'literature'"
            id="author_names"
            v-model="form.author_names"
            type="textarea"
            label="作者"
            placeholder="请输入作者（用逗号分隔多个作者，例如：张三, 李四, 王五）"
            required
            :rows="2"
            :error="getFieldError('author_names')"
            @blur="markTouched('author_names')"
            @input="validateFieldRealtime('author_names', $event)"
          />

          <div class="form-row">
            <FormField
              id="keyword_names"
              v-model="form.keyword_names"
              type="text"
              label="关键词"
              placeholder="用逗号分隔多个关键词"
              :required="form.paper_type === 'published'"
              :error="getFieldError('keyword_names')"
              @blur="markTouched('keyword_names')"
              @input="validateFieldRealtime('keyword_names', $event)"
            />
            <CategorySelect
              id="category_id"
              v-model="form.category_id"
              label="分类"
              placeholder="请选择分类"
              :categories="categoryTree"
              :required="form.paper_type === 'published'"
              :error="getFieldError('category_id')"
              hint="选择合适的分类有助于论文的管理和检索"
              @change="markTouched('category_id')"
              @blur="markTouched('category_id')"
            />
          </div>
          <FormField
            id="doi"
            v-model="form.doi"
            label="DOI"
            placeholder="如：10.1000/xyz123"
            :error="getFieldError('doi')"
            @blur="markTouched('doi')"
            @input="validateFieldRealtime('doi', $event)"
          />

          <!-- 期刊和发表信息 -->
          <div class="form-row">
            <JournalSearchField
              id="journal_id"
              v-model="form.journal_id"
              label="期刊"
              placeholder="搜索期刊名称..."
              :required="form.paper_type === 'published'"
              :error="getFieldError('journal_id')"
              @blur="markTouched('journal_id')"
              @change="handleJournalChange"
            />

            <!-- 发表论文使用发表日期 -->
            <FormField
              v-if="form.paper_type === 'published'"
              id="publication_date"
              v-model="form.publication_date"
              type="date"
              label="发表日期"
              :error="getFieldError('publication_date')"
              @blur="markTouched('publication_date')"
              @change="
                validateFieldRealtime('publication_date', $event.target.value)
              "
            />

            <!-- 参考文献使用发表年份 -->
            <FormField
              v-else
              id="publication_year"
              v-model="form.publication_year"
              type="number"
              label="发表年份"
              placeholder="请输入发表年份"
              :min="1900"
              :max="new Date().getFullYear()"
              :error="getFieldError('publication_year')"
              @blur="markTouched('publication_year')"
              @input="validateFieldRealtime('publication_year', $event)"
            />
          </div>
        </div>

        <!-- 作者信息 -->
        <div v-if="form.paper_type === 'published'" class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">👥</span>
              作者信息
            </h3>
          </div>
          <FormField
            id="author_names"
            v-model="form.author_names"
            type="textarea"
            label="作者"
            placeholder="请输入作者（用逗号分隔多个作者，例如：张三, 李四, 王五）"
            required
            :rows="2"
            :error="getFieldError('author_names')"
            @blur="markTouched('author_names')"
            @input="validateFieldRealtime('author_names', $event)"
          />
          <div class="subsection-header">
            <button
              type="button"
              class="collapsible-tag"
              @click="isContributionsCollapsed = !isContributionsCollapsed"
              :class="{ collapsed: isContributionsCollapsed }"
            >
              <span class="tag-text">作者贡献比例</span>
              <span
                class="tag-arrow"
                :class="{ rotated: isContributionsCollapsed }"
                >›</span
              >
            </button>
          </div>
          <transition name="collapse">
            <div v-show="!isContributionsCollapsed" class="collapsible-content">
              <AuthorContributions
                :authors="authorList"
                v-model="authorContributions"
                :error="getFieldError('author_contributions')"
              />
            </div>
          </transition>
        </div>

        <!-- 摘要和文件上传 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">
              <span class="section-icon">📄</span>
              详细信息
            </h3>
          </div>

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
          />
          <FileUpload
            v-model="file"
            label="论文文件"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md"
            :error="getFieldError('file')"
            @change="validateFieldRealtime('file', $event)"
          />
        </div>
      </div>

      <!-- 表单操作区域 -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="handleReset">
          <span class="btn-icon">🔄</span>
          重置表单
        </button>
        <div class="submit-section">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="!isValidForm || submitting || hasErrors"
            :title="
              !isValidForm
                ? '请完成必填字段'
                : hasErrors
                ? '请先修正表单错误'
                : ''
            "
          >
            <span v-if="submitting" class="btn-spinner">⟳</span>
            <span v-else class="btn-icon">{{ isEdit ? "💾" : "➕" }}</span>
            {{ submitting ? "提交中..." : isEdit ? "更新论文" : "添加论文" }}
          </button>
          <div v-if="!isValidForm || hasErrors" class="submit-hint">
            <span v-if="hasErrors">请先修正 {{ errorCount }} 个错误</span>
            <span v-else-if="formCompleteness < 100"
              >请完成必填字段 ({{ formCompleteness }}%)</span
            >
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, watch, ref } from "vue";
import { onMounted } from "vue";
import {
  FormField,
  FileUpload,
  AuthorContributions,
  ModeSwitch,
  JournalSearchField,
  CategorySelect,
} from "./fields";
import { usePaperFormInitialization } from "../../composables/usePaperFormInitialization";
import { usePaperFormValidation } from "../../composables/usePaperFormValidation";
import { usePaperFormData } from "../../composables/usePaperFormData";
import { useCategories } from "../../composables/useCategories";
import { useCategoryEvents } from "../../composables/useCategoryEvents";
import { usePaperEvents } from "../../composables/usePaperEvents";
import { useJournals } from "../../composables/useJournals";
import { useTeam } from "../../composables/useTeam";

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

const emit = defineEmits(["saved", "cancel", "progress-update"]);

// 作者贡献比例折叠状态
const isContributionsCollapsed = ref(false);

// Mode switch options
const modeOptions = [
  { value: "literature", label: "参考文献" },
  { value: "published", label: "发表论文" },
];

// 使用组合式函数
const { categories, loadCategories, refreshCategories } = useCategories();
const { onCategoryUpdate } = useCategoryEvents();
const { triggerPaperUpdate } = usePaperEvents();
const { journals, fetchJournals } = useJournals();
const { currentTeam } = useTeam();
const { form, file, authorContributions, isEdit, initializeForm, resetForm } =
  usePaperFormInitialization(props);
const {
  errors,
  isValidForm,
  validateForm,
  validateFieldRealtime,
  markTouched,
  getFieldError,
  hasFieldError,
  resetValidation,
} = usePaperFormValidation(form, {
  // 使用扩展配置，支持更多文件格式
  fileConfig: "EXTENDED",
  paperType: "published", // 可以根据需要动态设置
});
const { submitting, handleSubmit: submitForm } = usePaperFormData(
  form,
  file,
  authorContributions
);

// 计算属性：作者列表
const authorList = computed(() => {
  if (!form.value.author_names) return [];
  return form.value.author_names
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
});

// 计算属性：分类树形结构
const categoryTree = computed(() => {
  if (!categories.value || categories.value.length === 0) {
    return [];
  }

  // 构建分类映射
  const categoryMap = new Map();
  const rootCategories = [];

  // 创建所有分类的映射
  categories.value.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // 构建树形结构
  categories.value.forEach((category) => {
    const categoryNode = categoryMap.get(category.id);
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children.push(categoryNode);
      } else {
        // 如果父分类不存在，则作为根分类
        rootCategories.push(categoryNode);
      }
    } else {
      // 根分类
      rootCategories.push(categoryNode);
    }
  });

  return rootCategories;
});

// 计算属性：验证错误相关
const hasErrors = computed(() => {
  return Object.keys(errors.value).some((key) => errors.value[key]);
});

const errorCount = computed(() => {
  return Object.keys(errors.value).filter((key) => errors.value[key]).length;
});

const getAllErrors = computed(() => {
  return Object.values(errors.value).filter((error) => error);
});

const touched = computed(() => {
  // 这里应该从验证组合式函数中获取 touched 状态
  // 暂时返回一个简单的对象
  return {};
});
const formCompleteness = computed(() => {
  if (!form.value) return 0;
  // 基本必填字段（不包括 paper_type，因为它是通过 switch 选择的）
  const requiredFields = ["title", "author_names"];
  if (form.value.paper_type === "published") {
    requiredFields.push("keyword_names", "journal_id");
  }

  const completedFields = requiredFields.filter((field) => {
    const value = form.value[field];
    return value && (typeof value === "string" ? value.trim() : true);
  });
  return Math.round((completedFields.length / requiredFields.length) * 100);
});

// 监听进度变化并发射事件
watch(
  formCompleteness,
  (newProgress) => {
    emit("progress-update", newProgress);
  },
  { immediate: true }
);

// 处理表单提交
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  try {
    const result = await submitForm(props, isEdit.value);

    // 触发论文更新事件，通知其他组件刷新数据
    const eventType = isEdit.value ? "edit" : "add";
    const paperType = form.value.paper_type;
    triggerPaperUpdate(eventType, paperType, result);

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

// 处理期刊选择
const handleJournalChange = (journal) => {
  console.log("Handling journal change:", journal); // 调试信息

  if (journal) {
    // 同时更新期刊ID和期刊名称字段
    form.value.journal_id = journal.id;
    form.value.journal = journal.name;
    console.log("Updated form journal fields:", {
      journal_id: form.value.journal_id,
      journal: form.value.journal,
    }); // 调试信息
    validateFieldRealtime("journal_id", journal.id);
  } else {
    form.value.journal_id = null;
    form.value.journal = null;
    console.log("Cleared journal fields"); // 调试信息
  }
};

// 根据论文类型加载合适的分类
const loadAppropriateCategories = async () => {
  if (form.value.paper_type === "literature") {
    // 文献使用参考文献分类（团队特定）
    await loadCategories("references", currentTeam.value?.id);
  } else {
    // 发表论文使用公共论文分类
    await loadCategories("papers");
  }
};

// 监听论文类型变化，重新加载分类
watch(
  () => form.value.paper_type,
  async (newType) => {
    if (newType) {
      await loadAppropriateCategories();
    }
  }
);

// 监听分类更新事件，自动刷新分类数据
onCategoryUpdate(async () => {
  await loadAppropriateCategories();
});

// 初始化表单
initializeForm();

// 初始加载分类和期刊
onMounted(async () => {
  // 加载期刊数据
  await fetchJournals();

  // 加载分类数据
  if (form.value.paper_type) {
    await loadAppropriateCategories();
  }
});
</script>

<style scoped>
/* 主容器样式 */
.paper-form-container {
  padding: 0;
  background: transparent;
}

.paper-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 100%;
  width: 100%;
  margin: 0;
  padding: var(--space-lg);
  background: var(--white);
  border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
  box-shadow: 0 12px 40px rgba(125, 108, 192, 0.2);
  position: relative;
  overflow: hidden;
}

/* 装饰性背景渐变 - 当有进度条时隐藏 */
.paper-form::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--primary-500),
    var(--primary-400),
    var(--secondary-400)
  );
  opacity: 0.8;
  display: none; /* 默认隐藏，因为现在由Modal的进度条替代 */
}

/* 表单头部样式 */
.form-header {
  text-align: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-md);
  position: relative;
}

.title-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 48px; /* Reduced height for cleaner look */
  padding: var(--space-sm) 0;
}

.mode-switch {
  position: absolute;
  left: var(--space-lg);
}

.form-header::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--primary-400),
    transparent
  );
  border-radius: 1px;
}

.form-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-heading);
  margin: 0 0 var(--space-sm) 0;
  background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  justify-content: center;
}

.title-icon {
  font-size: var(--text-xl);
  filter: none;
  -webkit-text-fill-color: initial;
}

/* 表单内容区域 */
.form-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* 表单分区样式 */
.form-section {
  background: var(--color-background-soft);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  border: 1px solid var(--color-border-light);
  position: relative;
  overflow: visible; /* 改为 visible 以允许下拉框显示 */
}

/* 为了保持装饰性渐变的效果，使用伪元素 */
.form-section::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-400), var(--secondary-400));
  opacity: 0.6;
  border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
}

.section-header {
  margin-bottom: var(--space-xs);
  position: relative;
}

.section-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-700);
  margin-bottom: var(--space-xs);
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding-left: var(--space-sm);
  border-left: 4px solid var(--primary-500);
  background: transparent;
}

.section-title::before {
  display: none;
}

.section-icon {
  font-size: var(--text-base);
  color: var(--primary-500);
  opacity: 1;
  filter: none;
}

/* 子标题样式 */
.subsection-header {
  margin: var(--space-xs) 0 var(--space-sm) 0;
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--space-sm);
}

.subsection-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-soft);
  margin: 0;
  text-transform: none;
  letter-spacing: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.subsection-title::before {
  content: "▶";
  font-size: var(--text-xs);
  color: var(--primary-400);
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

/* 可折叠标签样式 */
.collapsible-tag {
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  box-shadow: none;
}

.collapsible-tag:hover {
  border-color: var(--primary-300);
  background: var(--primary-25);
  color: var(--primary-700);
}

.collapsible-tag:active {
  transform: scale(0.98);
}

.collapsible-tag.collapsed {
  background: var(--color-background-soft);
  border-color: var(--color-border-light);
  color: var(--color-text-light);
}

.tag-text {
  font-weight: 500;
  letter-spacing: normal;
}

.tag-arrow {
  font-size: var(--text-sm);
  transition: transform 0.2s ease;
  color: var(--color-text-light);
}

.tag-arrow.rotated {
  transform: rotate(90deg);
}

/* 折叠内容样式 */
.collapsible-content {
  margin-top: var(--space-md);
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 400px;
}
/* 验证摘要美化 */
.validation-summary {
  background: linear-gradient(135deg, var(--error-50), var(--error-25));
  border: 1px solid var(--error-200);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  margin-top: var(--space-md);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

.validation-summary-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.validation-icon {
  font-size: var(--text-xl);
  padding: var(--space-sm);
  background: var(--error-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.validation-text {
  font-weight: 600;
  color: var(--error-700);
  font-size: var(--text-base);
}

.validation-errors {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-sm);
}

.validation-error-item {
  color: var(--error-600);
  font-size: var(--text-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--white);
  border-radius: var(--border-radius);
  border-left: 3px solid var(--error-400);
  box-shadow: var(--shadow-xs);
}

/* 表单提示文字 */
.form-hint {
  color: var(--color-text-soft);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
  font-style: italic;
  display: block;
  padding: var(--space-xs) var(--space-sm);
  background: var(--gray-50);
  border-radius: var(--border-radius);
  border-left: 2px solid var(--primary-300);
}

/* 表单行布局 */
.form-row {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}

.form-row:has(> *:nth-child(2)) {
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

/* 表单操作区域 */
.form-actions {
  display: flex;
  gap: var(--space-lg);
  justify-content: space-between;
  align-items: flex-start;
  padding-top: var(--space-lg);
  margin-top: var(--space-lg);
  position: relative;
}

/* 美化表单输入框样式 */
.paper-form :deep(.form-label) {
  font-size: var(--text-xs);
  font-weight: 600;
  margin-bottom: var(--space-xs);
  color: var(--primary-700);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.paper-form :deep(.required-indicator) {
  color: var(--error-500);
  font-weight: 700;
  font-size: inherit;
}

.paper-form :deep(.form-group) {
  margin-bottom: var(--space-md);
  position: relative;
  padding-left: var(--space-lg); /* 为左侧状态指示器留出空间 */
}

/* 输入框美化 */
.paper-form :deep(.form-input),
.paper-form :deep(.form-textarea),
.paper-form :deep(.form-select) {
  width: 100%;
  padding: 0.5rem; /* 使用与基础表单一致的padding */
  border: 2px solid var(--gray-200);
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  font-weight: 400;
  line-height: 1.5;
  color: var(--gray-800);
  background: var(--white);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  position: relative;
  height: var(--form-input-height); /* 确保使用统一高度 */
  box-sizing: border-box; /* 确保padding包含在高度内 */
}

.paper-form :deep(.form-input):hover,
.paper-form :deep(.form-textarea):hover,
.paper-form :deep(.form-select):hover {
  border-color: var(--primary-300);
  box-shadow: 0 4px 8px rgba(125, 108, 192, 0.08);
  transform: translateY(-1px);
}

.paper-form :deep(.form-input:focus),
.paper-form :deep(.form-textarea:focus),
.paper-form :deep(.form-select:focus) {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(125, 108, 192, 0.1),
    0 8px 16px rgba(125, 108, 192, 0.15);
  transform: translateY(-2px);
  /* 保持自定义箭头，使用 background-color 而非背景快捷属性 */
  background-color: var(--primary-25);
}

.paper-form :deep(.form-input:focus::placeholder),
.paper-form :deep(.form-textarea:focus::placeholder) {
  color: var(--primary-400);
  opacity: 0.8;
}

.paper-form :deep(.form-input::placeholder),
.paper-form :deep(.form-textarea::placeholder) {
  color: var(--gray-400);
  font-style: italic;
  transition: all 0.3s ease;
}

/* 文本域特殊样式 */
.paper-form :deep(.form-textarea) {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
  line-height: 1.6;
  height: auto; /* 覆盖统一高度设置，让文本域使用自己的高度 */
}

/* 选择框美化 */
.paper-form :deep(.form-select) {
  /* 隐藏原生箭头，确保自定义图标一致 */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--space-sm) center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: calc(var(--space-md) + 2em);
  cursor: pointer;
}
.paper-form :deep(.form-select::-ms-expand) {
  display: none;
}

/* 多选框样式 */
.paper-form :deep(.form-select[multiple]) {
  background-image: none;
  padding-right: var(--space-md);
  min-height: 120px;
}

.paper-form :deep(.form-select[multiple] option) {
  padding: var(--space-xs) var(--space-sm);
  margin: 2px 0;
  border-radius: var(--border-radius);
}

.paper-form :deep(.form-select[multiple] option:checked) {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
  color: var(--white);
}

/* 日期输入框特殊样式 */
.paper-form :deep(.form-input[type="date"]) {
  position: relative;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/%3e%3c/svg%3e");
  background-position: right var(--space-xs) center;
  background-repeat: no-repeat;
  background-size: 1.25em 1.25em;
  /* padding-right: calc(1.25em + var(--space-sm)); */
}

.paper-form :deep(.form-input[type="date"]:focus) {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%237d6cc0'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'/%3e%3c/svg%3e");
  background-position: right var(--space-xs) center;
}

/* 禁用状态样式 */
.paper-form :deep(.form-input:disabled),
.paper-form :deep(.form-textarea:disabled),
.paper-form :deep(.form-select:disabled) {
  background: var(--gray-100);
  border-color: var(--gray-200);
  color: var(--gray-400);
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.paper-form :deep(.form-input:disabled::placeholder),
.paper-form :deep(.form-textarea:disabled::placeholder) {
  color: var(--gray-300);
}

/* 表单提示样式美化 */
.paper-form :deep(.form-hint) {
  font-size: var(--text-xs);
  color: var(--gray-500);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-style: italic;
  line-height: 1.4;
}

.paper-form :deep(.form-hint::before) {
  content: "💡";
  font-style: normal;
  opacity: 0.7;
}

/* 错误状态美化 */
.paper-form :deep(.form-error) {
  font-size: var(--text-xs);
  color: var(--error-600);
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 500;
  animation: shake 0.3s ease-in-out;
}

.paper-form :deep(.form-error::before) {
  content: "⚠️";
  font-style: normal;
  animation: pulse 1s infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.form-actions::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--color-border),
    transparent
  );
}

.submit-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-sm);
}

.submit-hint {
  font-size: var(--text-xs);
  color: var(--color-text-soft);
  font-style: italic;
  padding: var(--space-xs) var(--space-sm);
  background: var(--warning-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--warning-200);
}

/* 按钮样式增强 */
.btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.btn::before {
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
  transition: left 0.6s;
}

.btn:hover::before {
  left: 100%;
}

.btn-icon {
  font-size: var(--text-sm);
  opacity: 0.9;
}

.btn-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-right: var(--space-xs);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.btn:disabled::before {
  display: none;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 错误状态样式增强 */
.paper-form :deep(.form-group.has-error .form-input),
.paper-form :deep(.form-group.has-error .form-textarea),
.paper-form :deep(.form-group.has-error .form-select) {
  border-color: var(--error-400);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1),
    0 4px 8px rgba(239, 68, 68, 0.05);
  background: linear-gradient(135deg, var(--error-25), var(--white));
  animation: errorPulse 0.5s ease-in-out;
}

.paper-form :deep(.form-group.has-error .form-input:focus),
.paper-form :deep(.form-group.has-error .form-textarea:focus),
.paper-form :deep(.form-group.has-error .form-select:focus) {
  border-color: var(--error-500);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15),
    0 8px 16px rgba(239, 68, 68, 0.1);
  background: var(--error-25);
}

.paper-form :deep(.form-group.has-error .form-label) {
  color: var(--error-600);
  animation: labelError 0.3s ease-in-out;
}

@keyframes errorPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes labelError {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-2px);
  }
  75% {
    transform: translateX(2px);
  }
}

/* 成功状态样式 */
.paper-form :deep(.form-group.has-success .form-input),
.paper-form :deep(.form-group.has-success .form-textarea),
.paper-form :deep(.form-group.has-success .form-select) {
  border-color: var(--success-400);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
  background: linear-gradient(135deg, var(--success-25), var(--white));
}

.paper-form :deep(.form-group.has-success .form-label) {
  color: var(--success-600);
}

/* 输入框内容为空时的样式 */
.paper-form :deep(.form-input:placeholder-shown),
.paper-form :deep(.form-textarea:placeholder-shown) {
  background: linear-gradient(135deg, var(--gray-25), var(--white));
}

/* 输入框聚焦时的标签动画 */
.paper-form :deep(.form-group:focus-within .form-label) {
  color: var(--primary-600);
  transform: translateY(-2px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 悬浮效果 - 针对模态框内的表单进行优化 */
.paper-form {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.paper-form:hover {
  box-shadow: 0 16px 48px rgba(125, 108, 192, 0.25);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .paper-form {
    padding: var(--space-xl);
  }
}

@media (max-width: 768px) {
  .paper-form {
    padding: var(--space-md);
    gap: var(--space-md);
    border-radius: var(--border-radius-lg);
  }

  .form-title {
    font-size: var(--text-xl);
    flex-direction: column;
    gap: var(--space-xs);
  }

  .form-row {
    grid-template-columns: 1fr !important;
    gap: var(--space-sm) !important;
  }

  .form-actions {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .submit-section {
    align-items: stretch;
  }
  .form-actions .btn {
    width: 100%;
    justify-content: center;
  }

  .form-section {
    padding: var(--space-sm);
  }
}

@media (max-width: 480px) {
  .paper-form {
    padding: var(--space-sm);
  }

  .form-header {
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-md);
  }

  .form-section {
    padding: var(--space-sm);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .paper-form-container {
    background: linear-gradient(135deg, var(--gray-900), var(--gray-800));
  }

  .paper-form {
    background: var(--gray-900);
    box-shadow: var(--shadow-dark);
  }
  .form-section {
    background: var(--gray-800);
    border-color: var(--gray-700);
  }

  .validation-summary {
    background: rgba(127, 29, 29, 0.1);
    backdrop-filter: blur(10px);
  }
}

/* 动画增强 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 聚焦状态增强 */
.paper-form :deep(.form-input:focus),
.paper-form :deep(.form-textarea:focus),
.paper-form :deep(.form-select:focus) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-focus), 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 表单分区动画 */
.form-section {
  animation: slideInLeft 0.5s ease-out;
  animation-fill-mode: both;
}

.form-section:nth-child(1) {
  animation-delay: 0.1s;
}
.form-section:nth-child(2) {
  animation-delay: 0.2s;
}
.form-section:nth-child(3) {
  animation-delay: 0.3s;
}

/* 现代化输入框效果 - 符合网站主题色彩 */
.paper-form :deep(.form-input):not(:placeholder-shown):valid,
.paper-form :deep(.form-textarea):not(:placeholder-shown):valid {
  background: linear-gradient(135deg, var(--primary-50), var(--white));
  border-color: var(--primary-300);
  box-shadow: 0 0 0 1px var(--primary-200);
}

.paper-form :deep(.form-input):not(:placeholder-shown):valid:focus,
.paper-form :deep(.form-textarea):not(:placeholder-shown):valid:focus {
  box-shadow: 0 0 0 4px rgba(125, 108, 192, 0.12),
    0 8px 16px rgba(125, 108, 192, 0.08);
  border-color: var(--primary-500);
  background: linear-gradient(135deg, var(--primary-50), var(--primary-25));
}

/* 输入框组合样式 */
.form-row .paper-form :deep(.form-group) {
  position: relative;
}

.form-row .paper-form :deep(.form-group):not(:last-child)::after {
  content: "";
  position: absolute;
  top: 50%;
  right: calc(-1 * var(--space-lg) / 2);
  transform: translateY(-50%);
  width: 2px;
  height: 60%;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--primary-200),
    transparent
  );
  opacity: 0.5;
}

/* 输入框状态指示器 */
.paper-form :deep(.form-group)::before {
  content: "";
  position: absolute;
  top: 0;
  left: var(--space-xs); /* 与左边有间距 */
  width: 4px; /* 稍微增加宽度使其更明显 */
  height: 100%;
  background: transparent;
  transition: all 0.3s ease;
  border-radius: var(--border-radius);
  z-index: 1;
}

.paper-form :deep(.form-group:focus-within)::before {
  background: linear-gradient(
    to bottom,
    var(--primary-500),
    var(--primary-400)
  );
  box-shadow: 0 0 8px rgba(125, 108, 192, 0.3);
}

.paper-form :deep(.form-group.has-error)::before {
  background: linear-gradient(to bottom, var(--error-500), var(--error-400));
  box-shadow: 0 0 8px rgba(255, 87, 34, 0.3);
}

/* 现代化选择框选项样式 */
.paper-form :deep(.form-select option) {
  padding: var(--space-sm);
  background: var(--white);
  color: var(--gray-800);
  border: none;
}

.paper-form :deep(.form-select option:hover),
.paper-form :deep(.form-select option:focus) {
  background: var(--primary-50);
  color: var(--primary-700);
}

/* 输入框内容长度指示器（针对有字数限制的字段） */
.paper-form :deep(.form-group[data-maxlength])::after {
  content: attr(data-current-length) "/" attr(data-maxlength);
  position: absolute;
  bottom: var(--space-xs);
  right: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--gray-400);
  background: var(--white);
  padding: 2px var(--space-xs);
  border-radius: var(--border-radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  pointer-events: none;
}

/* 响应式输入框优化 */
@media (max-width: 768px) {
  .paper-form :deep(.form-input),
  .paper-form :deep(.form-textarea),
  .paper-form :deep(.form-select) {
    padding: 0.5rem; /* 保持与桌面版一致的padding */
    font-size: var(--text-base);
  }

  .paper-form :deep(.form-label) {
    font-size: var(--text-sm);
  }

  .form-row .paper-form :deep(.form-group):not(:last-child)::after {
    display: none;
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

<style scoped>
/* Position mode switch */
.form-mode-switch {
  position: absolute;
  top: var(--space-md);
  left: var(--space-md);
  z-index: 10;
}
</style>
