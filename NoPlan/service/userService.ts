import { apiClient } from './apiClient';
import * as SecureStore from 'expo-secure-store';

export const userService = {
  // 사용자 세부 정보 업데이트 (POST)
  updateInfo: async (name: string, age: number, gender: string) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.post(
      '/users/me/info/',
      { name, age, gender },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },

  // 기본 사용자 정보 조회 (이름, 이메일)
  getUserInfo: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    console.log('🔑 userService 토큰:', token);
  
    try {
      const res = await apiClient.get(
        '/users/me/',
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      console.log('📦 userService 응답:', res.data);
      return res;
    } catch (err: any) {
      console.log('❌ userService 에러:', err.response?.data || err.message);
      throw err;
    }
  },

  changePassword: async (oldPassword: string, newPassword1: string, newPassword2: string) => {
    const token = await SecureStore.getItemAsync('accessToken');
    return apiClient.put(
      '/users/password/change/',
      {
        old_password: oldPassword,
        new_password1: newPassword1,
        new_password2: newPassword2,
      },
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  },
}
  

