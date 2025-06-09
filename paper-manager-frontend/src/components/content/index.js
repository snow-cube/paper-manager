/**
 * Content Components Index
 *
 * Business logic components that handle specific content areas of the application.
 */

// Category Components
export { default as CategoryNode } from "./category/CategoryNode.vue";
export { default as CategoryTree } from "./category/CategoryTree.vue";

// Collaboration Components
export { default as CollaborationNetwork } from "./collaboration/CollaborationNetwork.vue";
export { default as CollaborationNetworkModal } from "./collaboration/CollaborationNetworkModal.vue";

// Paper Components
export { default as PaperCard } from "./paper/PaperCard.vue";
export { default as PaperDetail } from "./paper/PaperDetail.vue";
export { default as PaperManager } from "./paper/PaperManager.vue";
export { default as PdfViewer } from "./paper/PdfViewer.vue";

// Team Components
export { default as TeamInfo } from "./team/TeamInfo.vue";
export { default as TeamList } from "./team/TeamList.vue";
export { default as TeamMembers } from "./team/TeamMembers.vue";
export { default as TeamReferences } from "./team/TeamReferences.vue";
export { default as TeamSelector } from "./team/TeamSelector.vue";

// Re-export all content sub-modules
export * from "./category";
export * from "./collaboration";
export * from "./paper";
export * from "./team";
