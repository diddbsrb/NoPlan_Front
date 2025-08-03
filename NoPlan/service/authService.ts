// service/authService.ts

import { apiClient } from './apiClient';
// 로그아웃 시 서버에 보낼 refresh 토큰을 가져오기 위해 SecureStore를 import 합니다.
import * as SecureStore from 'expo-secure-store';

export const authService = {
  /**
   * 회원가입을 요청합니다.
   */
  signUp: (email: string, password: string, password2: string) =>
    apiClient.post('/users/register/', { email, password, password2 }),

  /**
   * 로그인을 요청하고, 성공 시 토큰을 반환받습니다.
   */
  signIn: (email: string, password: string) =>
    apiClient.post('/users/login/', { email, password }),

   // ★★★ 카카오 로그인을 위한 함수 추가 ★★★
  // 백엔드에 인가 코드를 보내고 우리 서비스의 토큰을 받아옵니다.
  kakaoLogin: (code: string) => {
    console.log(`[authService] 카카오 인가 코드 전송: ${code}`);
    return apiClient.post('/users/kakao/', { code });
  },
  
  /**
   * *** 신규 추가된 로그아웃 함수 ***
   * 서버에 refresh 토큰을 전송하여 만료시키도록 요청합니다.
   */
  logout: async (): Promise<void> => {
    try {
      // 1. 디바이스에 저장된 refresh 토큰을 가져옵니다.
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      // 2. refresh 토큰이 없으면 서버에 요청할 필요가 없으므로 함수를 종료합니다.
      if (!refreshToken) {
        console.log('로그아웃: 로컬에 refresh 토큰이 없어 서버 요청을 건너뜁니다.');
        return;
      }
      
      console.log('서버에 로그아웃(토큰 만료)을 요청합니다.');
      // 3. API 명세에 따라 POST 요청을 보냅니다. Body에는 refresh 토큰을 담습니다.
      await apiClient.post('/users/logout/', {
        refresh: refreshToken,
      });

      console.log('서버의 refresh 토큰이 성공적으로 만료되었습니다.');

    } catch (error: any) {
      console.error('서버 로그아웃 요청 실패:', error.response?.data || error.message);
      // 서버 로그아웃에 실패하더라도 클라이언트 측의 로그아웃 절차는 계속 진행되어야 하므로,
      // 여기서 에러를 다시 던지지 않을 수 있습니다. 
      // 하지만 개발 중에는 원인을 파악하기 위해 에러를 확인하는 것이 좋습니다.
    }
  },
};

