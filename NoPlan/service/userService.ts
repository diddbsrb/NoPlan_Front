// service/userService.ts

import { apiClient } from './apiClient';

// 사용자 정보에 대한 인터페이스 정의
// ★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ 여기에 is_kakao_linked 를 추가하는 것이 핵심입니다. ★★★
// ★★★★★★★★★★★★★★★★★★★★★★★★
export interface UserInfo {
  id: number;
  name: string | null;
  email: string;
  is_info_exist: boolean;
  is_kakao_linked: boolean; // 👈 이 필드를 추가합니다.
}

export const userService = {
  // 사용자 세부 정보 업데이트 (POST)
  updateInfo: async (name: string, age: number, gender: string) => {
    return apiClient.post(
      '/users/me/info/',
      { name, age, gender });
  },

  /**
   * 기본 사용자 정보 조회 (이름, 이메일, 카카오 연동 여부 등)
   * @returns Promise<UserInfo> - 사용자 정보 객체를 반환합니다.
   */
  getUserInfo: async (): Promise<UserInfo> => {
    try {
      // 이제 apiClient.get의 제네릭 타입이 올바르므로 데이터가 누락되지 않습니다.
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

  // 회원 탈퇴
  withdrawAccount: async () => {
    try {
      const response = await apiClient.delete('/users/me/withdraw/');
      console.log('✅ 회원 탈퇴 성공:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ 회원 탈퇴 실패:', error.response?.data || error.message);
      throw error;
    }
  },
};