<template>
  <div class="mode-switch" :data-active="modelValue">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :class="['mode-switch-button', { active: option.value === modelValue }]"
      :disabled="disabled"
      @click="update(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array, required: true },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);
function update(value) {
  emit("update:modelValue", value);
}
</script>

<style scoped>
/* 现代化开关容器设计 - 遵循项目设计系统 */
.mode-switch {
  display: inline-flex;
  background: var(--primary-600);
  border: 1px solid var(--primary-600);
  border-radius: calc(var(--border-radius-lg) * 1.2);
  padding: var(--space-xs);
  position: relative;
  overflow: hidden;
  transition: all var(--transition-bounce);
  box-shadow: var(--shadow-sm);
}

/* 悬停效果 - 使用主题色 */
.mode-switch:hover {
  border-color: var(--primary-500);
  box-shadow: var(--shadow), 0 0 0 1px var(--primary-400);
  /* background: var(--primary-500); */
}

/* 按钮样式 - 与项目按钮组件保持一致 */
.mode-switch-button {
  position: relative;
  padding: var(--space-sm) var(--space-md);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-bounce);
  white-space: nowrap;
  z-index: 2;
  letter-spacing: 0.02em;
  position: relative;
  overflow: hidden;
}

/* 滑动背景 - 使用项目主色调 */
.mode-switch::before {
  content: "";
  position: absolute;
  top: calc(var(--space-xs) * 0.65);
  left: calc(var(--space-xs) * 0.65);
  width: calc(50% - calc(var(--space-xs) * 0.65));
  height: calc(100% - calc(var(--space-xs) * 1.3));
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  transition: transform var(--transition-bounce);
  z-index: 1;
}

/* 添加光泽效果 */
.mode-switch::after {
  content: "";
  position: absolute;
  top: calc(var(--space-xs) * 0.75);
  left: calc(var(--space-xs) * 0.75);
  width: calc(50% - calc(var(--space-xs) * 0.75));
  height: calc(100% - calc(var(--space-xs) * 1.5));
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: var(--border-radius-lg);
  transition: transform var(--transition-bounce);
  z-index: 2;
  pointer-events: none;
}

/* 滑块位置控制 */
.mode-switch[data-active="published"]::before,
.mode-switch[data-active="published"]::after {
  transform: translateX(100%);
}

.mode-switch[data-active="literature"]::before,
.mode-switch[data-active="literature"]::after {
  transform: translateX(0);
}

/* 按钮悬停状态 */
.mode-switch-button:hover:not(.active) {
  color: var(--white);
  background: rgba(255, 255, 255, 0.1);
  /* transform: translateY(-1px); */
}

/* 激活状态 */
.mode-switch-button.active {
  color: var(--primary-600);
  font-weight: 600;
  text-shadow: none;
}

/* 禁用状态 */
.mode-switch-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.mode-switch:has(.mode-switch-button:disabled) {
  opacity: 0.7;
  pointer-events: none;
}

/* 无障碍焦点状态 */
.mode-switch-button:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
  border-radius: var(--border-radius-lg);
}

/* 响应式设计 */
@media (max-width: 640px) {
  .mode-switch-button {
    padding: calc(var(--space-sm) * 0.75) var(--space-sm);
    font-size: var(--text-xs);
  }
  .mode-switch {
    border-radius: var(--border-radius-lg);
  }

  .mode-switch-button,
  .mode-switch::before,
  .mode-switch::after {
    border-radius: calc(var(--border-radius-lg) * 0.8);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .mode-switch {
    background: var(--primary-700);
    border-color: var(--primary-700);
  }

  .mode-switch:hover {
    background: var(--primary-600);
    border-color: var(--primary-600);
    box-shadow: var(--shadow), 0 0 0 1px var(--primary-500);
  }

  .mode-switch-button:hover:not(.active) {
    background: rgba(255, 255, 255, 0.15);
    color: var(--white);
  }
}
</style>
