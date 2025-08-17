// app/_layout.tsx

import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
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
  sendTestNotification
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

  // ★★★ 5. 전역 안드로이드 뒤로가기 버튼 핸들러 ★★★
  useEffect(() => {
    let backPressCount = 0;
    let backPressTimer: NodeJS.Timeout;

    const backAction = () => {
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
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
      if (backPressTimer) {
        clearTimeout(backPressTimer);
      }
    };
  }, []);

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

          // 3. 알림 채널 생성
          await createNotificationChannels();
          
          // 4. 로컬 알림 스케줄링
          try {
            const scheduledNotifications = await notifee.getTriggerNotificationIds();
            console.log('현재 스케줄된 알림들:', scheduledNotifications);
            
            // 기존 알림 취소 후 새로 스케줄링 (시간 변경을 위해)
            if (scheduledNotifications.includes('weekday-lunch')) {
              await notifee.cancelNotification('weekday-lunch');
              console.log('기존 평일 점심 알림 취소됨');
            }
            if (scheduledNotifications.includes('weekend-travel')) {
              await notifee.cancelNotification('weekend-travel');
              console.log('기존 주말 여행 알림 취소됨');
            }
            
                    // 여행 상태에 따른 알림 재설정
        await resetNotificationsBasedOnTravelStatus();
            
            // 스케줄링 후 다시 확인
            const newScheduledNotifications = await notifee.getTriggerNotificationIds();
            console.log('스케줄링 후 알림들:', newScheduledNotifications);
            
            // 즉시 테스트 알림 발송 (알림 시스템 확인용)
            try {
              console.log('즉시 테스트 알림 발송 시작...');
              await sendTestNotification('lunch');
              console.log('즉시 테스트 알림 발송 완료');
            } catch (error) {
              console.error('즉시 테스트 알림 발송 실패:', error);
            }
            
            // 30초 후 테스트 알림 발송
            setTimeout(async () => {
              try {
                console.log('30초 후 테스트 알림 발송 시작...');
                await sendTestNotification('weekend');
                console.log('30초 후 테스트 알림 발송 완료');
              } catch (error) {
                console.error('30초 후 테스트 알림 발송 실패:', error);
              }
            }, 30 * 1000); // 30초 후
            
          } catch (error) {
            console.error('알림 스케줄링 확인 실패:', error);
            // 에러 발생 시 기본적으로 스케줄링 시도
            await scheduleWeekdayLunchNotification();
            await scheduleWeekendTravelNotification();
          }

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
  const router = useRouter();
  
  useEffect(() => {
    if (loaded) {
      // 알림 클릭 리스너 설정 (앱이 백그라운드에서 열릴 때)
      const unsubscribe = notifee.onBackgroundEvent(async ({ type, detail }) => {
        console.log('[알림 백그라운드] 이벤트 타입:', type);
        console.log('[알림 백그라운드] 상세 정보:', detail);
        
        console.log('[알림 백그라운드] EventType.PRESS 값:', EventType.PRESS);
        console.log('[알림 백그라운드] type 값:', type);
        console.log('[알림 백그라운드] type === EventType.PRESS:', type === EventType.PRESS);
        
                 if (type === EventType.PRESS || type === 2) {
           // 액션 ID 가져오기
           const actionId = detail.pressAction?.id || 'default';
           console.log('[알림 백그라운드] 액션 ID:', actionId);
           console.log('[알림 백그라운드] 알림 데이터:', detail.notification?.data);
           
           // 알림 데이터와 액션 ID를 함께 전달 (async 처리)
           handleNotificationAction(actionId, detail.notification?.data || {}).then(navigationData => {
             console.log('[알림 백그라운드] handleNotificationAction 결과:', navigationData);
          
             if (navigationData) {
               console.log('[알림 백그라운드] 네비게이션 데이터:', navigationData);
               
               if (navigationData.screen) {
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
               }
             } else {
               console.log('[알림 백그라운드] 네비게이션 데이터가 null입니다.');
             }
           });
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
              name="home_travel"
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