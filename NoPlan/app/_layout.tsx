// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { TravelSurveyProvider } from './(components)/TravelSurveyContext';
import { useColorScheme } from '@/hooks/useColorScheme';

// ★★★ 1. React와 useEffect를 import 합니다. ★★★
import React, { useEffect } from 'react';
// ★★★ 2. Firebase 및 푸시 알림 관련 모듈을 import 합니다. ★★★
import messaging from '@react-native-firebase/messaging';
import { requestUserPermission, getFCMToken, listenForForegroundMessages } from '../utils/pushNotificationHelper'; // 경로는 실제 위치에 맞게 수정

// ★★★ 3. 백그라운드 핸들러는 반드시 컴포넌트 바깥, 파일 최상단에 위치해야 합니다. ★★★
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('백그라운드/종료 상태에서 메시지 처리:', remoteMessage);
});


export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // ★★★ 4. 푸시 알림 설정을 위한 useEffect 훅을 추가합니다. ★★★
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
    <TravelSurveyProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* 탭 내비: 헤더 숨김 */}
          <Stack.Screen
            name="(tabs)"
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
  );
}