<template>
  <div class="form-group" :class="{ 'has-error': error }">
    <div class="form-header">
      <div class="header-main">
        <div class="header-left">
          <div class="form-description">
            贡献比例总和应为100%，选择一位通讯作者负责论文联络
          </div>
        </div>
        <div class="form-actions">
          <!-- 通讯作者状态指示 -->
          <div v-if="correspondingAuthor" class="corresponding-status">
            <span class="status-label">通讯:</span>
            <span class="status-text">{{ correspondingAuthor }}</span>
          </div>

          <button
            type="button"
            class="btn-auto-distribute"
            @click="autoDistribute"
            :disabled="authorList.length === 0"
            title="平均分配贡献比例"
          >
            <span class="btn-icon">⚖️</span>
            平均分配
          </button>
          <button
            type="button"
            class="btn-clear"
            @click="clearAll"
            :disabled="authorList.length === 0"
            title="清空所有贡献比例"
          >
            <span class="btn-icon">🗑️</span>
            清空
          </button>
        </div>
      </div>
      <!-- 第二行：总贡献比例进度条 + 错误信息 -->
      <div class="header-secondary">
        <div
          class="contribution-status"
          :class="{
            'status-complete': Math.abs(totalContribution - 1) < 0.001,
            'status-over': totalContribution > 1,
            'status-under': totalContribution < 1 && totalContribution > 0,
          }"
        >
          <span class="status-text">
            {{ (totalContribution * 100).toFixed(1) }}%
          </span>
          <div class="status-progress">
            <div
              class="status-bar"
              :style="{ width: `${Math.min(totalContribution * 100, 100)}%` }"
              :class="{
                'bar-complete': Math.abs(totalContribution - 1) < 0.001,
                'bar-over': totalContribution > 1,
                'bar-under': totalContribution < 1 && totalContribution > 0,
              }"
            ></div>
          </div>
        </div>

        <!-- 错误信息和提示 - 与进度条同行 -->
        <div
          v-if="error || remainingPercentage !== 0"
          class="header-info-inline"
        >
          <div v-if="error" class="form-error-inline">
            <span class="error-icon">❌</span>
            {{ error }}
          </div>
          <div
            v-else-if="remainingPercentage !== 0"
            class="remaining-info-inline"
          >
            <span v-if="remainingPercentage > 0" class="remaining-positive">
              还需分配: {{ (remainingPercentage * 100).toFixed(1) }}%
            </span>
            <span v-else class="remaining-negative">
              超出: {{ (Math.abs(remainingPercentage) * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="contribution-list">
      <div class="contribution-container">
        <div
          v-for="(author, index) in authorList"
          :key="`${author}-${index}`"
          class="contribution-item"
          :class="{
            'is-focused': focusedIndex === index,
            'has-value': contributions[index] > 0,
            'is-over-limit': contributions[index] > 1,
            'is-corresponding-author': correspondingAuthor === author,
          }"
        >
          <div class="author-section">
            <div class="author-avatar">
              {{ getAuthorInitials(author) }}
            </div>
            <div class="author-info">
              <span class="author-name">{{ author }}</span>
              <div class="corresponding-author-wrapper">
                <label
                  class="corresponding-checkbox"
                  :title="getCorrespondingTooltip(author)"
                >
                  <input
                    type="checkbox"
                    :checked="correspondingAuthor === author"
                    @change="setCorrespondingAuthor(author)"
                    class="checkbox-input"
                  />
                  <span class="checkbox-label">通讯作者</span>
                  <span
                    class="corresponding-badge"
                    :class="{ 'badge-visible': correspondingAuthor === author }"
                    >✉️</span
                  >
                </label>
              </div>
            </div>
          </div>

          <div class="input-section">
            <div class="input-wrapper">
              <input
                v-model.number="contributions[index]"
                type="number"
                class="contribution-input"
                placeholder="0.0"
                step="0.01"
                min="0"
                max="1"
                @input="updateContributions"
                @focus="focusedIndex = index"
                @blur="focusedIndex = -1"
                @keydown.enter="nextInput(index)"
                @keydown.up="adjustValue(index, 0.01)"
                @keydown.down="adjustValue(index, -0.01)"
              />
              <div class="input-controls">
                <button
                  type="button"
                  class="control-btn control-up"
                  @click="adjustValue(index, 0.01)"
                  tabindex="-1"
                >
                  ▲
                </button>
                <button
                  type="button"
                  class="control-btn control-down"
                  @click="adjustValue(index, -0.01)"
                  tabindex="-1"
                >
                  ▼
                </button>
              </div>
            </div>

            <div class="contribution-display">
              <span class="contribution-percent">
                {{ ((contributions[index] || 0) * 100).toFixed(1) }}%
              </span>
              <div
                class="contribution-bar"
                :style="{
                  width: `${Math.min((contributions[index] || 0) * 100, 100)}%`,
                }"
              ></div>
            </div>
          </div>

          <div class="quick-actions">
            <button
              type="button"
              class="quick-btn"
              @click="setContribution(index, 0.25)"
              title="设为25%"
            >
              25%
            </button>
            <button
              type="button"
              class="quick-btn"
              @click="setContribution(index, 0.5)"
              title="设为50%"
            >
              50%
            </button>
            <button
              type="button"
              class="quick-btn"
              @click="setContribution(index, 1)"
              title="设为100%"
            >
              100%
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  label: {
    type: String,
    default: "作者贡献比例",
  },
  authors: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: Object,
    default: () => ({ contributions: [], correspondingAuthor: null }),
  },
  error: {
    type: String,
    default: null,
  },
  hint: {
    type: String,
    default:
      "贡献比例总和应为100%（1.0）。如不填写，系统将平均分配。✉️ 选择一位通讯作者负责论文联络。",
  },
});

