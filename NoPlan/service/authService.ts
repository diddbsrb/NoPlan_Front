import { apiClient } from './apiClient';

export const authService = {
  signUp: (email: string, password: string, password2: string) =>
    apiClient.post('/users/register/', { email, password, password2 }),
  signIn: (email: string, password: string) =>
    apiClient.post('/users/login/', { email, password }),
}; 