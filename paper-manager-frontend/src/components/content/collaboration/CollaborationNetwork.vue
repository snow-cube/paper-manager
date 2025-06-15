<template>
  <div class="collaboration-network">
    <div class="network-header">
      <h3 class="network-title">{{ authorName }} 的合作网络</h3>
      <div class="network-stats">
        <span class="stat-item">
          <strong>{{ totalCollaborators }}</strong> 位合作者
        </span>
        <span class="stat-item">
          <strong>{{ totalPapers }}</strong> 篇合作论文
        </span>
      </div>
    </div>

    <div class="network-controls">
      <button @click="centerNetwork" class="control-btn" title="居中显示">
        🎯 居中
      </button>
      <button @click="resetZoom" class="control-btn" title="重置缩放">
        🔍 重置
      </button>
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color main-author"></div>
          <span>目标作者</span>
        </div>
        <div class="legend-item">
          <div class="legend-color collaborator"></div>
          <span>合作者</span>
        </div>
      </div>
    </div>

    <div
      ref="networkContainer"
      class="network-container"
      @wheel="handleWheel"
    ></div>

    <div v-if="selectedCollaborator" class="collaborator-details">
      <h4>{{ selectedCollaborator.name }}</h4>
      <p>
        <strong>合作次数:</strong>
        {{ selectedCollaborator.collaboration_count }}
      </p>
      <div class="collaboration-papers">
        <h5>合作论文:</h5>
        <ul>
          <li
            v-for="paper in selectedCollaborator.papers"
            :key="paper.paper_id"
            class="paper-item"
          >
            <span class="paper-info">
              论文 #{{ paper.paper_id }} (第{{ paper.author_order }}作者)
              <span v-if="paper.is_corresponding" class="corresponding-badge"
                >通讯</span
              >
            </span>
          </li>
        </ul>
      </div>
      <button @click="selectedCollaborator = null" class="close-details">
        ✕ 关闭
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
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
  if (!networkContainer.value) return;

  const container = networkContainer.value;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // 清空容器
  d3.select(container).selectAll("*").remove();

  // 创建SVG
  svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

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

  // 创建力导向仿真
  simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.id)
        .distance(100)
    )
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(30));

  // 创建连线
  linkElements = container_g
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("class", "link")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", (d) => Math.sqrt(d.weight) * 2);

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
    );

  // 添加节点圆圈
  nodeElements
    .append("circle")
    .attr("r", (d) => (d.type === "main" ? 20 : 15))
    .attr("fill", (d) => (d.type === "main" ? "#ff6b35" : "#4ecdc4"))
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .on("click", (event, d) => {
      if (d.type === "collaborator") {
        selectedCollaborator.value = d.data;
      }
    })
    .on("mouseover", (event, d) => {
      // 高亮相关连线
      linkElements
        .attr("stroke-opacity", (l) =>
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
        )
        .attr("stroke-width", (l) =>
          l.source.id === d.id || l.target.id === d.id
            ? Math.sqrt(l.weight) * 3
            : Math.sqrt(l.weight) * 2
        );
    })
    .on("mouseout", () => {
      // 恢复默认样式
      linkElements
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d) => Math.sqrt(d.weight) * 2);
    });

  // 添加节点标签
  nodeElements
    .append("text")
    .text((d) => d.name)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", "12px")
    .attr("fill", "#333")
    .attr("pointer-events", "none");

  // 添加合作次数标签
  nodeElements
    .filter((d) => d.type === "collaborator")
    .append("text")
    .text((d) => d.collaborationCount)
    .attr("text-anchor", "middle")
    .attr("dy", "25px")
    .attr("font-size", "10px")
    .attr("fill", "#666")
    .attr("pointer-events", "none");

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

  const width = networkContainer.value.clientWidth;
  const height = networkContainer.value.clientHeight;

  svg
    .transition()
    .duration(750)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
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
    initNetwork();
  }
};

onMounted(() => {
  initNetwork();
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
    initNetwork();
  },
  { deep: true }
);
</script>

<style scoped>
.collaboration-network {
  width: 100%;
  height: 100%;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

.network-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.network-title {
  margin: 0;
  color: #333;
  font-size: 1.2em;
}

.network-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  font-size: 0.9em;
  color: #666;
}

.network-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.control-btn {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
}

.control-btn:hover {
  background: #f5f5f5;
}

.legend {
  display: flex;
  gap: 15px;
  margin-left: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85em;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid #fff;
}

.legend-color.main-author {
  background: #ff6b35;
}

.legend-color.collaborator {
  background: #4ecdc4;
}

.network-container {
  width: 100%;
  height: 100%; /* 使用100%高度而不是固定像素值 */
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  overflow: hidden;
  cursor: grab;
}

.network-container:active {
  cursor: grabbing;
}

.collaborator-details {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 250px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.collaborator-details h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.collaborator-details p {
  margin: 0 0 10px 0;
  color: #666;
}

.collaboration-papers h5 {
  margin: 10px 0 5px 0;
  color: #333;
}

.collaboration-papers ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.paper-item {
  padding: 5px 0;
  border-bottom: 1px solid #eee;
  font-size: 0.85em;
}

.paper-item:last-child {
  border-bottom: none;
}

.corresponding-badge {
  background: #ff6b35;
  color: white;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 0.75em;
  margin-left: 5px;
}

.close-details {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 0.9em;
}

.close-details:hover {
  color: #333;
}

/* 节点样式 */
:deep(.node) {
  cursor: pointer;
}

:deep(.node circle) {
  transition: all 0.2s ease;
}

:deep(.node:hover circle) {
  stroke-width: 3px;
  filter: brightness(1.1);
}

:deep(.link) {
  transition: all 0.2s ease;
}
</style>
