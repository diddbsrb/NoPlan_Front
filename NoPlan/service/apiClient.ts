import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'http://www.no-plan.cloud/api/v1/',
  timeout: 10000,
});
