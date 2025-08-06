import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

// 1. 알림 권한 요청
export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('알림 권한 허용됨:', authStatus);
  }
}

// 2. 기기 토큰 가져오기
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    // TODO: 이 토큰을 로그인한 유저 정보와 함께 서버로 전송
    return token;
  } catch (error) {
    console.error("FCM 토큰 가져오기 실패", error);
  }
}

// 3. 포그라운드 알림 처리
export function listenForForegroundMessages() {
  return messaging().onMessage(async remoteMessage => {
    console.log('포그라운드에서 메시지 수신:', remoteMessage);
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
      },
    });
  });
}