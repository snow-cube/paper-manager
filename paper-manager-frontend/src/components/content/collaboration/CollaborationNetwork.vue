<template>
  <div class="collaboration-network">
    <div class="network-header">
      <div class="header-content">
        <h3 class="network-title">
          <span class="title-icon">🌐</span>
          {{ authorName }} 的合作网络
        </h3>
        <div class="network-stats">
          <div class="stat-card">
            <span class="stat-value">{{ totalCollaborators }}</span>
            <span class="stat-label">合作者</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalPapers }}</span>
            <span class="stat-label">合作论文</span>
          </div>
        </div>
      </div>

      <div class="network-controls">
        <div class="control-group">
          <button
            @click="centerNetwork"
            class="control-btn btn-primary"
            title="居中显示"
          >
            <span class="btn-icon">🎯</span>
            <span class="btn-text">居中</span>
          </button>
          <button
            @click="resetZoom"
            class="control-btn btn-secondary"
            title="重置缩放"
          >
            <span class="btn-icon">🔍</span>
            <span class="btn-text">重置</span>
          </button>
        </div>

        <div class="legend">
          <div class="legend-title">图例</div>
          <div class="legend-items">
            <div class="legend-item">
              <div class="legend-color main-author"></div>
              <span class="legend-text">目标作者</span>
            </div>
            <div class="legend-item">
              <div class="legend-color collaborator"></div>
              <span class="legend-text">合作者</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="network-body">
      <div
        ref="networkContainer"
        class="network-container"
        @wheel="handleWheel"
      ></div>

      <div v-if="selectedCollaborator" class="collaborator-details">
        <div class="details-header">
          <div class="collaborator-avatar">
            {{ selectedCollaborator.name.charAt(0) }}
          </div>
          <div class="collaborator-info">
            <h4 class="collaborator-name">{{ selectedCollaborator.name }}</h4>
            <div class="collaboration-stats">
              <span class="collaboration-count">
                合作 {{ selectedCollaborator.collaboration_count }} 次
              </span>
            </div>
          </div>
          <button @click="selectedCollaborator = null" class="close-details">
            <span class="close-icon">✕</span>
          </button>
        </div>

        <div class="collaboration-papers">
          <h5 class="papers-title">
            <span class="papers-icon">📄</span>
            合作论文
          </h5>
          <div class="papers-list">
            <div
              v-for="paper in selectedCollaborator.papers"
              :key="paper.paper_id"
              class="paper-item"
            >
              <div class="paper-id">论文 #{{ paper.paper_id }}</div>
              <div class="paper-meta">
                <span class="author-order">第{{ paper.author_order }}作者</span>
                <span v-if="paper.is_corresponding" class="corresponding-badge">
                  ✓ 通讯作者
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import * as d3 from "d3";

const props = defineProps({
  networkData: {
    type: Object,
    required: true,
  },
});

const networkContainer = ref(null);
const selectedCollaborator = ref(null);

// 计算属性
const authorName = computed(() => {
  const authorData = props.networkData.author;
  console.log("Author data:", authorData, typeof authorData);

  if (!authorData) return "未知作者";

  // 如果是字符串，直接返回
  if (typeof authorData === "string") return authorData;

  // 如果是对象，尝试获取 name 属性
  if (typeof authorData === "object") {
    // 处理 name 为字符串的情况
    if (typeof authorData.name === "string") {
      return authorData.name;
    }
    // 处理 name 为对象的情况
    if (typeof authorData.name === "object" && authorData.name?.name) {
      return authorData.name.name;
    }
    // 尝试其他可能的属性
    if (authorData.author_name) return authorData.author_name;
    if (authorData.author) return authorData.author;
  }

  return "未知作者";
});

const author = computed(() => {
  const authorData = props.networkData.author || {};

  // 提取 ID
  let authorId = "main_author"; // 默认值
  if (typeof authorData === "object") {
    authorId =
      authorData.id ||
      authorData.author_id ||
      authorData.name?.id ||
      "main_author";
  }

  return {
    id: authorId,
    name: authorName.value,
  };
});
const totalCollaborators = computed(
  () => props.networkData.total_collaborators || 0
);
const collaborators = computed(() => props.networkData.collaborators || []);
const totalPapers = computed(() => {
  return collaborators.value.reduce(
    (sum, collab) => sum + collab.papers.length,
    0
  );
});