const emit = defineEmits(["update:modelValue"]);

const contributions = ref([...(props.modelValue.contributions || [])]);
const correspondingAuthor = ref(props.modelValue.correspondingAuthor || null);
const focusedIndex = ref(-1);

// 计算作者列表 - 现在直接使用传入的数组
const authorList = computed(() => {
  if (!Array.isArray(props.authors)) return [];
  return props.authors.filter((name) => name && name.trim().length > 0);
});

// 计算总贡献比例
const totalContribution = computed(() => {
  return contributions.value.reduce((sum, contrib) => sum + (contrib || 0), 0);
});

// 计算剩余需要分配的比例
const remainingPercentage = computed(() => {
  return 1 - totalContribution.value;
});

// 获取作者姓名首字母
const getAuthorInitials = (name) => {
  if (!name) return "?";

  // 处理中文姓名
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.slice(-1); // 取最后一个字作为显示
  }

  // 处理英文姓名
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

// 自动平均分配（按钮触发）
const autoDistribute = () => {
  performAutoDistribute();
  emitUpdate();
};

// 清空所有贡献比例
const clearAll = () => {
  contributions.value = authorList.value.map(() => 0);
  emitUpdate();
};

// 设置特定作者的贡献比例
const setContribution = (index, value) => {
  contributions.value[index] = Math.max(0, Math.min(1, value));
  emitUpdate();
};

// 设置通讯作者
const setCorrespondingAuthor = (author) => {
  // 如果点击的是当前通讯作者，则取消选择
  if (correspondingAuthor.value === author) {
    correspondingAuthor.value = null;
  } else {
    correspondingAuthor.value = author;
  }
  emitUpdate();
};

// 检查是否需要自动分配贡献率
const shouldAutoDistribute = () => {
  const total = contributions.value.reduce(
    (sum, contrib) => sum + (contrib || 0),
    0
  );
  // 如果总贡献率为0或接近0（小于0.01），则需要自动分配
  return total < 0.01;
};

