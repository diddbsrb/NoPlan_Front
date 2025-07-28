import axios from 'axios';

export const apiClient = axios.create({
  baseURL: 'https://www.no-plan.cloud/api/v1',
  timeout: 10000,
});
