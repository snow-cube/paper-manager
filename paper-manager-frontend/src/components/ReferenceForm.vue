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
  padding: 2rem;
  max-width: 600px;
}

.form-header {
  margin-bottom: 2rem;
}

.form-header h3 {
  color: #333;
  margin: 0;
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
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

select.form-control {
  cursor: pointer;
}

input[type="file"].form-control {
  padding: 0.5rem;
}

.form-help {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #6b7280;
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
  padding-top: 1rem;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #5b6470;
}

.btn-primary {
  background: #6366f1;
  color: white;
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
