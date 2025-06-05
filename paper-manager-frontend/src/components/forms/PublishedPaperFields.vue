<template>
  <div class="form-section">
    <h3 class="section-title">发表论文信息</h3>    <div class="form-row">
      <FormField
        id="journal"
        :model-value="journal"
        @update:model-value="$emit('update:journal', $event)"
        label="期刊名称"
        placeholder="请输入期刊名称"
        required
        :error="errors?.journal"
        @blur="$emit('field-blur', 'journal')"
        @input="$emit('field-input', 'journal', $event)"
      />
      <FormField
        id="publication_date"
        :model-value="publicationDate"
        @update:model-value="$emit('update:publicationDate', $event)"
        type="date"
        label="发表日期"
        :error="errors?.publication_date"
        @blur="$emit('field-blur', 'publication_date')"
        @change="$emit('field-input', 'publication_date', $event.target.value)"
      />
    </div>

    <div class="form-row">
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
      <FormField
        :model-value="correspondingAuthor"
        @update:model-value="$emit('update:correspondingAuthor', $event)"
        label="通讯作者"
        placeholder="请输入通讯作者姓名"
        hint="通讯作者必须是上述作者列表中的一员"
        :error="errors?.corresponding_author_name"
        @blur="$emit('field-blur', 'corresponding_author_name')"
        @input="$emit('field-input', 'corresponding_author_name', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import FormField from './FormField.vue'

defineProps({
  journal: {
    type: String,
    default: ''
  },
  publicationDate: {
    type: String,
    default: ''
  },
  doi: {
    type: String,
    default: ''
  },
  correspondingAuthor: {
    type: String,
    default: ''
  },
  errors: {
    type: Object,
    default: () => ({})
  }
})

defineEmits([
  'update:journal',
  'update:publicationDate',
  'update:doi',
  'update:correspondingAuthor',
  'field-blur',
  'field-input'
])
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

.form-row:has(.form-group:nth-child(2)) {
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr !important;
  }
}
</style>