// D3 变量
let svg, simulation, nodes, links, nodeElements, linkElements, zoom;

// 创建网络数据
const createNetworkData = () => {
  const networkNodes = [
    {
      id: author.value.id,
      name: author.value.name,
      type: "main",
      collaborationCount: 0,
    },
  ];

  const networkLinks = [];

  collaborators.value.forEach((collaborator) => {
    networkNodes.push({
      id: collaborator.author_id,
      name: collaborator.name,
      type: "collaborator",
      collaborationCount: collaborator.collaboration_count,
      data: collaborator,
    });

    networkLinks.push({
      source: author.value.id,
      target: collaborator.author_id,
      weight: collaborator.collaboration_count,
    });
  });

  return { nodes: networkNodes, links: networkLinks };
};

// 初始化网络图
const initNetwork = () => {
  if (!networkContainer.value) {
    console.warn("网络容器未找到");
    return;
  }

  const container = networkContainer.value;
  const width = container.clientWidth || 800; // 提供默认宽度
  const height = container.clientHeight || 600; // 提供默认高度

  // 如果高度仍然为0，使用父容器高度或设置最小高度
  const actualHeight =
    height > 0 ? height : Math.max(container.offsetHeight, 600);
  const actualWidth = width > 0 ? width : Math.max(container.offsetWidth, 800);

  console.log("容器尺寸:", { width, height, actualWidth, actualHeight });

  // 清空容器
  d3.select(container).selectAll("*").remove();
  // 创建SVG
  svg = d3
    .select(container)
    .append("svg")
    .attr("width", actualWidth)
    .attr("height", actualHeight)
    .style("min-height", "600px"); // 确保最小高度

  // 创建缩放功能
  zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      svg.select("g").attr("transform", event.transform);
    });

  svg.call(zoom);

  // 创建主容器组
  const container_g = svg.append("g");
  // 获取网络数据
  const networkData = createNetworkData();
  nodes = networkData.nodes;
  links = networkData.links;

  console.log("网络数据:", { nodes: nodes.length, links: links.length });
  // 创建力导向仿真
  simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(120)
        .strength(0.8)
    )
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(actualWidth / 2, actualHeight / 2))
    .force("collision", d3.forceCollide().radius(35)); // 创建连线
  linkElements = container_g
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#f2effc") // 淡紫色连线
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", (d) => Math.sqrt(d.weight) * 2.5)
    .style("stroke-linecap", "round");

  // 创建节点
  nodeElements = container_g
    .append("g")
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    ); // 添加节点圆圈
  nodeElements
    .append("circle")
    .attr("r", (d) => (d.type === "main" ? 22 : 16))
    .attr("fill", (d) => (d.type === "main" ? "#9f90d9" : "#22c55e")) // 使用具体的十六进制颜色
    .attr("stroke", "#ffffff") // 白色边框
    .attr("stroke-width", 3)
    .style("filter", "drop-shadow(0px 2px 6px rgba(99, 102, 241, 0.15))")
    .on("click", (event, d) => {
      if (d.type === "collaborator") {
        selectedCollaborator.value = d.data;
      }
    })
    .on("mouseover", (event, d) => {
      // 高亮相关连线和节点
      nodeElements
        .select("circle")
        .attr("stroke", (n) => {
          if (n.id === d.id) {
            // 当前悬停节点使用亮色边框
            return n.type === "main" ? "#d6cef2" : "#86efac"; // 更亮的紫色和绿色
          } else if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          ) {
            // 相连节点使用中等亮度边框
            return n.type === "main" ? "#bbaee6" : "#4ade80"; // 中等亮度的紫色和绿色
          }
          return "#ffffff"; // 非相关节点保持白色边框
        })
        .attr("stroke-width", (n) => {
          if (n.id === d.id) return 4;
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return 3;
          return 3; // 保持较粗的白色边框以确保可见性
        })
        .attr("fill", (n) => {
          if (n.id === d.id) {
            // 当前悬停节点使用亮色填充
            return n.type === "main" ? "#bbaee6" : "#4ade80"; // 亮紫色和亮绿色
          } else if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          ) {
            // 相连节点保持原色
            return n.type === "main" ? "#9f90d9" : "#22c55e"; // 原始紫色和绿色
          }
          // 非相关节点使用稍微暗一点但仍然清晰可见的颜色
          return n.type === "main" ? "#bbaee6" : "#4ade80"; // 保持亮色，避免显示为黑色
        })
        .style("filter", (n) => {
          if (n.id === d.id) {
            return n.type === "main"
              ? "drop-shadow(0px 4px 12px rgba(99, 102, 241, 0.4))"
              : "drop-shadow(0px 4px 12px rgba(16, 185, 129, 0.4))";
          } else if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          ) {
            return n.type === "main"
              ? "drop-shadow(0px 3px 8px rgba(99, 102, 241, 0.3))"
              : "drop-shadow(0px 3px 8px rgba(16, 185, 129, 0.3))";
          }
          return n.type === "main"
            ? "drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.15))"
            : "drop-shadow(0px 2px 4px rgba(16, 185, 129, 0.15))";
        })
        .attr("fill-opacity", (n) => {
          if (n.id === d.id) return 1;
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return 1;
          return 0.7; // 非相关节点适当降低不透明度但保持可见
        });
      linkElements
        .attr("stroke", (l) => {
          // 高亮连线使用主题色
          return l.source.id === d.id || l.target.id === d.id
            ? "#bbaee6"
            : "#f2effc"; // 亮紫色和淡紫色
        })
        .attr("stroke-opacity", (l) =>
          l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.3
        )
        .attr("stroke-width", (l) =>
          l.source.id === d.id || l.target.id === d.id
            ? Math.sqrt(l.weight) * 3.5
            : Math.sqrt(l.weight) * 2
        ); // 高亮合作次数标签
      nodeElements
        .select(".collaboration-count-bg")
        .attr("fill", (n) => {
          if (n.id === d.id) return "#22c55e"; // 绿色背景
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return "#ffffff"; // 白色背景
          return "#ffffff"; // 非相关节点也保持白色背景
        })
        .attr("stroke", (n) => {
          if (n.id === d.id) return "#16a34a"; // 深绿色边框
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return "#4ade80"; // 亮绿色边框
          return "#86efac"; // 非相关节点保持淡绿色边框
        })
        .attr("stroke-width", (n) => {
          if (n.id === d.id) return 2.5;
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return 2;
          return 1.5; // 保持原有边框宽度
        })
        .attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return 0.95;
          return 0.8; // 适当降低但保持可见
        });
      nodeElements
        .selectAll("text")
        .filter(function () {
          return d3.select(this).attr("dy") === "38px";
        })
        .attr("fill", (n) => {
          if (n.id === d.id) return "#ffffff"; // 白色文字
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return "#16a34a"; // 深绿色文字
          return "#16a34a"; // 非相关节点也保持深绿色文字
        })
        .attr("font-weight", (n) => {
          if (n.id === d.id) return "700";
          if (
            links.some(
              (l) =>
                (l.source.id === d.id && l.target.id === n.id) ||
                (l.target.id === d.id && l.source.id === n.id)
            )
          )
            return "600";
          return "600"; // 保持字体粗细
        });
    })
    .on("mouseout", () => {
      // 恢复默认样式
      nodeElements
        .select("circle")
        .attr("stroke", "#ffffff") // 白色边框
        .attr("stroke-width", 3)
        .attr("fill", (d) => (d.type === "main" ? "#9f90d9" : "#22c55e")) // 恢复原始颜色
        .style("filter", "drop-shadow(0px 2px 6px rgba(99, 102, 241, 0.15))")
        .attr("fill-opacity", 1);
      linkElements
        .attr("stroke", "#f2effc") // 淡紫色连线
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d) => Math.sqrt(d.weight) * 2.5);

      // 恢复合作次数标签样式
      nodeElements
        .select(".collaboration-count-bg")
        .attr("fill", "#ffffff") // 白色背景
        .attr("stroke", "#86efac") // 绿色边框
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.95);

      nodeElements
        .selectAll("text")
        .filter(function () {
          return d3.select(this).attr("dy") === "38px";
        })
        .attr("fill", "#16a34a") // 深绿色文字
        .attr("font-weight", "600");
    }); // 添加节点标签
  nodeElements
    .append("text")
    .text((d) => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", (d) => (d.type === "main" ? "13px" : "11px"))
    .attr("font-weight", (d) => (d.type === "main" ? "700" : "600"))
    .attr("fill", "#ffffff") // 白色文字
    .attr("pointer-events", "none")
    .style("text-shadow", "0px 1px 2px rgba(0, 0, 0, 0.3)"); // 添加合作次数标签背景
  nodeElements
    .filter((d) => d.type === "collaborator")
    .append("rect")
    .attr("class", "collaboration-count-bg")
    .attr("x", -14)
    .attr("y", 26)
    .attr("width", 28)
    .attr("height", 18)
    .attr("rx", 9)
    .attr("fill", "#ffffff") // 白色背景
    .attr("stroke", "#86efac") // 绿色边框
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.95)
    .style("filter", "drop-shadow(0px 1px 3px rgba(16, 185, 129, 0.2))");

  // 添加合作次数标签
  nodeElements
    .filter((d) => d.type === "collaborator")
    .append("text")
    .text((d) => d.collaborationCount)
    .attr("text-anchor", "middle")
    .attr("dy", "38px")
    .attr("font-size", "11px")
    .attr("font-weight", "600")
    .attr("fill", "#16a34a") // 深绿色文字
    .attr("pointer-events", "none")
    .style("text-shadow", "0px 1px 2px rgba(255, 255, 255, 0.8)");

  // 更新仿真
  simulation.on("tick", () => {
    linkElements
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    nodeElements.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });
};

