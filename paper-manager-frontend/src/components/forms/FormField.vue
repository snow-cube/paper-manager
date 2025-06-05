<template>
  <div class="form-group" :class="{ 'has-error': error }">
    <label v-if="label" class="form-label" :for="id">
      {{ label }}
      <span v-if="required" class="required-indicator">*</span>
    </label>
      <!-- 文本输入 -->
    <input
      v-if="type === 'text' || type === 'email' || type === 'url' || type === 'date'"
      :id="id"
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"      class="form-input"
      @input="$emit('update:modelValue', $event.target.value); $emit('input', $event.target.value)"
      @blur="$emit('blur', $event)"
    />

    <!-- 数字输入 -->
    <input
      v-else-if="type === 'number'"
      :id="id"
      :value="modelValue"
      type="number"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :step="step"
      :min="min"
      :max="max"      class="form-input"
      @input="$emit('update:modelValue', parseFloat($event.target.value) || 0); $emit('input', parseFloat($event.target.value) || 0)"
      @blur="$emit('blur', $event)"
    />

    <!-- 文本域 -->
    <textarea
      v-else-if="type === 'textarea'"
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :rows="rows"      class="form-textarea"
      @input="$emit('update:modelValue', $event.target.value); $emit('input', $event.target.value)"
      @blur="$emit('blur', $event)"
    ></textarea>

    <!-- 选择框 -->
    <select
      v-else-if="type === 'select'"
      :id="id"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      :multiple="multiple"      class="form-select"
      @change="$emit('update:modelValue', multiple ? Array.from($event.target.selectedOptions, option => option.value) : $event.target.value); $emit('change', $event)"
      @blur="$emit('blur', $event)"
    >
      <slot>
        <option v-if="!multiple && placeholder" value="">{{ placeholder }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </slot>
    </select>

    <small v-if="hint" class="form-hint">{{ hint }}</small>
    <div v-if="error" class="form-error">{{ error }}</div>
  </div>
</template>

<script setup>
defineProps({
  id: String,
  label: String,
  type: {
    type: String,
    default: 'text'
  },
  modelValue: [String, Number, Array],
  placeholder: String,
  required: Boolean,
  disabled: Boolean,
  hint: String,
  error: String,
  rows: {
    type: Number,
    default: 3
  },
  step: String,
  min: [String, Number],
  max: [String, Number],
  multiple: Boolean,
  options: {
    type: Array,
    default: () => []
  }
})

defineEmits(['update:modelValue', 'input', 'blur', 'change'])
</script>

<style scoped>
.required-indicator {
  color: var(--error-600);
}

.form-error {
  color: var(--error-600);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
}
</style>
