<template>
  <div class="home">
    <div class="hero">
      <div class="hero-background">
        <div class="hero-shape"></div>
        <div class="hero-dots"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">🎓</span>
          <span>学术研究助手</span>
        </div>
        <h1 class="hero-title">
          欢迎使用
          <span class="gradient-text" data-text="科研论文管理系统"
            >科研论文管理系统</span
          >
        </h1>
        <p class="hero-subtitle">
          高效管理您的学术研究资料，让知识更有序，助力科研创新
        </p>
        <div style="height: 40px"></div>
        <!-- 添加空间距 -->        <div class="hero-actions">
          <template v-if="isAuthenticated">
            <RouterLink to="/literature" class="btn btn-primary btn-lg">
              <span class="btn-icon">📚</span>
              文献管理
            </RouterLink>
            <RouterLink to="/publications" class="btn btn-secondary btn-lg">
              <span class="btn-icon">🎓</span>
              发表论文
            </RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/login" class="btn btn-primary btn-lg">
              <span class="btn-icon">🔑</span>
              登录系统
            </RouterLink>
            <RouterLink to="/login?mode=register" class="btn btn-secondary btn-lg">
              <span class="btn-icon">📝</span>
              注册账号
            </RouterLink>
          </template>
        </div>
      </div>
    </div>    <div class="features" v-if="isAuthenticated">
      <div class="feature-card">
        <div class="feature-icon">📚</div>
        <h3>文献管理</h3>
        <p>管理和阅读学术文献，记录学习笔记和心得</p>
        <RouterLink to="/literature" class="btn">管理文献</RouterLink>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎓</div>
        <h3>发表论文</h3>
        <p>记录您发表的学术论文，跟踪研究成果和影响</p>
        <RouterLink to="/publications" class="btn">管理发表</RouterLink>
      </div>

      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>团队管理</h3>
        <p>创建和管理研究团队，协作共享学术资源</p>
        <RouterLink to="/teams" class="btn">团队管理</RouterLink>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🏷️</div>
        <h3>分类管理</h3>
        <p>创建自定义分类体系，让研究资料管理更加条理清晰</p>
        <RouterLink to="/categories" class="btn">分类管理</RouterLink>
      </div>
    </div>    <div class="stats" v-if="isAuthenticated">
      <div class="stat-item">
        <div class="stat-number">{{ stats.papers }}</div>
        <div class="stat-label">论文总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.categories }}</div>
        <div class="stat-label">分类数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.teams }}</div>
        <div class="stat-label">团队数量</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { ref, onMounted, watch } from "vue";
import { getPapers, getCategories, getTeams } from "../services/api";
import { useAuth } from "../composables/useAuth";

const { isAuthenticated } = useAuth();

const stats = ref({
  papers: 0,
  categories: 0,
  teams: 0,
});

const loading = ref(true);

const loadStats = async () => {
  if (!isAuthenticated.value) {
    return;
  }

  try {
    loading.value = true;

    const [papers, categories, teams] = await Promise.all([
      getPapers(),
      getCategories(),
      getTeams(),
    ]);

    stats.value = {
      papers: papers?.length || 0,
      categories: categories?.length || 0,
      teams: teams?.length || 0,
    };
  } catch (error) {
    console.error("Failed to load stats:", error);
    // Reset stats on error
    stats.value = {
      papers: 0,
      categories: 0,
      teams: 0,
    };
  } finally {
    loading.value = false;
  }
};

// Load stats when component mounts
onMounted(() => {
  loadStats();
});

// Watch for authentication changes and reload stats
watch(isAuthenticated, (newValue) => {
  if (newValue) {
    loadStats();
  } else {
    // Reset stats when user logs out
    stats.value = {
      papers: 0,
      categories: 0,
      teams: 0,
    };
  }
});
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.hero {
  position: relative;
  text-align: center;
  margin-bottom: 4rem;
  padding: 5rem 2rem;
  background: linear-gradient(
    135deg,
    var(--primary-50) 0%,
    var(--white) 50%,
    var(--primary-100) 100%
  );
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(125, 108, 192, 0.08);
  border: 1px solid var(--primary-200);
}

.hero-background {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-shape {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 120%;
  background: linear-gradient(45deg, var(--primary-300), var(--primary-200));
  border-radius: 50%;
  opacity: 0.25;
  animation: float 6s ease-in-out infinite;
  filter: blur(40px);
}

.hero-dots {
  position: absolute;
  top: 20%;
  left: 10%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--primary-400) 2px, transparent 2px);
  background-size: 20px 20px;
  opacity: 0.4;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--white);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--primary-700);
  box-shadow: 0 3px 8px rgba(125, 108, 192, 0.1);
  margin-bottom: 2rem;
  border: 1px solid var(--primary-200);
}

.badge-icon {
  font-size: 1.25rem;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: var(--color-heading);
  margin-bottom: 1.5rem;
  line-height: 1.1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-700), var(--primary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: inline-block;
}

.gradient-text::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  z-index: -1;
  background: linear-gradient(135deg, var(--primary-700), var(--primary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: blur(6px);
  opacity: 0.25;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text);
  max-width: 600px;
  margin: 0 auto 1.5rem; /* 减小底部边距，因为我们添加了专门的间距div */
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 1.2rem 2.4rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 14px;
  min-width: 220px;
  letter-spacing: 0.03em;
  box-shadow: 0 4px 16px rgba(125, 108, 192, 0.18);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  border: none;
  color: var(--white);
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
}

.btn-primary::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--primary-700), var(--primary-800));
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(125, 108, 192, 0.25);
  color: var(--white);
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-outline {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid var(--primary-300);
  color: var(--primary-700);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
}

.btn-outline::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--primary-100);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: -1;
}

.btn-outline:hover {
  background: transparent;
  border-color: var(--primary-400);
  transform: translateY(-4px);
  color: var(--primary-800);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
}

.btn-outline:hover::before {
  transform: scaleX(1);
  transform-origin: left;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

/* 删除重复的hero-title和hero-subtitle定义 */

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem;
  text-align: center;
  box-shadow: 0 5px 20px rgba(124, 58, 237, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
}

.feature-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  transform: scaleX(0);
  transition: transform 0.4s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 15px 30px rgba(124, 58, 237, 0.15);
  border-color: var(--primary-300);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  display: block;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.feature-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.feature-card p {
  color: var(--color-text);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  background: linear-gradient(
    135deg,
    var(--primary-50),
    var(--white),
    var(--primary-100)
  );
  padding: 3rem 2rem;
  border-radius: var(--border-radius-lg);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.1);
  border: 1px solid var(--primary-200);
  position: relative;
  overflow: hidden;
}

.stats::before {
  content: "";
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, var(--primary-200) 0%, transparent 70%);
  opacity: 0.4;
  filter: blur(60px);
}

.stat-item {
  text-align: center;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.5);
  padding: 2rem;
  border-radius: var(--border-radius);
  backdrop-filter: blur(5px);
  box-shadow: 0 5px 15px rgba(124, 58, 237, 0.08);
  border: 1px solid var(--primary-100);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(124, 58, 237, 0.15);
}

.stat-number {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary-700), var(--primary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(124, 58, 237, 0.2);
  line-height: 1.1;
}

.stat-label {
  color: var(--color-text);
  font-weight: 500;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.125rem;
  }

  .features {
    grid-template-columns: 1fr;
  }

  .stats {
    grid-template-columns: 1fr;
  }
}
</style>
