import axios from "axios";

const baseUrl = "/";
const localhost = "http://127.0.0.1:3030";

const axiosInstance = axios.create({
  baseURL: process.env.NODE_ENV === "production" ? baseUrl : localhost,
  timeout: 5000 * 60, // (5000 = 5 sec) * 60 = 5 mins
});

export default axiosInstance;
