const axios = require("axios");

module.exports = {
  createJobMetadata: async (payload, token) => {
    const monitoringApiUrl = `${process.env.MONITORING_API_ADDRESS}/jobs`;
    const result = await axios.post(monitoringApiUrl, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return result.data;
  }
}