// index.js

import 'react-native-gesture-handler';
// ★★★ 백그라운드 핸들러는 _layout.tsx에서만 처리하므로 여기서는 제거 ★★★
//import messaging from '@react-native-firebase/messaging';
//import notifee, { EventType } from '@notifee/react-native';

// ★★★ 1. 여기에 모든 백그라운드 핸들러를 등록합니다. ★★★

// FCM(원격) 백그라운드/종료 상태 핸들러
// ★★★ 이 부분을 _layout.tsx로 이동하여 중복 제거 ★★★
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('[백그라운드] FCM 메시지 처리:', remoteMessage);
// });

/*// Notifee(로컬) 백그라운드 이벤트 핸들러 (점심 알림 조건부 취소용)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (!detail.notification) return;

  if (detail.notification.id === 'lunch-notification' && type === EventType.TRIGGER_NOTIFICATION_CREATED) {
    const today = new Date().getDay(); // 0: 일요일, 6: 토요일
    if (today === 0 || today === 6) {
      console.log('[백그라운드] 주말이므로 점심 알림을 취소합니다.');
      await notifee.cancelNotification(detail.notification.id);
    }
  }
});*/


// ★★★ 2. 마지막으로 원래의 Expo Router 진입점을 실행합니다. ★★★
// 이 코드가 있어야 앱이 정상적으로 실행됩니다.
import 'expo-router/entry';