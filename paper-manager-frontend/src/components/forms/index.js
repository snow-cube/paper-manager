/**
 * Form Components Index
 *
 * Form components and form field components for user input and data collection.
 */

// Main Form Components
export { default as LoginForm } from "./LoginForm.vue";
export { default as PaperForm } from "./PaperForm.vue";
export { default as RegisterForm } from "./RegisterForm.vue";
export { default as TeamForm } from "./TeamForm.vue";
export { default as UserSelect } from "./UserSelect.vue";

// Form Field Components
export { default as AuthorContributions } from "./fields/AuthorContributions.vue";
export { default as FileUpload } from "./fields/FileUpload.vue";
export { default as FormField } from "./fields/FormField.vue";
export { default as ModeSwitch } from "./fields/ModeSwitch.vue";

// Re-export field components
export * from "./fields";
