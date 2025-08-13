// app/_layout.tsx

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TravelSurveyProvider, useTravelSurvey } from './(components)/TravelSurveyContext';

// ★★★ 1. React와 useEffect를 import 합니다. ★★★
import React, { useEffect } from 'react';
// ★★★ 2. Firebase 및 푸시 알림 관련 모듈을 import 합니다. ★★★
import messaging from '@react-native-firebase/messaging';
import { getFCMToken, listenForForegroundMessages, requestUserPermission } from '../utils/pushNotificationHelper'; // 경로는 실제 위치에 맞게 수정

// ★★★ 3. AuthProvider를 import 합니다. ★★★
import { AuthProvider } from './(contexts)/AuthContext';

// ★★★ 4. 백그라운드 핸들러는 반드시 컴포넌트 바깥, 파일 최상단에 위치해야 합니다. ★★★
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('백그라운드/종료 상태에서 메시지 처리:', remoteMessage);
});

// AuthStateHandler 컴포넌트: 앱 시작 시 저장된 인증 상태와 여행 상태를 확인하고 적절한 화면으로 라우팅
function AuthStateHandler() {
  const router = useRouter();
  const { isLoggedIn, isTraveling, loadSavedStates } = useTravelSurvey();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // 저장된 상태 불러오기
        await loadSavedStates();
        
        // SecureStore에서 직접 상태를 다시 확인
        const savedLoginState = await SecureStore.getItemAsync('isLoggedIn');
        const savedTravelState = await SecureStore.getItemAsync('isTraveling');
        
        console.log('[AuthStateHandler] SecureStore에서 직접 확인한 상태:', { 
          isLoggedIn: savedLoginState, 
          isTraveling: savedTravelState 
        });
        
        // 상태에 따른 화면 라우팅
        if (savedLoginState !== 'true') {
          // 로그아웃 상태: (tabs) 그룹의 기본 화면으로 이동
          console.log('[AuthStateHandler] 로그아웃 상태 -> (tabs) 기본 화면');
          router.replace('/(tabs)' as any);
        } else if (savedTravelState === 'true') {
          // 로그인 상태 + 여행 중: home_travel 화면
          console.log('[AuthStateHandler] 로그인 상태 + 여행 중 -> home_travel 화면');
          router.replace('home_travel' as any);
        } else {
          // 로그인 상태 + 여행 중 아님: home 화면
          console.log('[AuthStateHandler] 로그인 상태 + 여행 중 아님 -> home 화면');
          router.replace('home' as any);
        }
      } catch (error) {
        console.error('[AuthStateHandler] 인증 상태 확인 실패:', error);
        // 에러 발생 시 기본 화면으로
        router.replace('/(tabs)' as any);
      }
    };
    checkAuthAndRedirect();
  }, []); // 🆕 빈 의존성 배열로 수정하여 무한 루프 방지
  
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // ★★★ 5. 푸시 알림 설정을 위한 useEffect 훅을 추가합니다. ★★★
  useEffect(() => {
    // 앱이 필요한 폰트나 리소스를 모두 로드한 후에 푸시 알림 설정을 시작하는 것이 좋습니다.
    if (loaded) {
      const setupNotifications = async () => {
        await requestUserPermission();
        await getFCMToken();
      };

      setupNotifications();
      
      const unsubscribe = listenForForegroundMessages();
      
      // 컴포넌트가 사라질 때 리스너를 정리합니다.
      return unsubscribe;
    }
  }, [loaded]); // 'loaded' 상태가 true가 되면 이 훅이 실행됩니다.

  // 폰트가 로드되지 않았을 때는 아무것도 렌더링하지 않습니다 (기존 로직 유지).
  if (!loaded) {
    return null;
  }

  // 기존의 UI 구조는 그대로 유지합니다.
  return (
    // ★★★ 6. AuthProvider로 앱 전체를 감싸줍니다. ★★★
    // 이제 앱의 모든 곳에서 useAuth() 훅을 통해 로그인 상태를 공유할 수 있습니다.
    <AuthProvider>
      <TravelSurveyProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthStateHandler />
          <Stack>
            {/* 탭 내비: 헤더 숨김 */}
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />

            {/* index 화면을 명시적으로 등록 */}
            <Stack.Screen
              name="index"
              options={{ headerShown: false }}
            />

            {/* 설문 화면: 기본 헤더 숨김 */}
            <Stack.Screen
              name="survey_travel"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="survey_destination"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="mypage"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="info"
              options={{ headerShown: false }}
            />
            
            {/* ★★★ 카카오 로그인 웹뷰 화면을 스택에 등록하는 것을 잊지 마세요. ★★★ */}
            <Stack.Screen
              name="kakao"
              options={{ title: '카카오 로그인' }} // 헤더가 보이도록 설정 (뒤로가기 등)
            />

            {/* Not Found */}
            <Stack.Screen
              name="+not-found"
              options={{ title: 'Not Found' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TravelSurveyProvider>
    </AuthProvider>
  );
}