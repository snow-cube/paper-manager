# 表单验证系统使用指南

本项目实现了一套完整的表单验证系统，支持实时验证、错误显示、表单进度跟踪等功能。

## 功能特性

### 1. 实时验证
- 字段失焦时自动验证
- 输入过程中的即时反馈
- 智能的错误消息显示

### 2. 表单状态跟踪
- 表单完成度进度条
- 字段touched状态管理
- 验证错误统计和汇总

### 3. 丰富的验证规则
- 必填字段验证
- 长度限制验证
- 格式验证（DOI、邮箱、URL等）
- 自定义验证逻辑
- 条件验证（基于其他字段值）

### 4. 用户友好的界面
- 错误状态的视觉提示
- 验证摘要展示
- 提交按钮智能禁用
- 进度指示器

## 使用方法

### 基本使用

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <FormField
      v-model="form.title"
      label="标题"
      required
      :error="getFieldError('title')"
      @blur="markTouched('title')"
      @input="validateFieldRealtime('title', $event)"
    />
  </form>
</template>

<script setup>
import { usePaperFormValidation } from '@/composables/usePaperFormValidation'

const form = ref({ title: '' })
const {
  getFieldError,
  markTouched,
  validateFieldRealtime,
  validateForm
} = usePaperFormValidation(form)

const handleSubmit = () => {
  if (validateForm()) {
    // 提交表单
  }
}
</script>
```

### 自定义验证规则

```javascript
// 在 usePaperFormValidation.js 中添加规则
const validationRules = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 100,
    custom: (value) => {
      // 自定义验证逻辑
      if (value && value.includes('测试')) {
        return '标题不能包含"测试"字样'
      }
      return true
    }
  }
}
```

### 使用验证工具函数

```javascript
import { validators, combineValidators } from '@/utils/validators'

// 组合多个验证器
const titleValidator = combineValidators(
  validators.required('请输入标题'),
  validators.minLength(5),
  validators.maxLength(100)
)

// 条件验证
const keywordValidator = conditionalValidator(
  (formData) => formData.paper_type === 'published',
  validators.required('发表论文必须填写关键词')
)
```

## 验证规则配置

### 支持的验证类型

1. **必填验证**
   ```javascript
   required: true
   message: '此字段为必填项'
   ```

2. **长度验证**
   ```javascript
   minLength: 5
   maxLength: 100
   minLengthMessage: '至少需要5个字符'
   maxLengthMessage: '不能超过100个字符'
   ```

3. **条件验证**
   ```javascript
   requiredIf: (formData) => formData.paper_type === 'published'
   ```

4. **自定义验证**
   ```javascript
   custom: (value, formData) => {
     // 返回 true 表示验证通过
     // 返回字符串表示错误消息
     if (someCondition) {
       return '自定义错误消息'
     }
     return true
   }
   ```

## 组件集成

### FormField 组件
```vue
<FormField
  v-model="value"
  label="字段标签"
  type="text|textarea|select|number|date|email"
  :error="errorMessage"
  :required="true"
  @blur="handleBlur"
  @input="handleInput"
/>
```

### 专用字段组件
- `PublishedPaperFields` - 发表论文字段
- `LiteratureFields` - 文献字段
- `AuthorContributions` - 作者贡献比例
- `FileUpload` - 文件上传

## 样式和主题

### 错误状态样式
```css
.form-group.has-error .form-input {
  border-color: var(--color-error);
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
}

.form-error {
  color: var(--color-error);
  font-size: var(--text-xs);
  margin-top: var(--space-xs);
}
```

### 进度指示器
```css
.progress-fill.progress-high {
  background: #10b981; /* 绿色 - 完成度高 */
}

.progress-fill.progress-medium {
  background: #fbbf24; /* 黄色 - 完成度中等 */
}

.progress-fill.progress-low {
  background: #f87171; /* 红色 - 完成度低 */
}
```

## 最佳实践

### 1. 验证时机
- 使用失焦验证进行主要验证
- 对于重要字段启用实时验证
- 在表单提交前进行完整验证

### 2. 错误消息
- 提供清晰、具体的错误描述
- 使用用户友好的语言
- 避免技术术语

### 3. 用户体验
- 不要在用户输入时立即显示错误
- 使用视觉提示引导用户注意力
- 提供表单完成度反馈

### 4. 性能优化
- 避免在每次输入时进行复杂验证
- 使用防抖来减少验证频率
- 只验证已经被用户接触过的字段

## 扩展功能

### 异步验证
```javascript
// 服务器端验证
const asyncValidator = async (value) => {
  const response = await api.checkUnique(value)
  return response.isUnique ? true : '该值已存在'
}
```

### 跨字段验证
```javascript
// 密码确认验证
const confirmPasswordValidator = (value, formData) => {
  if (value !== formData.password) {
    return '密码确认不匹配'
  }
  return true
}
```

这套验证系统为论文管理系统提供了完整的表单验证解决方案，确保数据质量和用户体验。
