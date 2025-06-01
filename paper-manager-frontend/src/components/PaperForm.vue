<template>
  <form @submit.prevent="handleSubmit" class="paper-form">
    <div class="form-header">
      <h2 class="form-title">
        {{ isEdit ? "编辑论文" : "添加论文" }}
      </h2>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="paper_type">论文类型 *</label>
        <select
          id="paper_type"
          v-model="form.paper_type"
          class="form-select"
          required
          :disabled="isEdit"
        >
          <option value="">请选择论文类型</option>
          <option value="literature">📚 文献（阅读的论文）</option>
          <option value="published">🎓 发表论文（自己发表的）</option>
        </select>
        <small v-if="isEdit" class="form-hint">编辑时无法修改论文类型</small>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="title">论文标题 *</label>
        <input
          id="title"
          v-model="form.title"
          class="form-input"
          placeholder="请输入论文标题"
          required
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="journal">期刊名称</label>
        <input
          id="journal"
          v-model="form.journal"
          class="form-input"
          placeholder="请输入期刊名称"
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="year">发表年份</label>
        <input
          id="year"
          v-model.number="form.year"
          class="form-input"
          type="number"
          placeholder="2024"
          min="1900"
          max="2099"
        />
      </div>
    </div>    <div class="form-row">
      <div class="form-group">
        <label class="form-label">作者</label>
        <input
          v-model="form.author_names"
          class="form-input"
          placeholder="请输入作者（用逗号分隔多个作者）"
        />
      </div>
      <div class="form-group">
        <label class="form-label" for="category">分类</label>
        <select v-model="form.category_ids" class="form-select" multiple>
          <option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.name }}
          </option>
        </select>
        <small class="form-hint">按住Ctrl键可选择多个分类</small>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">关键词</label>
        <input
          v-model="form.keyword_names"
          class="form-input"
          placeholder="用逗号分隔多个关键词"
        />
      </div>
    </div>

    <!-- 发表论文额外字段 -->
    <div v-if="form.paper_type === 'published'" class="form-section">
      <h3 class="section-title">发表信息</h3>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="volume">卷号</label>
          <input
            id="volume"
            v-model="form.volume"
            class="form-input"
            placeholder="如：Vol. 12"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="pages">页码</label>
          <input
            id="pages"
            v-model="form.pages"
            class="form-input"
            placeholder="如：123-145"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="impact_factor">影响因子</label>
          <input
            id="impact_factor"
            v-model.number="form.impact_factor"
            class="form-input"
            type="number"
            step="0.001"
            placeholder="如：3.421"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="doi">DOI</label>
          <input
            id="doi"
            v-model="form.doi"
            class="form-input"
            placeholder="如：10.1000/xyz123"
          />
        </div>
      </div>
    </div>

    <!-- 文献额外字段 -->
    <div v-if="form.paper_type === 'literature'" class="form-section">
      <h3 class="section-title">阅读信息</h3>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="doi">DOI</label>
          <input
            id="doi"
            v-model="form.doi"
            class="form-input"
            placeholder="如：10.1000/xyz123"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="url">链接</label>
          <input
            id="url"
            v-model="form.url"
            class="form-input"
            type="url"
            placeholder="如：https://example.com/paper"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="notes">阅读笔记</label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="form-textarea"
            placeholder="记录您的阅读心得和笔记..."
            rows="3"
          ></textarea>
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">摘要</label>
        <textarea
          v-model="form.abstract"
          class="form-textarea"
          placeholder="请输入论文摘要"
          rows="4"
        ></textarea>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">论文文件</label>
        <div class="file-upload">
          <input
            type="file"
            id="file-input"
            class="file-input"
            accept=".pdf,.doc,.docx"
            @change="onFileChange"
          />
          <label for="file-input" class="file-label">
            <span class="file-icon">📄</span>
            <span class="file-text">
              {{ file ? file.name : "选择文件或拖拽到此处" }}
            </span>
          </label>
          <div v-if="file" class="file-info">
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <button type="button" class="file-remove" @click="removeFile">
              ×
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn btn-secondary" @click="resetForm">
        重置
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="!form.title.trim() || submitting"
      >
        <span v-if="submitting" class="btn-spinner">⟳</span>
        {{ submitting ? "提交中..." : "添加论文" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import {
  getCategories,
  uploadPaper,
  createPaper,
  updatePaper,
  createReference,
  uploadReference,
  updateReference,
} from "../services/api";
import { useToast } from "../composables/useToast";
import { useTeam } from "../composables/useTeam";
import { useAuth } from "../composables/useAuth";

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

const { showToast } = useToast();
const { currentTeam } = useTeam();
const { currentUser } = useAuth();

const form = ref({
  title: "",
  journal: "",
  year: new Date().getFullYear(),
  author_names: "",
  category_ids: [],
  keyword_names: "",
  abstract: "",
  paper_type: props.paperType || "",
  doi: "",
  volume: "",
  pages: "",
  impact_factor: "",
  notes: "",
  url: "",
});

const categories = ref([]);
const file = ref(null);
const submitting = ref(false);

const isEdit = computed(() => !!props.paper);

// 初始化表单数据
const initializeForm = () => {
  if (props.paper) {
    // 编辑模式：填充现有数据
    Object.keys(form.value).forEach((key) => {
      if (props.paper[key] !== undefined) {
        form.value[key] = props.paper[key];
      }
    });

    // 转换特殊字段格式
    if (props.paper.authors && Array.isArray(props.paper.authors)) {
      form.value.author_names = props.paper.authors.map(a => a.name || a).join(', ');
    }

    if (props.paper.keywords && Array.isArray(props.paper.keywords)) {
      form.value.keyword_names = props.paper.keywords.map(k => k.name || k).join(', ');
    }

    if (props.paper.categories && Array.isArray(props.paper.categories)) {
      form.value.category_ids = props.paper.categories.map(c => c.id || c);
    }
  } else if (props.paperType) {
    // 新建模式：设置论文类型
    form.value.paper_type = props.paperType;
  }
};

// 监听 props 变化
watch(() => props.paper, initializeForm, { immediate: true });
watch(
  () => props.paperType,
  () => {
    if (!isEdit.value && props.paperType) {
      form.value.paper_type = props.paperType;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error("加载分类失败:", error);
    categories.value = [];
  }
});

const onFileChange = (e) => {
  file.value = e.target.files[0];
};

const removeFile = () => {
  file.value = null;
  const fileInput = document.getElementById("file-input");
  if (fileInput) fileInput.value = "";
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const resetForm = () => {
  form.value = {
    title: "",
    journal: "",
    year: new Date().getFullYear(),
    author_names: "",
    category_ids: [],
    keyword_names: "",
    abstract: "",
    paper_type: props.paperType || "",
    doi: "",
    volume: "",
    pages: "",
    impact_factor: "",
    notes: "",
    url: "",
  };
  removeFile();
};

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    showToast("请输入论文标题", "warning");
    return;
  }

  if (!form.value.paper_type) {
    showToast("请选择论文类型", "warning");
    return;
  }

  submitting.value = true;
  try {
    // 准备提交数据
    const submitData = { ...form.value };

    // 关联当前团队
    if (currentTeam.value && form.value.paper_type === 'literature') {
      submitData.team_id = currentTeam.value.id;
    }

    // 处理作者名称（转换为数组）
    if (typeof submitData.author_names === 'string') {
      submitData.author_names = submitData.author_names
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
    }

    // 处理关键词（转换为数组）
    if (typeof submitData.keyword_names === 'string') {
      submitData.keyword_names = submitData.keyword_names
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0);
    }

    // 确保category_ids是数组
    if (!Array.isArray(submitData.category_ids)) {
      submitData.category_ids = submitData.category_ids ? [submitData.category_ids] : [];
    }

    // 处理发表日期
    if (submitData.year) {
      submitData.publication_date = new Date(submitData.year, 0, 1).toISOString();
    }

    // 移除不需要的字段
    delete submitData.year;
    delete submitData.paper_type;

    if (isEdit.value) {
      // 编辑模式：根据论文类型选择不同的更新API
      let updatedItem;
      if (props.paperType === 'literature') {
        // 文献类型：使用参考文献API
        const referenceData = {
          title: submitData.title,
          authors: Array.isArray(submitData.author_names)
            ? submitData.author_names.join(', ')
            : submitData.author_names || '',
          doi: submitData.doi || null,
          team_id: currentTeam.value?.id,
          category_id: submitData.category_ids?.[0] || null,
          keyword_names: submitData.keyword_names || []
        };

        updatedItem = await updateReference(props.paper.id, referenceData);
        showToast("文献更新成功！", "success");
      } else {
        // 发表论文类型：使用论文API
        updatedItem = await updatePaper(props.paper.id, submitData);
        showToast("论文更新成功！", "success");
      }

      // 确保返回数据有必要的ID和team_id
      if (updatedItem) {
        updatedItem.id = props.paper.id;
        if (currentTeam.value && props.paperType === 'literature') {
          updatedItem.team_id = currentTeam.value.id;
        }
      }

      emit("saved", updatedItem);
    } else {
      // 新建模式：根据论文类型选择不同的API
      if (form.value.paper_type === 'literature') {
        // 文献类型：使用参考文献API
        const referenceData = {
          title: submitData.title,
          authors: Array.isArray(submitData.author_names)
            ? submitData.author_names.join(', ')
            : submitData.author_names || '',
          doi: submitData.doi || null,
          team_id: currentTeam.value?.id,
          category_id: submitData.category_ids?.[0] || null,
          keyword_names: submitData.keyword_names || [],
          created_by_id: currentUser.value?.id
        };

        console.log("创建参考文献数据:", referenceData);
        console.log("当前用户:", currentUser.value);
        console.log("当前团队:", currentTeam.value);

        let savedReference;
        if (file.value) {
          // 先创建参考文献，再上传文件
          savedReference = await createReference(referenceData);
          await uploadReference(savedReference.id, file.value);
          showToast("文献添加成功！", "success");
        } else {
          savedReference = await createReference(referenceData);
          showToast("文献添加成功！", "success");
        }

        // 确保savedReference有team_id
        if (savedReference && currentTeam.value) {
          savedReference.team_id = currentTeam.value.id;
        }

        // 发出保存事件，传递保存的引用数据
        emit("saved", savedReference);
      } else {
        // 发表论文类型：使用论文API
        let savedPaper;
        if (file.value) {
          // 有文件：使用 uploadPaper
          const formData = new FormData();

          // 添加论文数据
          Object.keys(submitData).forEach(key => {
            if (submitData[key] !== null && submitData[key] !== '') {
              if (Array.isArray(submitData[key])) {
                // 数组类型的字段
                submitData[key].forEach(item => {
                  formData.append(key, item);
                });
              } else {
                formData.append(key, submitData[key]);
              }
            }
          });

          formData.append("file", file.value);
          savedPaper = await uploadPaper(formData);
        } else {
          // 无文件：使用 createPaper
          savedPaper = await createPaper(submitData);
        }
        showToast("论文添加成功！", "success");

        // 发出保存事件，传递保存的论文数据
        emit("saved", savedPaper);
      }
      resetForm();
    }
  } catch (error) {
    console.error("提交论文失败:", error);
    console.error("详细错误信息:", error.response?.data);
    const errorMessage = error.response?.data?.detail || error.response?.data?.message || "提交失败，请重试";
    showToast(errorMessage, "error");
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.paper-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
}

.form-header {
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
}

.form-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: var(--color-bg-soft);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--color-primary);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-hint {
  color: var(--color-text-soft);
  font-size: 0.8rem;
  margin-top: 0.25rem;
  font-style: italic;
}

.form-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}
.form-row:has(.form-group:nth-child(2)) {
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
}

.form-label {
  font-weight: 500;
  color: var(--color-heading);
  font-size: 0.875rem;
}

.form-input,
.form-select,
.form-textarea {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.form-textarea {
  resize: vertical;
  min-height: 6rem;
  font-family: inherit;
}

.file-upload {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px dashed var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-background-soft);
}

.file-label:hover {
  border-color: var(--color-primary);
  background: var(--primary-50);
}

.file-icon {
  font-size: 1.5rem;
}

.file-text {
  flex: 1;
  color: var(--color-text);
  font-size: 0.875rem;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--primary-50);
  border-radius: var(--border-radius);
  font-size: 0.75rem;
}

.file-size {
  color: var(--color-text-light);
}

.file-remove {
  background: none;
  border: none;
  color: var(--error-600);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.file-remove:hover {
  background: var(--error-100);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-spinner {
  display: inline-block;
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
