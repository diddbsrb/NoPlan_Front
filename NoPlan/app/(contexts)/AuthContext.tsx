// app/(contexts)/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { apiClient } from '../../service/apiClient';
import { UserInfo } from '../../service/userService';


interface AuthContextType {
  userInfo: UserInfo | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (access: string, refresh: string, user: UserInfo) => Promise<void>;
  logout: (isSilent?: boolean) => void;
  refreshUserInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 앱 시작 시 토큰 유효성 검사 및 라우팅
  useEffect(() => {
    const loadAuthDataAndRoute = async () => {
      try {
        const token = await SecureStore.getItemAsync('accessToken');
        const savedLoginState = await SecureStore.getItemAsync('isLoggedIn');
        const savedTravelState = await SecureStore.getItemAsync('isTraveling');
        
        console.log('[AuthContext] 저장된 상태 확인:', { 
          hasToken: !!token, 
          isLoggedIn: savedLoginState, 
          isTraveling: savedTravelState 
        });

        // 로그인 상태가 false이거나 토큰이 없으면 완전히 로그아웃 상태로 처리
        if (!token || savedLoginState !== 'true') {
          console.log('[AuthContext] 로그인되지 않은 상태 - 모든 데이터 정리');
          await logout(true); // 조용한 로그아웃으로 기존 데이터 정리
          router.replace('/(tabs)' as any);
          return;
        }

        // 토큰이 있고 로그인 상태가 true인 경우에만 사용자 정보 검증
        console.log('[AuthContext] 토큰 검증 시작');
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const response = await apiClient.get<UserInfo>('/users/me/');
          console.log('[AuthContext] 사용자 정보 검증 성공:', response.data);
          
          setUserInfo(response.data);
          setAccessToken(token);
          
          // 여행 상태에 따른 라우팅
          if (savedTravelState === 'true') {
            console.log('[AuthContext] 로그인 상태 + 여행 중 -> home_travel 화면');
            router.replace('home_travel' as any);
          } else {
            console.log('[AuthContext] 로그인 상태 + 여행 중 아님 -> home 화면');
            router.replace('home' as any);
          }
        } catch (e: any) {
          console.error('[AuthContext] 토큰 검증 실패:', e.response?.status, e.response?.data);
          // 토큰이 유효하지 않으면 완전히 로그아웃 처리
          await logout(true);
          console.log('[AuthContext] 로그아웃 상태 -> (tabs) 기본 화면');
          router.replace('/(tabs)' as any);
        }
      } catch (e) {
        console.error('[AuthContext] 인증 상태 확인 실패:', e);
        // 에러 발생 시 완전히 로그아웃 처리
        await logout(true);
        router.replace('/(tabs)' as any);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuthDataAndRoute();
  }, []);

  const login = async (access: string, refresh: string, user: UserInfo) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    await SecureStore.setItemAsync('isLoggedIn', 'true');
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    setAccessToken(access);
    setUserInfo(user);
  };

  // ★★★ isSilent 파라미터를 받도록 수정되었습니다. ★★★
  const logout = async (isSilent = false) => {
    console.log('[AuthContext] 로그아웃 시작');
    
    // isSilent 플래그가 true가 아닐 때만 서버에 로그아웃 요청을 보냅니다.
    if (!isSilent) {
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          await apiClient.post('/users/logout/', { refresh: refreshToken });
          console.log('[AuthContext] 서버 로그아웃 성공');
        }
      } catch(e) {
        console.error("[AuthContext] 서버 로그아웃 실패", e);
      }
    }
    
    // 공통 로컬 정리 로직
    console.log('[AuthContext] 로컬 데이터 정리 시작');
    
    // API 클라이언트 헤더 정리
    apiClient.defaults.headers.common['Authorization'] = undefined;
    
    // SecureStore에서 모든 인증 관련 데이터 삭제
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.setItemAsync('isLoggedIn', 'false');
    await SecureStore.setItemAsync('isTraveling', 'false');
    
    // 상태 초기화 - 즉시 실행
    setAccessToken(null);
    setUserInfo(null);
    
    // 추가 검증: 모든 데이터가 정리되었는지 확인
    const remainingToken = await SecureStore.getItemAsync('accessToken');
    const remainingLoginState = await SecureStore.getItemAsync('isLoggedIn');
    
    if (remainingToken || remainingLoginState === 'true') {
      console.warn('[AuthContext] 일부 데이터가 남아있어 강제로 정리합니다.');
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.setItemAsync('isLoggedIn', 'false');
      await SecureStore.setItemAsync('isTraveling', 'false');
    }
    
    console.log('[AuthContext] 로그아웃 완료 - 모든 데이터 정리됨');
  };

  const refreshUserInfo = async () => {
    try {
      console.log("[AuthContext] 사용자 정보를 서버로부터 새로고침합니다...");
      
      // 토큰이 있는지 확인
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        console.log("[AuthContext] 토큰이 없어서 사용자 정보 새로고침을 건너뜁니다.");
        return;
      }
      
      // API 헤더 설정
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await apiClient.get<UserInfo>('/users/me/');
      console.log("[AuthContext] 사용자 정보 새로고침 응답:", response.data);
      
      setUserInfo(response.data);
      console.log("[AuthContext] 사용자 정보 새로고침 완료.");
    } catch (e: any) {
      console.error("[AuthContext] 사용자 정보 새로고침 실패", e);
      
      // 토큰이 유효하지 않은 경우 로그아웃 처리
      if (e.response?.status === 401) {
        console.log("[AuthContext] 토큰이 유효하지 않아 로그아웃 처리");
        await logout(true);
      }
    }
  };


  return (
    <AuthContext.Provider value={{ userInfo, accessToken, isLoading, login, logout, refreshUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};