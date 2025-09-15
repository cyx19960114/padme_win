import axios from "axios";

const baseURL = "/";

/**
 * 获取当前用户的Station信息
 */
export const getCurrentStationInfo = async () => {
  try {
    const response = await axios.get(`${baseURL}api/station/info`);
    return response.data;
  } catch (error) {
    console.error("Failed to get current station info:", error);
    throw error;
  }
};

/**
 * 获取所有可用的Station信息
 */
export const getAllStations = async () => {
  try {
    const response = await axios.get(`${baseURL}api/station/all`);
    return response.data;
  } catch (error) {
    console.error("Failed to get all stations:", error);
    throw error;
  }
};

/**
 * 获取Station显示名称
 */
export const getStationDisplayName = (stationInfo) => {
  if (!stationInfo) return "Unknown Station";
  
  return `${stationInfo.stationName} (${stationInfo.stationId})`;
};

/**
 * 获取Station状态信息
 */
export const getStationStatus = (stationInfo) => {
  if (!stationInfo) return { status: "unknown", message: "Station information not available" };
  
  return {
    status: "active",
    message: `Connected as ${stationInfo.username} to ${stationInfo.stationName}`,
    stationId: stationInfo.stationId,
    stationName: stationInfo.stationName,
    username: stationInfo.username,
    email: stationInfo.email
  };
};
