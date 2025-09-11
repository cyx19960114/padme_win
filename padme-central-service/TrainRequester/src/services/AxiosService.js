import axios from "axios";
import UserService from "./UserService";

const baseUrl = process.env.REACT_APP_CS_API_ENDPOINT || "https://klee.informatik.rwth-aachen.de/centralservice-akhtar";

const _axios = axios.create({
  baseURL: baseUrl
});

const configureAxios = () => {
  _axios.interceptors.request.use((config) => {
    if (UserService.isLoggedIn()) {
      const callback = () => {
        config.headers.Authorization = `Bearer ${UserService.getToken()}`;
        return Promise.resolve(config);
      };
      return UserService.updateToken(callback);
    }
  });
};

export { configureAxios };
export default _axios;