// 拖拽事件处理
const dragstarted = (event, d) => {
  if (!event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
};

const dragged = (event, d) => {
  d.fx = event.x;
  d.fy = event.y;
};

const dragended = (event, d) => {
  if (!event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
};

// 控制函数
const centerNetwork = () => {
  if (!svg || !networkContainer.value) return;

  const container = networkContainer.value;
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  const actualHeight =
    height > 0 ? height : Math.max(container.offsetHeight, 600);
  const actualWidth = width > 0 ? width : Math.max(container.offsetWidth, 800);

  svg
    .transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(actualWidth / 2, actualHeight / 2).scale(1)
    );
};

const resetZoom = () => {
  if (!svg) return;

  svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
};

const handleWheel = (event) => {
  event.preventDefault();
};

// 监听窗口大小变化
const handleResize = () => {
  if (networkContainer.value) {
    // 延迟重新初始化，等待布局完成
    setTimeout(() => {
      initNetwork();
    }, 100);
  }
};

onMounted(() => {
  // 延迟初始化，确保DOM完全渲染
  nextTick(() => {
    setTimeout(() => {
      initNetwork();
    }, 100);
  });
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  if (simulation) {
    simulation.stop();
  }
  window.removeEventListener("resize", handleResize);
});

// 监听数据变化
watch(
  () => props.networkData,
  () => {
    nextTick(() => {
      setTimeout(() => {
        initNetwork();
      }, 100);
    });
  },
  { deep: true }
);
</script>

<style scoped>
/* 主容器 */
.collaboration-network {
  width: 100%;
  height: 100%;
  min-height: 750px; /* 进一步提高最小高度，给图更多空间 */
  background: var(--white);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-100);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-sm);
}

