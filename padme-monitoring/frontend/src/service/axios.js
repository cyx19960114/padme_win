import axios from 'axios';

import config from '../config';
import KeycloakService from './keycloak';

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
});

function configureAxios() {
  axiosInstance.interceptors.request.use(
    async (config) => {
      if (KeycloakService.isLoggedIn()) {
        try {
          await KeycloakService.updateToken(10);
          config.headers.Authorization = `Bearer ${KeycloakService.getToken()}`;
        } catch (error) {
          console.error('Failed to update token', error);
          // Redirect to login
          KeycloakService.doLogin();
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
}

export { configureAxios };
export default axiosInstance;