// 自动分配贡献率（内部使用，不触发emitUpdate）
const performAutoDistribute = () => {
  if (authorList.value.length === 0) return;

  const authorCount = authorList.value.length;

  if (authorCount === 1) {
    // 只有一个作者，直接设为 100%
    contributions.value = [1.0];
  } else {
    // 多个作者时，使用优化的平均分配算法
    // 100 除以人数，向下取整得到基础百分数
    const basePercentage = Math.floor(100 / authorCount);

    // 计算剩余的百分数
    const remainingPercentage = 100 - basePercentage * authorCount;

    // 初始化所有作者的百分数为基础值
    const percentages = new Array(authorCount).fill(basePercentage);

    // 将剩余的百分数平均分配给前几个作者（向上取整）
    for (let i = 0; i < remainingPercentage; i++) {
      percentages[i] += 1;
    }

    // 转换为两位小数的比例形式（如 0.33）
    contributions.value = percentages.map((percentage) => percentage / 100);
  }
};

// 统一的emit更新函数
const emitUpdate = () => {
  emit("update:modelValue", {
    contributions: [...contributions.value],
    correspondingAuthor: correspondingAuthor.value,
  });
};

// 提交前的自动分配检查
const prepareForSubmit = () => {
  if (shouldAutoDistribute()) {
    performAutoDistribute();
    emitUpdate();
    return true; // 表示进行了自动分配
  }
  return false; // 表示没有进行自动分配
};

// 调整数值
const adjustValue = (index, delta) => {
  const currentValue = contributions.value[index] || 0;
  const newValue = Math.max(0, Math.min(1, currentValue + delta));
  contributions.value[index] = Number(newValue.toFixed(3));
  emitUpdate();
};

// 获取通讯作者提示文本
const getCorrespondingTooltip = (author) => {
  if (correspondingAuthor.value === author) {
    return `${author} 是通讯作者 - 点击取消选择`;
  }
  return `设置 ${author} 为通讯作者 - 负责论文的对外联络`;
};

// 切换到下一个输入框
const nextInput = (currentIndex) => {
  const nextIndex = (currentIndex + 1) % authorList.value.length;
  const nextInput = document.querySelectorAll(".contribution-input")[nextIndex];
  if (nextInput) {
    nextInput.focus();
  }
};

// 监听作者列表变化，调整贡献比例数组
watch(
  authorList,
  (newAuthors, oldAuthors) => {
    const newLength = newAuthors.length;
    const oldLength = contributions.value.length;

    if (newLength > oldLength) {
      // 添加新作者，初始化贡献比例
      for (let i = oldLength; i < newLength; i++) {
        contributions.value.push(0);
      }
    } else if (newLength < oldLength) {
      // 删除作者，移除对应的贡献比例
      contributions.value.splice(newLength);
    }

    // 检查通讯作者是否仍在作者列表中
    if (
      correspondingAuthor.value &&
      !newAuthors.includes(correspondingAuthor.value)
    ) {
      correspondingAuthor.value = null;
    }

    emitUpdate();
  },
  { immediate: true }
);

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && typeof newValue === "object") {
      contributions.value = [...(newValue.contributions || [])];
      correspondingAuthor.value = newValue.correspondingAuthor || null;
    } else {
      // 向后兼容：如果传入的是数组（旧格式）
      contributions.value = Array.isArray(newValue) ? [...newValue] : [];
      correspondingAuthor.value = null;
    }
  },
  { immediate: true }
);

const updateContributions = () => {
  // 确保所有值都是数字且在有效范围内
  contributions.value = contributions.value.map((val) =>
    isNaN(val) ? 0 : Math.max(0, Math.min(1, val))
  );
  emitUpdate();
};

// 暴露方法给父组件
defineExpose({
  prepareForSubmit,
});
</script>

<style scoped>
/* 表单组基础样式 */
.form-group {
  margin-bottom: var(--space-lg);
}

.form-group.has-error {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-3px);
  }
}

