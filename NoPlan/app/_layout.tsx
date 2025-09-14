// app/_layout.tsx

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, usePathname } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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
  sendTestNotification,
  initializeNotificationsFromPreferences,
  clearAllExistingNotifications
} from '../utils/pushNotificationHelper';

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
          // 1. 알림 권한 요청
          const permissionGranted = await requestUserPermission();
          if (!permissionGranted) {
            console.log('알림 권한이 거부되었습니다.');
            return;
          }

          // 2. FCM 토큰 가져오기
          const token = await getFCMToken();
          if (!token) {
            console.log('FCM 토큰을 가져올 수 없습니다.');
            return;
          }

          // 3. 옛날 알림 정리 (앱 시작 시 한 번만)
          try {
            const scheduledIds = await notifee.getTriggerNotificationIds();
            if (scheduledIds.length > 0) {
              console.log('[알림 초기화] 기존 알림 발견, 정리 시작:', scheduledIds);
              await clearAllExistingNotifications();
              console.log('[알림 초기화] 기존 알림 정리 완료');
            }
          } catch (error) {
            console.error('[알림 초기화] 기존 알림 정리 실패:', error);
          }

          // 4. 사용자 설정에 따른 알림 초기화
          await initializeNotificationsFromPreferences();
          
          console.log('알림 설정이 완료되었습니다.');
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

    // ★★★ 6. 알림 액션 리스너 추가 ★★★
  
  useEffect(() => {
    if (loaded) {
      // 알림 클릭 리스너 설정 (앱이 백그라운드에서 열릴 때)
      const unsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
        console.log('[알림 백그라운드] 이벤트 타입:', type);
        console.log('[알림 백그라운드] 상세 정보:', detail);
        
        // 모든 이벤트 타입을 처리 (PRESS, ACTION_PRESS, DELIVERED 등)
        if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
           // 액션 ID 가져오기 (여러 방법으로 시도)
           let actionId = 'default';
           
           if (detail.pressAction?.id) {
             actionId = detail.pressAction.id;
           } else if (detail.notification?.data?.actionId) {
             const dataActionId = detail.notification.data.actionId;
             actionId = typeof dataActionId === 'string' ? dataActionId : 'default';
           }
           
           console.log('[알림 백그라운드] 액션 ID:', actionId);
           console.log('[알림 백그라운드] 알림 데이터:', detail.notification?.data);
           
           // 알림 데이터와 액션 ID를 함께 전달 (async 처리)
           try {
             const navigationData = await handleNotificationAction(actionId, detail.notification?.data || {});
             console.log('[알림 백그라운드] handleNotificationAction 결과:', navigationData);
          
             if (navigationData && navigationData.screen) {
               console.log('[알림 백그라운드] 화면 이동 시도:', navigationData.screen);
               try {
                 router.push({
                   pathname: `/${navigationData.screen}` as any,
                   params: navigationData.params
                 });
                 console.log('[알림 백그라운드] 화면 이동 성공');
               } catch (error) {
                 console.error('[알림 백그라운드] 화면 이동 실패:', error);
               }
             } else {
               console.log('[알림 백그라운드] 네비게이션 데이터가 null이거나 screen이 없습니다.');
             }
           } catch (error) {
             console.error('[알림 백그라운드] handleNotificationAction 처리 실패:', error);
           }
         }
       });

       // 컴포넌트가 사라질 때 리스너를 정리합니다.
       return unsubscribe;
    }
  }, [loaded, router]);

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