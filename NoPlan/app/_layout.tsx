// app/_layout.tsx

import React, { useEffect } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TravelSurveyProvider, useTravelSurvey } from './(components)/TravelSurveyContext';
import { AuthProvider } from './(contexts)/AuthContext';

// ★★★ 1. 기존의 messaging, pushNotificationHelper import를 모두 제거합니다. ★★★

// ★★★ 2. 우리가 만든 통합 알림 서비스의 마스터 함수만 import 합니다. ★★★
import { setupAllNotifications } from '../service/notificationService'; // 경로는 실제 위치에 맞게 수정

// ★★★ 3. 백그라운드 핸들러는 여기서 완전히 제거합니다. (index.js로 이동했기 때문) ★★★

// AuthStateHandler 컴포넌트는 기존 코드를 그대로 유지합니다.
function AuthStateHandler() {
  const router = useRouter();
  const { loadSavedStates } = useTravelSurvey();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        await loadSavedStates();
        
        const savedLoginState = await SecureStore.getItemAsync('isLoggedIn');
        const savedTravelState = await SecureStore.getItemAsync('isTraveling');
        
        if (savedLoginState !== 'true') {
          router.replace('/(tabs)' as any);
        } else if (savedTravelState === 'true') {
          router.replace('/home_travel' as any);
        } else {
          router.replace('/home' as any);
        }
      } catch (error) {
        console.error('[AuthStateHandler] 인증 상태 확인 실패:', error);
        router.replace('/(tabs)' as any);
      }
    };
    checkAuthAndRedirect();
  }, []);
  
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // ★★★ 4. 알림 설정을 위한 useEffect 훅을 매우 간결하게 수정합니다. ★★★
  useEffect(() => {
    if (loaded) {
      let unsubscribe: (() => void) | undefined;
      
      const initialize = async () => {
        // 이 함수 하나만 호출하면 모든 알림 설정(원격+로컬)이 끝납니다.
        unsubscribe = await setupAllNotifications();
      };
      
      initialize();

      // 컴포넌트가 사라질 때 포그라운드 리스너를 정리하는 것은 중요합니다.
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // 기존의 UI 구조는 그대로 유지합니다.
  return (
    <AuthProvider>
      <TravelSurveyProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthStateHandler />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="survey_travel" options={{ headerShown: false }} />
            <Stack.Screen name="survey_destination" options={{ headerShown: false }} />
            <Stack.Screen name="mypage" options={{ headerShown: false }} />
            <Stack.Screen name="info" options={{ headerShown: false }} />
            <Stack.Screen name="kakao" options={{ title: '카카오 로그인' }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TravelSurveyProvider>
    </AuthProvider>
  );
}