<template>
  <div class="loading-spinner" :class="{ 'loading-overlay': overlay }">
    <div class="spinner" :class="size">
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
      <div class="spinner-circle"></div>
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: "medium",
    validator: (value) => ["small", "medium", "large"].includes(value),
  },
  message: {
    type: String,
    default: "",
  },
  overlay: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(249, 248, 255, 0.9);
  backdrop-filter: blur(6px);
  z-index: 1000;
}

.spinner {
  display: inline-block;
  position: relative;
}

.spinner.small {
  width: 20px;
  height: 20px;
}

.spinner.medium {
  width: 40px;
  height: 40px;
}

.spinner.large {
  width: 60px;
  height: 60px;
}

.spinner-circle {
  position: absolute;
  border: 3px solid var(--primary-200);
  border-top: 3px solid var(--primary-600);
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite;
  box-shadow: 0 0 8px rgba(125, 108, 192, 0.08);
}

.spinner.small .spinner-circle {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner.medium .spinner-circle {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.spinner.large .spinner-circle {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

.spinner-circle:nth-child(1) {
  animation-delay: 0ms;
}

.spinner-circle:nth-child(2) {
  animation-delay: 150ms;
  opacity: 0.8;
}

.spinner-circle:nth-child(3) {
  animation-delay: 300ms;
  opacity: 0.6;
}

.spinner-circle:nth-child(4) {
  animation-delay: 450ms;
  opacity: 0.4;
}

.loading-message {
  color: var(--primary-700);
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
  text-shadow: 0 1px 2px rgba(125, 108, 192, 0.08);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
