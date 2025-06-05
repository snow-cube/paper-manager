<template>
  <div class="reference-form">
    <div class="form-header">
      <h3>{{ reference ? "编辑参考文献" : "添加参考文献" }}</h3>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="title">标题 *</label>
        <input
          id="title"
          v-model="formData.title"
          type="text"
          required
          placeholder="请输入文献标题"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="authors">作者 *</label>
        <input
          id="authors"
          v-model="formData.authors"
          type="text"
          required
          placeholder="请输入作者（如：张三, 李四, 王五）"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="doi">DOI</label>
        <input
          id="doi"
          v-model="formData.doi"
          type="text"
          placeholder="请输入DOI"
          class="form-control"
        />
      </div>

      <div class="form-group">
        <label for="category_id">分类</label>
        <select
          id="category_id"
          v-model="formData.category_id"
          class="form-control"
        >
          <option value="">请选择分类</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="keywords">关键词</label>
        <input
          id="keywords"
          v-model="keywordsInput"
          type="text"
          placeholder="请输入关键词，用逗号分隔"
          class="form-control"
        />
        <small class="form-help">使用逗号分隔多个关键词</small>
      </div>

      <div class="form-group">
        <label for="file">文献文件</label>
        <input
          id="file"
          ref="fileInput"
          type="file"
          accept=".pdf,.doc,.docx"
          class="form-control"
          @change="handleFileChange"
        />
        <small class="form-help">支持 PDF、DOC、DOCX 格式</small>
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
import { ref, reactive, watch, onMounted } from "vue";
import {
  createReference,
  updateReference,
  uploadReference,
  getCategories,
} from "../services/api.js";
import { useToast } from "../composables/useToast.js";

const props = defineProps({
  reference: {
    type: Object,
    default: null,
  },
  team: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const { showToast } = useToast();
const loading = ref(false);
const error = ref("");
const categories = ref([]);
const fileInput = ref(null);
const selectedFile = ref(null);
const keywordsInput = ref("");

const formData = reactive({
  title: "",
  authors: "",
  doi: "",
  category_id: "",
  team_id: 0,
  keyword_names: [],
});

// 监听 props 变化，初始化表单数据
watch(
  () => props.reference,
  (newReference) => {
    if (newReference) {
      formData.title = newReference.title || "";
      formData.authors = newReference.authors || "";
      formData.doi = newReference.doi || "";
      formData.category_id = newReference.category_id || "";
      formData.team_id = props.team.id;
      keywordsInput.value = newReference.keywords?.join(", ") || "";
    } else {
      formData.title = "";
      formData.authors = "";
      formData.doi = "";
      formData.category_id = "";
      formData.team_id = props.team.id;
      keywordsInput.value = "";
    }
  },
  { immediate: true }
);

// 监听关键词输入变化
watch(keywordsInput, (newValue) => {
  formData.keyword_names = newValue
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0);
});

const loadCategories = async () => {
  try {
    categories.value = await getCategories();
  } catch (error) {
    console.error("Failed to load categories:", error);
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 检查文件大小（限制为50MB）
    if (file.size > 50 * 1024 * 1024) {
      error.value = "文件大小不能超过50MB";
      fileInput.value.value = "";
      return;
    }
    selectedFile.value = file;
  }
};

const validateForm = () => {
  if (!formData.title.trim()) {
    error.value = "请输入文献标题";
    return false;
  }

  if (!formData.authors.trim()) {
    error.value = "请输入作者信息";
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

    if (props.reference) {
      // 编辑文献
      const updateData = {
        title: formData.title,
        authors: formData.authors,
        doi: formData.doi || undefined,
        category_id: formData.category_id || undefined,
        keyword_names: formData.keyword_names,
      };
      result = await updateReference(props.reference.id, updateData);
      showToast("参考文献更新成功！", "success");
    } else {
      // 创建文献
      result = await createReference(formData);
      showToast("参考文献创建成功！", "success");
    }

    // 如果有文件，上传文件
    if (selectedFile.value) {
      try {
        await uploadReference(result.id, selectedFile.value);
        showToast("文件上传成功！", "success");
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        showToast("文件上传失败，但文献信息已保存", "warning");
      }
    }

    emit("saved", result);
  } catch (err) {
    console.error("Reference operation error:", err);

    if (
      err.response?.status === 400 &&
      err.response.data?.detail?.includes("DOI")
    ) {
      error.value = "DOI已存在，请检查输入";
    } else {
      error.value = err.response?.data?.detail || "操作失败，请稍后重试";
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategories();
});
</script>

<style scoped>
.reference-form {
  padding: var(--space-xl);
  max-width: 600px;
}

.form-header {
  margin-bottom: var(--space-xl);
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

.form-control {  width: 100%;
  padding: var(--space-md);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-base);
  transition: border-color var(--transition-normal);
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

select.form-control {
  cursor: pointer;
}

input[type="file"].form-control {
  padding: var(--space-sm);
}

.form-help {
  display: block;
  margin-top: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.error-message {
  background: var(--error-50);
  color: var(--error-600);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-md);
  font-size: var(--text-sm);
}

.form-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: flex-end;
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: var(--space-md) var(--space-lg);
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
  background: var(--primary-600);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-spinner {
  width: var(--space-sm);
  height: var(--space-sm);
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
