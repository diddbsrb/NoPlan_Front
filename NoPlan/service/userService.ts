// service/userService.ts

import { apiClient } from './apiClient';

// 사용자 정보에 대한 인터페이스 정의
export interface UserInfo {
  id: number;
  name: string | null;
  email: string;
  is_info_exist: boolean;
}

export const userService = {
  // 사용자 세부 정보 업데이트 (POST)
  updateInfo: async (name: string, age: number, gender: string) => {
    return apiClient.post(
      '/users/me/info/',
      { name, age, gender });
  },

  /**
   * 기본 사용자 정보 조회 (이름, 이메일)
   * @returns Promise<UserInfo> - 사용자 정보 객체를 반환합니다.
   */
  getUserInfo: async (): Promise<UserInfo> => {
    try {
      // apiClient.get의 반환 타입에서 실제 데이터 타입을 명시해줍니다.
      const res = await apiClient.get<UserInfo>('/users/me/');
      console.log('📦 userService 응답 (res.data):', res.data);
      
      // *** 핵심 변경 사항: 전체 응답(res) 대신 실제 데이터(res.data)를 반환합니다. ***
      return res.data; 
    } catch (err: any) {
      console.log('❌ userService 에러:', err.response?.data || err.message);
      throw err; // 에러를 상위로 전파하여 컴포넌트에서 처리할 수 있도록 합니다.
    }
  },

  // 비밀번호 변경
  changePassword: async (oldPassword: string, newPassword1: string, newPassword2: string) => {
    return apiClient.put(
      '/users/password/change/',
      {
        old_password: oldPassword,
        new_password1: newPassword1,
        new_password2: newPassword2,
      }
    );
  },
};