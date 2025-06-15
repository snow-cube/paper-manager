/**
 * Components Index
 *
 * This file serves as the main entry point for all components in the application.
 * It provides centralized exports for easy importing throughout the project.
 *
 * Usage:
 * import { Modal, LoadingSpinner, PaperCard } from '@/components'
 */

// Base Components - Fundamental UI components
export { default as ConfirmDialog } from "./base/ConfirmDialog.vue";
export { default as ErrorBoundary } from "./base/ErrorBoundary.vue";
export { default as LoadingSpinner } from "./base/LoadingSpinner.vue";
export { default as Modal } from "./base/Modal.vue";
export { default as Toast } from "./base/Toast.vue";
export { default as ToastContainer } from "./base/ToastContainer.vue";

// Layout Components - Page structure and layout
export { default as StandardPageLayout } from "./layout/StandardPageLayout.vue";
export { default as StandardWarning } from "./layout/StandardWarning.vue";

// Form Components - Forms and form fields
export { default as LoginForm } from "./forms/LoginForm.vue";
export { default as PaperForm } from "./forms/PaperForm.vue";
export { default as RegisterForm } from "./forms/RegisterForm.vue";
export { default as TeamForm } from "./forms/TeamForm.vue";
export { default as UserSelect } from "./forms/UserSelect.vue";

// Form Field Components
export { default as AuthorContributions } from "./forms/fields/AuthorContributions.vue";
export { default as FileUpload } from "./forms/fields/FileUpload.vue";
export { default as FormField } from "./forms/fields/FormField.vue";
export { default as ModeSwitch } from "./forms/fields/ModeSwitch.vue";

// Category Components
export { default as CategoryNode } from "./content/category/CategoryNode.vue";
export { default as CategoryTree } from "./content/category/CategoryTree.vue";

// Collaboration Components
export { default as CollaborationNetwork } from "./content/collaboration/CollaborationNetwork.vue";

// Paper Components
export { default as PaperCard } from "./content/paper/PaperCard.vue";
export { default as PaperDetail } from "./content/paper/PaperDetail.vue";
export { default as PaperManager } from "./content/paper/PaperManager.vue";
export { default as PdfViewer } from "./content/paper/PdfViewer.vue";

// Team Components
export { default as TeamInfo } from "./content/team/TeamInfo.vue";
export { default as TeamList } from "./content/team/TeamList.vue";
export { default as TeamMembers } from "./content/team/TeamMembers.vue";
export { default as TeamSelector } from "./content/team/TeamSelector.vue";

// Icon Components
export { default as IconCommunity } from "./icons/IconCommunity.vue";
export { default as IconDocumentation } from "./icons/IconDocumentation.vue";
export { default as IconEcosystem } from "./icons/IconEcosystem.vue";
export { default as IconSupport } from "./icons/IconSupport.vue";
export { default as IconTooling } from "./icons/IconTooling.vue";

// Re-export all component groups for convenience
export * from "./base";
export * from "./layout";
export * from "./forms";
export * from "./content";
export * from "./icons";
