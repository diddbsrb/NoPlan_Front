// app/_layout.tsx

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { BackHandler, ToastAndroid } from 'react-native';
import 'react-native-reanimated';
import { TravelSurveyProvider, useTravelSurvey } from './(components)/TravelSurveyContext';

// ★★★ 1. React와 useEffect를 import 합니다. ★★★
import { useEffect } from 'react';
// ★★★ 2. Firebase 및 푸시 알림 관련 모듈을 import 합니다. ★★★
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {
  createNotificationChannels,
  getFCMToken,
  handleNotificationAction,
  listenForForegroundMessages,
  requestUserPermission,
  resetNotificationsBasedOnTravelStatus,
  scheduleWeekdayLunchNotification,
  scheduleWeekendTravelNotification,
  checkAndroidBackgroundSettings
} from '@/utils/pushNotificationHelper';

// ★★★ 3. AuthProvider를 import 합니다. ★★★
import { AuthProvider } from './(contexts)/AuthContext';

// ★★★ 4. 백그라운드 핸들러는 이제 pushNotificationHelper.ts에 있으므로 여기서는 제거 ★★★

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
        
        // ★★★ AuthContext에서 이미 라우팅을 처리하므로 여기서는 기본 화면만 처리 ★★★
        // AuthContext에서 토큰 검증 후 적절한 화면으로 라우팅하므로
        // 여기서는 로그아웃 상태일 때만 기본 화면으로 이동
        if (savedLoginState !== 'true') {
          console.log('[AuthStateHandler] 로그아웃 상태 -> (tabs) 기본 화면');
          router.replace('/(tabs)' as any);
        }
        // 로그인 상태는 AuthContext에서 처리하므로 여기서는 추가 라우팅하지 않음
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
  const router = useRouter();
  const pathname = usePathname();

  // ★★★ 5. 전역 안드로이드 뒤로가기 버튼 핸들러 ★★★
  useEffect(() => {
    let backPressCount = 0;
    let backPressTimer: NodeJS.Timeout;

    const backAction = () => {
      // 현재 네비게이션 상태 확인
      const currentRoute = router.canGoBack();
      
      // home_travel, home, index, app_guide, user_info 화면인지 확인
      const isHomeTravel = pathname.includes('home_travel');
      const isHome = pathname.includes('home') && !pathname.includes('home_travel');
      const isIndex = pathname.includes('index') || pathname === '/(tabs)' || pathname === '/';
      const isAppGuide = pathname.includes('app_guide');
      const isUserInfo = pathname.includes('user_info');
      const isList = pathname.includes('list');
      const isPermission = pathname.includes('permission_consent');
      
      // list 화면인 경우 home_travel로 이동
      if (isList) {
        router.replace('/(tabs)/home_travel');
        return true;
      }
      
      // 이 화면들 중 하나인 경우 앱 종료 옵션 제공
      if (isHomeTravel || isHome || isIndex || isAppGuide || isUserInfo || isPermission) {
        if (backPressCount === 0) {
          backPressCount = 1;
          ToastAndroid.show('뒤로가기 한 번 더 누르면 앱 종료', ToastAndroid.SHORT);
          backPressTimer = setTimeout(() => {
            backPressCount = 0;
          }, 2000); // 2초 내에 다시 누르면 앱 종료
          return true; // 기본 동작 방지
        } else {
          // 두 번째 뒤로가기: 앱 종료
          BackHandler.exitApp();
          return true;
        }
      } else {
        // 다른 화면에서는 이전 화면으로 돌아가기
        if (currentRoute) {
          router.back();
          return true;
        } else {
          // 루트 화면인 경우 앱 종료 옵션 제공
          if (backPressCount === 0) {
            backPressCount = 1;
            ToastAndroid.show('뒤로가기 한 번 더 누르면 앱 종료', ToastAndroid.SHORT);
            backPressTimer = setTimeout(() => {
              backPressCount = 0;
            }, 2000);
            return true;
          } else {
            BackHandler.exitApp();
            return true;
          }
        }
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
      if (backPressTimer) {
        clearTimeout(backPressTimer);
      }
    };
  }, [router, pathname]);

  // ★★★ 6. 푸시 알림 설정을 위한 useEffect 훅을 추가합니다. ★★★
  useEffect(() => {
    // 앱이 필요한 폰트나 리소스를 모두 로드한 후에 푸시 알림 설정을 시작하는 것이 좋습니다.
    if (loaded) {
      const setupNotifications = async () => {
        try {
          console.log('[알림 설정] 시작...');
          
          // 1. 채널 생성만 (권한 요청은 permission_consent에서 처리)
          await createNotificationChannels();
          
          // 2. Android 백그라운드 설정 확인
          await checkAndroidBackgroundSettings();

          console.log('[알림 설정] 기본 설정 완료 (권한 동의 후 상세 설정 예정)');
          
          console.log('[알림 설정] 완료');
        } catch (error) {
          console.error('알림 설정 중 오류 발생:', error);
        }
      };

      setupNotifications();
      
      const unsubscribe = listenForForegroundMessages();
      
      // 컴포넌트가 사라질 때 리스너를 정리합니다.
      return unsubscribe;
    }
  }, [loaded]); // 'loaded' 상태가 true가 되면 이 훅이 실행됩니다.

    // ★★★ 6. 백그라운드 이벤트 핸들러는 이제 pushNotificationHelper.ts에 있으므로 제거 ★★★

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