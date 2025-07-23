import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';

export const userService = {
  updateInfo: async (name: string, age: number, gender: string) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.post(
      '/users/me/info/',
      { name, age, gender },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
}; 