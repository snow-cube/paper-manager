<template>
  <div class="form-section">
    <h3 class="section-title">参考文献信息</h3>    <div class="form-row">
      <FormField
        id="doi"
        :model-value="doi"
        @update:model-value="$emit('update:doi', $event)"
        label="DOI"
        placeholder="如：10.1000/xyz123"
        :error="errors?.doi"
        @blur="$emit('field-blur', 'doi')"
        @input="$emit('field-input', 'doi', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import FormField from './FormField.vue'

defineProps({
  doi: {
    type: String,
    default: ''
  },
  errors: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['update:doi', 'field-blur', 'field-input'])
</script>

<style scoped>
.form-section {
  margin: var(--space-xl) 0;
  padding: var(--space-lg);
  background: var(--color-background-soft);
  border-radius: var(--border-radius);
  border-left: 4px solid var(--color-primary);
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--space-md) 0;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.form-row {
  display: grid;
  gap: var(--space-md);
  grid-template-columns: 1fr;
}
</style>