/* 表单头部 */
.form-header {
  margin-bottom: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: linear-gradient(135deg, var(--white) 0%, var(--primary-25) 100%);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.form-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--primary-500),
    var(--primary-400),
    var(--primary-500)
  );
  background-size: 200% 100%;
  animation: shimmer 4s ease-in-out infinite;
}

@keyframes shimmer {
  0%,
  100% {
    background-position: -200% 0;
  }
  50% {
    background-position: 200% 0;
  }
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
  min-height: 48px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
}

/* 第二行样式 */
.header-secondary {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--primary-100);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}

/* 错误信息内联样式 */
.header-info-inline {
  display: flex;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-light);
}

.form-description {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-light);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.contribution-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  flex: 1;
  position: relative;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-1px);
  }
}

.status-text {
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-heading);
  white-space: nowrap;
  min-width: 50px;
  text-align: left;
}

.status-progress {
  flex: 1;
  height: 3px;
  background: var(--gray-100);
  border-radius: 1px;
  overflow: hidden;
  max-width: 400px;
  position: relative;
}

.status-bar {
  height: 100%;
  background: var(--primary-500);
  border-radius: 1px;
  transition: width 0.3s ease;
  position: relative;
  transform-origin: left;
}

.status-bar.bar-complete {
  background: var(--success-500);
}

.status-bar.bar-over {
  background: var(--error-500);
}

.status-bar.bar-under {
  background: var(--warning-500);
}

.form-actions {
  display: flex;
  gap: var(--space-xs);
  flex-shrink: 0;
  align-items: center;
}

.corresponding-status {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: linear-gradient(
    135deg,
    var(--primary-50) 0%,
    var(--primary-25) 100%
  );
  border: 1px solid var(--primary-200);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--primary-700);
  margin-right: var(--space-xs);
  animation: fadeIn 0.3s ease-out;
  box-shadow: 0 1px 3px rgba(159, 144, 217, 0.1);
}

.corresponding-status .status-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-600);
}

.corresponding-status .status-text {
  font-size: 11px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 100px;
  font-weight: 600;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-xs);
  color: var(--color-text-light);
  margin-top: var(--space-xs);
  padding-top: var(--space-xs);
  border-top: 1px solid var(--gray-100);
}

.form-error-inline {
  color: var(--error-600);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.remaining-info-inline {
  font-weight: 600;
}

.remaining-positive {
  color: var(--warning-600);
}

.remaining-negative {
  color: var(--error-600);
}

.btn-auto-distribute,
.btn-clear {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--gray-200);
  border-radius: var(--border-radius);
  background: linear-gradient(135deg, var(--white) 0%, var(--gray-50) 100%);
  color: var(--color-text);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 1px rgba(0, 0, 0, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  transform: translateY(0);
}

.btn-auto-distribute::before,
.btn-clear::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.4s ease;
}

.btn-auto-distribute::after,
.btn-clear::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.btn-auto-distribute:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    var(--primary-25) 0%,
    var(--primary-50) 100%
  );
  border-color: var(--primary-300);
  color: var(--primary-700);
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.15),
    0 1px 2px rgba(59, 130, 246, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.btn-auto-distribute:hover:not(:disabled)::before {
  left: 100%;
}

.btn-auto-distribute:hover:not(:disabled)::after {
  width: 100%;
  height: 100%;
}

.btn-clear:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--gray-25) 0%, var(--gray-50) 100%);
  border-color: var(--gray-300);
  color: var(--gray-700);
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.12),
    0 1px 2px rgba(107, 114, 128, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.btn-clear:hover:not(:disabled)::before {
  left: 100%;
}

.btn-clear:hover:not(:disabled)::after {
  width: 100%;
  height: 100%;
}

.btn-auto-distribute:active:not(:disabled),
.btn-clear:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: all 0.1s ease;
}

.btn-auto-distribute:disabled,
.btn-clear:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%);
  color: var(--gray-500);
}

.btn-icon {
  font-size: 1em;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
  transition: transform 0.2s ease;
}

