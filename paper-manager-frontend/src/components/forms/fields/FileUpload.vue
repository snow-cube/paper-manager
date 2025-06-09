<template>
  <div class="form-group">
    <label v-if="label" class="form-label">{{ label }}</label>
    <div class="file-upload">
      <input
        :id="id"
        type="file"
        class="file-input"
        :accept="accept"
        @change="handleFileChange"
      />
      <label :for="id" class="file-label">
        <span class="file-icon">📄</span>
        <span class="file-text">
          {{ file ? file.name : placeholder }}
        </span>
      </label>

      <div v-if="file" class="file-info">
        <span class="file-size">{{ formatFileSize(file.size) }}</span>
        <button type="button" class="file-remove" @click="removeFile">
          ×
        </button>
      </div>
    </div>

    <small v-if="hint" class="form-hint">{{ hint }}</small>
    <div v-if="error" class="form-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  id: {
    type: String,
    default: 'file-input'
  },
  label: String,
  placeholder: {
    type: String,
    default: '选择文件或拖拽到此处'
  },
  accept: {
    type: String,
    default: '.pdf,.doc,.docx'
  },
  hint: String,
  error: String,
  modelValue: File
})

const emit = defineEmits(['update:modelValue', 'change'])

const file = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  file.value = newValue
})

const handleFileChange = (event) => {
  const selectedFile = event.target.files[0]
  file.value = selectedFile
  emit('update:modelValue', selectedFile)
  emit('change', selectedFile)
}

const removeFile = () => {
  file.value = null
  emit('update:modelValue', null)

  // 清空文件输入框
  const fileInput = document.getElementById(props.id)
  if (fileInput) fileInput.value = ''
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
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
  gap: var(--space-md);
  padding: var(--space-md);
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
  font-size: var(--space-lg);
}

.file-text {
  flex: 1;
  color: var(--color-text);
  font-size: var(--text-sm);
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--primary-50);
  border-radius: var(--border-radius);
  font-size: var(--text-xs);
}

.file-size {
  color: var(--color-text-light);
}

.file-remove {
  background: none;
  border: none;
  color: var(--error-600);
  cursor: pointer;
  font-size: var(--text-xl);
  padding: 0;
  width: var(--space-lg);
  height: var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.file-remove:hover {
  background: var(--error-100);
}

.form-error {
  color: var(--error-600);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
}
</style>