/* 头部区域 */
.network-header {
  background: var(--primary-25);
  border-bottom: 1px solid var(--primary-100);
  padding: var(--space-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  gap: var(--space-lg);
}

.network-title {
  margin: 0;
  color: var(--primary-700);
  font-size: var(--text-lg);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.title-icon {
  font-size: var(--text-xl);
}

.network-stats {
  display: flex;
  gap: var(--space-md);
}

.stat-card {
  background: var(--white);
  padding: var(--space-md);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-xs);
  border: 1px solid var(--primary-100);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 100px;
}

.stat-value {
  color: var(--primary-600);
  font-weight: 600;
  font-size: var(--text-lg);
  line-height: 1;
}

.stat-label {
  color: var(--color-text);
  font-size: var(--text-sm);
  line-height: 1;
  white-space: nowrap;
}

/* 控制器区域 */
.network-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-lg);
}

.control-group {
  display: flex;
  gap: var(--space-sm);
}

.control-btn {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: var(--text-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  border: none;
  transition: all var(--transition-normal);
  height: 36px;
}

.btn-primary {
  background: var(--primary-500);
  color: var(--white);
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background: var(--white);
  color: var(--primary-600);
  border: 1px solid var(--primary-300);
}

.btn-secondary:hover {
  background: var(--primary-50);
  border-color: var(--primary-500);
  color: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn-icon {
  font-size: var(--text-sm);
}

.btn-text {
  font-size: var(--text-sm);
}

/* 图例 */
.legend {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background: var(--white);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-100);
  box-shadow: var(--shadow-xs);
}

.legend-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--primary-700);
}

