<template>
  <div class="page-layout">
    <div class="page-container">
      <div v-if="$slots.header" class="page-header-slot">
        <slot name="header"></slot>
      </div>

      <div v-else-if="title || subtitle" class="page-header">
        <div class="page-header-content">
          <h1 v-if="title" class="page-title">
            <span v-if="icon" class="page-icon">{{ icon }}</span>
            {{ title }}
          </h1>
          <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="page-actions">
          <slot name="actions"></slot>
        </div>
      </div>

      <div class="page-content">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  maxWidth: {
    type: String,
    default: "1200px",
  },
});
</script>

<style scoped>
.page-layout {
  min-height: calc(
    100vh - var(--header-height, 80px) - var(--footer-height, 60px)
  );
}

.page-container {
  max-width: v-bind(maxWidth);
  margin: 0 auto;
  padding: 2rem 1rem;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 3rem;
  padding: 2.5rem;
  background: linear-gradient(
    135deg,
    var(--primary-50),
    var(--white),
    var(--primary-100)
  );
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-200);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, var(--primary-200) 0%, transparent 70%);
  opacity: 0.4;
  filter: blur(60px);
  z-index: 0;
}

.page-header-content {
  flex: 1;
  text-align: center;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  color: var(--color-heading);
  margin: 0 0 0.75rem 0;
  background: linear-gradient(135deg, var(--primary-700), var(--primary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  line-height: 1.2;
  text-shadow: 0 4px 10px rgba(124, 58, 237, 0.2);
}

.page-icon {
  font-size: 0.9em;
  filter: drop-shadow(0 2px 8px rgba(124, 58, 237, 0.3));
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--color-text);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.page-actions {
  flex-shrink: 0;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.page-header-slot {
  margin-bottom: 2rem;
}

.page-content {
  position: relative;
}

/* Responsive design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem 0.5rem;
  }

  .page-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
    margin-bottom: 2rem;
  }

  .page-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .page-title {
    font-size: 1.75rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }
}
</style>
