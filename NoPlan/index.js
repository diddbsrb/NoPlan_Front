// index.js

import 'react-native-gesture-handler';
import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';

// ★★★ 1. 여기에 모든 백그라운드 핸들러를 등록합니다. ★★★

// FCM(원격) 백그라운드/종료 상태 핸들러
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[백그라운드] FCM 메시지 처리:', remoteMessage);
});

// Notifee(로컬) 백그라운드 이벤트 핸들러
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('[백그라운드] Notifee 이벤트 타입:', type);
  console.log('[백그라운드] Notifee 상세 정보:', detail);
  
  if (!detail.notification) return;

  // 알림 클릭 이벤트 처리
  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    const actionId = detail.pressAction?.id || 'default';
    console.log('[백그라운드] 알림 액션 ID:', actionId);
    
    // 여기서는 기본적인 처리만 하고, 상세한 네비게이션은 _layout.tsx에서 처리
    console.log('[백그라운드] 알림 클릭됨 - 앱이 포그라운드로 이동합니다.');
  }
});

// ★★★ 2. 마지막으로 원래의 Expo Router 진입점을 실행합니다. ★★★
// 이 코드가 있어야 앱이 정상적으로 실행됩니다.
import 'expo-router/entry';