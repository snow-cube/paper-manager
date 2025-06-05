<template>
  <div class="form-group">
    <label class="form-label">{{ label }}</label>
    <div class="contribution-list">
      <div
        v-for="(author, index) in authorList"
        :key="index"
        class="contribution-item"
      >
        <span class="author-name">{{ author }}</span>
        <input
          v-model.number="contributions[index]"
          type="number"
          class="contribution-input"
          placeholder="0.0"
          step="0.01"
          min="0"
          max="1"
          @input="updateContributions"
        />
        <span class="contribution-percent">
          ({{ ((contributions[index] || 0) * 100).toFixed(1) }}%)
        </span>
      </div>
    </div>    <div class="contribution-summary">
      <span :class="{ 'contribution-error': totalContribution > 1 }">
        总贡献比例: {{ (totalContribution * 100).toFixed(1) }}%
      </span>
      <small class="form-hint">
        {{ hint }}
      </small>
      <div v-if="error" class="form-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: '作者贡献比例'
  },
  authors: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  error: {
    type: String,
    default: null
  },
  hint: {
    type: String,
    default: '贡献比例总和应为100%（1.0）。如不填写，系统将平均分配。'
  }
})

const emit = defineEmits(['update:modelValue'])

const contributions = ref([...props.modelValue])

// 计算作者列表 - 现在直接使用传入的数组
const authorList = computed(() => {
  if (!Array.isArray(props.authors)) return []
  return props.authors.filter(name => name && name.trim().length > 0)
})

// 计算总贡献比例
const totalContribution = computed(() => {
  return contributions.value.reduce((sum, contrib) => sum + (contrib || 0), 0)
})

// 监听作者列表变化，调整贡献比例数组
watch(authorList, (newAuthors) => {
  const newLength = newAuthors.length
  const oldLength = contributions.value.length

  if (newLength > oldLength) {
    // 添加新作者，初始化贡献比例
    for (let i = oldLength; i < newLength; i++) {
      contributions.value.push(0)
    }
  } else if (newLength < oldLength) {
    // 删除作者，移除对应的贡献比例
    contributions.value.splice(newLength)
  }

  emit('update:modelValue', [...contributions.value])
}, { immediate: true })

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  contributions.value = [...newValue]
}, { immediate: true })

const updateContributions = () => {
  // 确保所有值都是数字且在有效范围内
  contributions.value = contributions.value.map(val =>
    isNaN(val) ? 0 : Math.max(0, Math.min(1, val))
  )
  emit('update:modelValue', [...contributions.value])
}
</script>

<style scoped>
.contribution-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

.contribution-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--color-background-soft);
  border-radius: var(--border-radius);
  border: 1px solid var(--color-border);
}

.author-name {
  flex: 1;
  font-weight: 500;
  color: var(--color-text);
}

.contribution-input {
  width: 80px;
  padding: var(--space-sm) var(--space-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  text-align: center;
}

.contribution-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--primary-100);
}

.contribution-percent {
  font-size: var(--text-sm);
  color: var(--color-text-soft);
  min-width: 60px;
  text-align: right;
}

.contribution-summary {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--primary-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
}

.contribution-error {
  color: var(--error-600) !important;
  font-weight: 600;
}
</style>
