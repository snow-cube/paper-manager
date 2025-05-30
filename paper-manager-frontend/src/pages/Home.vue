<template>
  <div class="home">    <div class="hero">
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
          <span class="gradient-text">科研论文管理系统</span>
        </h1>
        <p class="hero-subtitle">高效管理您的学术研究资料，让知识更有序，助力科研创新</p>        <div class="hero-actions">
          <RouterLink to="/literature" class="btn btn-primary btn-lg">
            <span class="btn-icon">📚</span>
            文献管理
          </RouterLink>
          <RouterLink to="/publications" class="btn btn-secondary btn-lg">
            <span class="btn-icon">🎓</span>
            发表论文
          </RouterLink>
        </div>
      </div>
    </div>    <div class="features">
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
        <div class="feature-icon">🏷️</div>
        <h3>分类管理</h3>
        <p>创建自定义分类体系，让研究资料管理更加条理清晰</p>
        <RouterLink to="/categories" class="btn">分类管理</RouterLink>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <div class="stat-number">{{ stats.papers }}</div>
        <div class="stat-label">论文总数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.categories }}</div>
        <div class="stat-label">分类数量</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.authors }}</div>
        <div class="stat-label">作者数量</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from "vue-router";
import { ref, onMounted } from "vue";
import { getPapers, getCategories, getUsers } from "../services/api";

const stats = ref({
  papers: 0,
  categories: 0,
  authors: 0
});

const loading = ref(true);

onMounted(async () => {
  try {
    const [papers, categories, users] = await Promise.all([
      getPapers(),
      getCategories(),
      getUsers()
    ]);

    stats.value = {
      papers: papers?.length || 0,
      categories: categories?.length || 0,
      authors: users?.length || 0
    };
  } catch (error) {
    console.log('Failed to load stats:', error);
  } finally {
    loading.value = false;
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
  padding: 4rem 2rem;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--white) 50%, var(--primary-100) 100%);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
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
  background: linear-gradient(45deg, var(--primary-200), var(--primary-100));
  border-radius: 50%;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.hero-dots {
  position: absolute;
  top: 20%;
  left: 10%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--primary-300) 2px, transparent 2px);
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
  color: var(--color-primary);
  box-shadow: var(--shadow);
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
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-400));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text);
  max-width: 600px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  min-width: 200px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-500));
  border: none;
  color: var(--white);
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--primary-700), var(--primary-600));
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
}

.btn-outline {
  background: var(--white);
  border: 2px solid var(--primary-200);
  color: var(--color-primary);
}

.btn-outline:hover {
  background: var(--primary-50);
  border-color: var(--primary-300);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.25rem;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: var(--color-text);
  max-width: 600px;
  margin: 0 auto;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.feature-card {
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: 2.5rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-500), var(--primary-400));
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.feature-card:hover::before {
  transform: scaleX(1);
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-200);
}

.feature-icon {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  display: block;
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
  background: linear-gradient(135deg, var(--primary-50), var(--color-background-soft));
  padding: 3rem 2rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--primary-100);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(14, 165, 233, 0.1);
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
