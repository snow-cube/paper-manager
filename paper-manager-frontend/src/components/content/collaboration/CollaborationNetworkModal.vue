<template>
  <Modal
    :show="show"
    @close="$emit('close')"
    :title="`${authorName} 的合作网络`"
    size="large"
  >
    <div class="collaboration-modal-content">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="loading-state">
        <LoadingSpinner />
        <p>正在加载合作网络数据...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-state">
        <div class="error-message">
          <h3>❌ 加载失败</h3>
          <p>{{ error }}</p>
          <button @click="fetchData" class="retry-btn">🔄 重试</button>
        </div>
      </div>

      <!-- 网络图显示 -->
      <div v-else-if="networkData" class="network-display">
        <CollaborationNetwork :network-data="networkData" />
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data-state">
        <div class="no-data-message">
          <h3>📊 暂无合作网络数据</h3>
          <p>该作者暂时没有合作网络信息</p>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, watch } from "vue";
import Modal from "../../base/Modal.vue";
import LoadingSpinner from "../../base/LoadingSpinner.vue";
import CollaborationNetwork from "./CollaborationNetwork.vue";
import { getAuthorCollaborationNetwork } from "@/services/api";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  authorName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const isLoading = ref(false);
const error = ref(null);
const networkData = ref(null);

const fetchData = async () => {
  if (!props.authorName) return;

  isLoading.value = true;
  error.value = null;
  networkData.value = null;

  try {
    const data = await getAuthorCollaborationNetwork(props.authorName);
    networkData.value = data;
  } catch (err) {
    console.error("Failed to fetch collaboration network:", err);
    error.value = err.response?.data?.detail || "获取合作网络数据失败";
  } finally {
    isLoading.value = false;
  }
};

// 监听模态框显示状态和作者名称变化
watch(
  [() => props.show, () => props.authorName],
  ([newShow, newAuthorName]) => {
    if (newShow && newAuthorName) {
      fetchData();
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.collaboration-modal-content {
  height: 600px;
  min-height: 600px;
}

.loading-state,
.error-state,
.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.loading-state p {
  margin-top: 15px;
  color: #666;
}

.error-message,
.no-data-message {
  max-width: 400px;
}

.error-message h3,
.no-data-message h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.error-message p,
.no-data-message p {
  margin: 0 0 20px 0;
  color: #666;
  line-height: 1.5;
}

.retry-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.retry-btn:hover {
  background: #0056b3;
}

.network-display {
  height: 100%;
}
</style>