.btn-auto-distribute:hover:not(:disabled) .btn-icon {
  transform: rotate(2deg) scale(1.05);
}

.btn-clear:hover:not(:disabled) .btn-icon {
  transform: rotate(-2deg) scale(1.05);
}

/* 贡献列表 */
.contribution-list {
  margin-top: var(--space-md);
}

.contribution-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.contribution-item {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr auto;
  gap: var(--space-lg);
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: linear-gradient(
    135deg,
    var(--primary-25) 0%,
    var(--white) 50%,
    var(--primary-25) 100%
  );
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-300);
  box-shadow: 0 2px 8px rgba(159, 144, 217, 0.1),
    0 0 0 1px rgba(159, 144, 217, 0.1);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.contribution-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(
    180deg,
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  box-shadow: 0 0 4px rgba(159, 144, 217, 0.3);
  transition: background 0.2s ease;
}

.contribution-item.has-value::before {
  background: linear-gradient(
    180deg,
    var(--primary-600) 0%,
    var(--primary-700) 100%
  );
}

.contribution-item.is-over-limit::before {
  background: linear-gradient(
    180deg,
    var(--error-500) 0%,
    var(--error-600) 100%
  );
}

.contribution-item:hover {
  border-color: var(--primary-400);
  box-shadow: 0 4px 16px rgba(159, 144, 217, 0.2),
    0 0 0 1px rgba(159, 144, 217, 0.2);
  transform: translateY(-1px);
}

.contribution-item.is-focused {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100), 0 4px 16px rgba(159, 144, 217, 0.2);
}

/* 通讯作者特殊样式 */
.contribution-item.is-corresponding-author {
  background: linear-gradient(
    135deg,
    var(--primary-25) 0%,
    var(--white) 50%,
    var(--primary-25) 100%
  );
  border-color: var(--primary-300);
  box-shadow: 0 2px 8px rgba(159, 144, 217, 0.1),
    0 0 0 1px rgba(159, 144, 217, 0.1);
  position: relative;
  animation: correspondingGlow 3s ease-in-out infinite alternate;
}

@keyframes correspondingGlow {
  0% {
    box-shadow: 0 2px 8px rgba(159, 144, 217, 0.1),
      0 0 0 1px rgba(159, 144, 217, 0.1);
  }
  100% {
    box-shadow: 0 2px 12px rgba(159, 144, 217, 0.15),
      0 0 0 1px rgba(159, 144, 217, 0.2);
  }
}

.contribution-item.is-corresponding-author::before {
  background: linear-gradient(
    180deg,
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  width: 4px;
  box-shadow: 0 0 4px rgba(159, 144, 217, 0.3);
}

.contribution-item.is-corresponding-author:hover {
  border-color: var(--primary-400);
  box-shadow: 0 4px 16px rgba(159, 144, 217, 0.2),
    0 0 0 1px rgba(159, 144, 217, 0.2);
  transform: translateY(-1px);
}

/* 作者区域 */
.author-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 0;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-400);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-xs);
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;
}

/* 通讯作者头像特殊样式 */
.is-corresponding-author .author-avatar {
  background: linear-gradient(
    135deg,
    var(--primary-600) 0%,
    var(--primary-700) 100%
  );
  box-shadow: 0 2px 8px rgba(125, 108, 192, 0.3);
  transform: scale(1.05);
}

.is-corresponding-author .author-avatar::before {
  content: "✉️";
  position: absolute;
  top: -3px;
  right: -3px;
  font-size: 10px;
  background: var(--white);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  animation: wiggle 2s ease-in-out infinite;
}

@keyframes wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
  flex: 1;
}

