import { ref, computed } from "vue";
import { useToast } from "./useToast.js";
import { getTeams } from "../services/api.js"; // Add this import

// 全局当前团队状态
const currentTeam = ref(null);
const userTeams = ref([]);
const isLoading = ref(false);

// 初始化团队状态
const initializeTeams = async () => {
  try {
    isLoading.value = true;
    // 从API获取用户的团队列表
    const teams = await getTeams();
    userTeams.value = teams;

    // 设置默认团队（第一个团队或从localStorage恢复）
    const savedTeamId = localStorage.getItem("currentTeamId");
    if (savedTeamId) {
      const savedTeam = userTeams.value.find(
        (team) => team.id === parseInt(savedTeamId)
      );
      if (savedTeam) {
        currentTeam.value = savedTeam;
        return;
      }
    }

    // 如果没有保存的团队或找不到，使用第一个团队
    if (userTeams.value.length > 0) {
      currentTeam.value = userTeams.value[0];
      localStorage.setItem("currentTeamId", currentTeam.value.id.toString());
    }
  } catch (error) {
    console.error("Failed to initialize teams:", error);
    const { showToast } = useToast();
    showToast("加载团队信息失败", "error");
  } finally {
    isLoading.value = false;
  }
};

// 切换当前团队
const switchTeam = (team) => {
  if (team && team.id !== currentTeam.value?.id) {
    currentTeam.value = team;
    localStorage.setItem("currentTeamId", team.id.toString());
    useToast().success(`已切换到团队：${team.name}`);
  }
};

// 清除团队状态（用于登出时）
const clearTeamState = () => {
  currentTeam.value = null;
  userTeams.value = [];
  localStorage.removeItem("currentTeamId");
};

// 添加新团队到列表
const addTeamToList = (team) => {
  userTeams.value.push(team);
  // 如果这是用户的第一个团队，自动设为当前团队
  if (userTeams.value.length === 1) {
    switchTeam(team);
  }
};

// 从列表中移除团队
const removeTeamFromList = (teamId) => {
  const index = userTeams.value.findIndex((team) => team.id === teamId);
  if (index > -1) {
    userTeams.value.splice(index, 1);
    // 如果删除的是当前团队，切换到第一个可用团队
    if (currentTeam.value?.id === teamId) {
      if (userTeams.value.length > 0) {
        switchTeam(userTeams.value[0]);
      } else {
        currentTeam.value = null;
        localStorage.removeItem("currentTeamId");
      }
    }
  }
};

export function useTeam() {
  return {
    currentTeam: computed(() => currentTeam.value),
    userTeams: computed(() => userTeams.value),
    isLoading: computed(() => isLoading.value),
    hasTeams: computed(() => userTeams.value.length > 0),
    initializeTeams,
    switchTeam,
    clearTeamState,
    addTeamToList,
    removeTeamFromList,
  };
}