.legend-items {
  display: flex;
  gap: var(--space-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.legend-text {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--white);
  box-shadow: var(--shadow-xs);
}

.legend-color.main-author {
  background: var(--primary-500);
}

.legend-color.collaborator {
  background: var(--success-500);
}

/* 网络容器主体 */
.network-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 580px; /* 大幅提高图形区域高度，给网络图更多绘制空间 */
}

.network-container {
  width: 100%;
  height: 100%;
  min-height: 600px; /* 确保最小高度 */
  background: var(--white);
  cursor: grab;
  position: relative;
}

.network-container:active {
  cursor: grabbing;
}

/* 合作者详情面板 */
.collaborator-details {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 280px;
  background: var(--white);
  border: 1px solid var(--primary-100);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  overflow: hidden;
}

.details-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  background: var(--primary-25);
  border-bottom: 1px solid var(--primary-100);
  position: relative;
}

.collaborator-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--success-500);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.collaborator-info {
  flex: 1;
  min-width: 0;
}

.collaborator-name {
  margin: 0 0 var(--space-xs) 0;
  color: var(--color-heading);
  font-size: var(--text-base);
  font-weight: 600;
  line-height: 1.3;
}

.collaboration-stats {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.collaboration-count {
  color: var(--success-600);
  font-size: var(--text-sm);
  font-weight: 500;
}

.close-details {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  width: 28px;
  height: 28px;
  background: var(--white);
  border: 1px solid var(--primary-200);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  color: var(--color-text);
  transition: all var(--transition-normal);
}

.close-details:hover {
  background: var(--error-50);
  border-color: var(--error-300);
  color: var(--error-600);
  transform: scale(1.05);
}

.close-icon {
  font-size: var(--text-xs);
}

/* 合作论文列表 */
.collaboration-papers {
  padding: var(--space-lg);
}

.papers-title {
  margin: 0 0 var(--space-md) 0;
  color: var(--primary-700);
  font-size: var(--text-base);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.papers-icon {
  font-size: var(--text-sm);
}

.papers-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 200px;
  overflow-y: auto;
}

.paper-item {
  background: var(--primary-25);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius);
  border: 1px solid var(--primary-100);
  transition: all var(--transition-normal);
}

.paper-item:hover {
  background: var(--primary-50);
  border-color: var(--primary-200);
  transform: translateY(-1px);
  box-shadow: var(--shadow-xs);
}

.paper-id {
  font-weight: 600;
  color: var(--primary-700);
  font-size: var(--text-sm);
  margin-bottom: var(--space-xs);
}

.paper-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--text-xs);
}

.author-order {
  color: var(--color-text);
  background: var(--white);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--primary-100);
}

.corresponding-badge {
  background: var(--success-100);
  color: var(--success-700);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 600;
  border: 1px solid var(--success-200);
}

/* D3 节点和连线样式 */
:deep(.node) {
  cursor: pointer;
}

:deep(.node circle) {
  transition: all var(--transition-normal);
  filter: drop-shadow(0px 2px 4px rgba(99, 102, 241, 0.1));
}

:deep(.node:hover circle) {
  stroke-width: 3px;
  filter: drop-shadow(0px 4px 8px rgba(99, 102, 241, 0.2)) brightness(1.05);
  transform: scale(1.08);
}

:deep(.collaboration-count-bg) {
  transition: all var(--transition-normal);
  filter: drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.1));
}

:deep(.node:hover .collaboration-count-bg) {
  filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.15));
  transform: scale(1.05);
}

:deep(.node text[dy="38px"]) {
  transition: all var(--transition-normal);
  text-shadow: 0px 1px 2px rgba(255, 255, 255, 0.8);
}

:deep(.link) {
  transition: all var(--transition-normal);
}
</style>