.author-name {
  font-weight: 600;
  color: var(--color-heading);
  font-size: var(--text-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.2s ease;
}

/* 通讯作者名称特殊样式 */
.is-corresponding-author .author-name {
  color: var(--primary-700);
  font-weight: 700;
  position: relative;
}

.is-corresponding-author .author-name::after {
  content: "✉️";
  position: absolute;
  right: -18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  animation: bounce 1s ease-in-out infinite alternate;
}

@keyframes bounce {
  0% {
    transform: translateY(-50%) scale(1);
  }
  100% {
    transform: translateY(-50%) scale(1.1);
  }
}

.corresponding-author-wrapper {
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.corresponding-checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
  font-size: var(--text-xs);
  color: var(--gray-600);
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  position: relative;
  /* 确保始终有相同的 box-shadow 空间占用 */
  box-shadow: 0 2px 4px transparent;
  /* 确保容器尺寸稳定 */
  box-sizing: border-box;
  min-width: 0; /* 防止内容撑大容器 */
}

.corresponding-checkbox:hover {
  color: var(--primary-700);
  background: var(--primary-25);
  border-color: var(--primary-100);
  transform: translateY(-1px);
}

.corresponding-checkbox:has(.checkbox-input:checked) {
  color: var(--primary-700);
  background: linear-gradient(
    135deg,
    var(--primary-50) 0%,
    var(--primary-25) 100%
  );
  border-color: var(--primary-200);
  box-shadow: 0 2px 4px rgba(159, 144, 217, 0.1);
}

.checkbox-input {
  position: relative;
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
  appearance: none;
  background: var(--white);
  border: 2px solid var(--gray-300);
  border-radius: 4px;
  transition: all 0.2s ease;
  /* 确保始终有相同的 box-shadow 空间占用，统一使用 3px */
  box-shadow: 0 0 0 3px transparent;
  /* 确保固定尺寸，防止内容影响 */
  box-sizing: border-box;
  flex-shrink: 0;
}

.checkbox-input:hover {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.checkbox-input:checked {
  background: linear-gradient(
    135deg,
    var(--primary-500) 0%,
    var(--primary-600) 100%
  );
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.checkbox-input:checked::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--white);
  font-size: 10px;
  font-weight: bold;
  line-height: 1;
}

.checkbox-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.checkbox-label {
  user-select: none;
  font-weight: 600; /* 统一使用 600，避免选中时字体粗细变化 */
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.2s ease; /* 只过渡颜色，不过渡字体粗细 */
  white-space: nowrap; /* 防止文字换行影响布局 */
}

.corresponding-checkbox:has(.checkbox-input:checked) .checkbox-label {
  color: var(--primary-700);
  /* 移除 font-weight 变化，保持一致 */
}

.corresponding-badge {
  font-size: 14px;
  margin-left: var(--space-xs);
  filter: drop-shadow(0 1px 2px rgba(159, 144, 217, 0.3));
  transition: all 0.2s ease;
  /* 始终占据空间，但默认不可见 */
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  /* 确保固定宽度，避免布局变化 */
  width: 16px;
  display: inline-block;
  text-align: center;
}

.corresponding-badge.badge-visible {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 输入区域 */
.input-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.contribution-input {
  width: 100px;
  padding: var(--space-sm);
  padding-right: 32px;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: center;
  background: var(--white);
  transition: border-color 0.2s ease;
}

.contribution-input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 2px var(--primary-100);
}

.contribution-input:hover:not(:focus) {
  border-color: var(--primary-300);
}

.input-controls {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.control-btn {
  width: 16px;
  height: 12px;
  border: none;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background: var(--primary-100);
  color: var(--primary-600);
}

.contribution-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  min-width: 60px;
}

.contribution-percent {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--primary-600);
  padding: 2px var(--space-xs);
  background: var(--primary-50);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-200);
  min-width: 50px;
  text-align: center;
}

.contribution-bar {
  height: 3px;
  background: var(--primary-400);
  border-radius: 2px;
  transition: width 0.3s ease;
  min-width: 2px;
}

/* 快速操作 */
.quick-actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
}

.quick-btn {
  padding: 4px 8px;
  border: 1px solid var(--gray-300);
  border-radius: var(--border-radius);
  background: var(--white);
  color: var(--color-text);
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
  min-width: 35px;
}

.quick-btn:hover {
  background: var(--primary-50);
  border-color: var(--primary-300);
  color: var(--primary-700);
}

.error-icon {
  font-size: 1.1em;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .contribution-item {
    grid-template-columns: 1fr;
    gap: var(--space-sm);
    text-align: center;
  }

  .author-section {
    justify-content: center;
  }

  .input-section {
    justify-content: center;
    flex-wrap: wrap;
  }

  .quick-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .form-header {
    padding: var(--space-sm);
  }

  .header-main {
    flex-direction: column;
    gap: var(--space-sm);
    align-items: stretch;
    min-height: auto;
  }

  .header-left {
    flex-direction: column;
    gap: var(--space-xs);
    align-items: center;
  }
  .header-secondary {
    margin-top: var(--space-xs);
    padding-top: var(--space-xs);
    flex-direction: column;
    gap: var(--space-xs);
    align-items: stretch;
  }

  .header-info-inline {
    justify-content: center;
    text-align: center;
  }
  .form-description {
    font-size: var(--text-sm);
    text-align: center;
  }
  .contribution-status {
    justify-content: center;
    padding: var(--space-xs) var(--space-sm);
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
  }

  .status-text {
    font-size: var(--text-xs);
    min-width: 40px;
  }
  .status-progress {
    flex: 1;
    height: 2px;
    max-width: 250px;
  }
  .header-info,
  .header-info-inline {
    font-size: var(--text-xs);
    margin-top: var(--space-xs);
    padding-top: var(--space-xs);
  }

  .form-actions {
    justify-content: center;
    gap: var(--space-xs);
    width: 100%;
  }

  .btn-auto-distribute,
  .btn-clear {
    font-size: var(--text-xs);
    padding: var(--space-xs) var(--space-sm);
    flex: 1;
    max-width: 120px;
  }

  .contribution-input {
    width: 80px;
  }
}

@media (max-width: 640px) {
  .header-left {
    gap: var(--space-xs);
  }

  .contribution-status {
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    flex-wrap: wrap;
    justify-content: center;
  }

  .status-icon {
    width: 20px;
    height: 20px;
  }
  .status-progress {
    flex: 1;
    height: 2px;
    order: 3;
    flex-basis: 100%;
    margin-top: var(--space-xs);
    max-width: none;
  }

  .form-actions {
    gap: var(--space-xs);
  }

  .btn-auto-distribute,
  .btn-clear {
    font-size: var(--text-xs);
    padding: var(--space-xs) var(--space-sm);
    max-width: 100px;
  }
}

/* Large screens - enhanced single line layout */
@media (min-width: 1200px) {
  .form-header {
    padding: var(--space-md) var(--space-lg);
  }

  .header-main {
    gap: var(--space-lg);
    min-height: 52px;
  }

  .header-left {
    gap: var(--space-md);
  }

  .contribution-status {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }

  .status-icon {
    width: 26px;
    height: 26px;
  }
  .status-progress {
    flex: 1;
    height: 3px;
    max-width: 450px;
  }

  .form-actions {
    gap: var(--space-sm);
  }

  .btn-auto-distribute,
  .btn-clear {
    padding: var(--space-sm) var(--space-md);
    font-size: var(--text-sm);
  }
}

@media (max-width: 480px) {
  .contribution-item {
    padding: var(--space-sm) var(--space-md);
  }

  .input-section {
    flex-direction: column;
    gap: var(--space-sm);
  }

  .quick-actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 2px;
  }

  .quick-btn {
    flex: 1;
    min-width: 30px;
    font-size: 9px;
  }
}

/* 可访问性增强 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .contribution-item {
    border-width: 3px;
  }

  .contribution-input {
    border-width: 3px;
  }
}

/* 深色模式支持准备 */
@media (prefers-color-scheme: dark) {
  /* 这里可以添加深色模式的样式覆盖 */
}
</style>
