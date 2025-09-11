// service/notificationService.ts

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
} from '@notifee/react-native';

// ===================================================================
// 내부 헬퍼 함수들 (이 파일 안에서만 사용됩니다)
// ===================================================================

/** FCM(원격) 푸시 알림 권한 요청 */
const requestFCMpermission = async (): Promise<void> => {
  const authStatus = await messaging().requestPermission();
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
    console.log('[FCM] 푸시 알림 권한이 허용되었습니다.');
  }
};

/** FCM 기기 토큰 가져오기 (필요 시 서버로 전송) */
const getFCMToken = async (): Promise<void> => {
  try {
    const token = await messaging().getToken();
    if (token) console.log('[FCM] 기기 토큰:', token);
  } catch (error) {
    console.error('[FCM] 토큰 가져오기 실패:', error);
  }
};

/** 앱이 켜져 있을 때(포그라운드) 원격 알림 수신 리스너 */
const listenForForegroundMessages = (): (() => void) => {
  return messaging().onMessage(async remoteMessage => {
    console.log('[FCM] 포그라운드에서 메시지 수신:', remoteMessage);
    // 수신된 원격 알림을 로컬 알림처럼 화면에 즉시 표시
    notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: { channelId: 'default' },
    });
  });
};

/** Notifee(로컬) 알림을 위한 안드로이드 채널 생성 */
const createNotificationChannel = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });
    console.log('[Notifee] 알림 채널이 생성되었습니다.');
  }
};

/** 주기적인 로컬 알림 예약 (점심/주말) */
const schedulePeriodicNotifications = async (): Promise<void> => {
    await notifee.cancelTriggerNotifications(['lunch-notification', 'weekend-notification']);

    // --- 실제 서비스용 시간 계산 로직 ---
    const now = new Date();

    // 다음 정오 계산
    const nextLunchTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    if (now.getHours() >= 12) {
      nextLunchTime.setDate(nextLunchTime.getDate() + 1);
    }
    
    // 다음 토요일 오전 10시 계산
    const nextSaturday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
    nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
    if (daysUntilSaturday === 0 && now.getHours() >= 10) {
        nextSaturday.setDate(nextSaturday.getDate() + 7);
    }

    // --- 알림 예약 ---
    const lunchTrigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: nextLunchTime.getTime(), repeatFrequency: RepeatFrequency.DAILY };
    const weekendTrigger: TimestampTrigger = { type: TriggerType.TIMESTAMP, timestamp: nextSaturday.getTime(), repeatFrequency: RepeatFrequency.WEEKLY };

    await notifee.createTriggerNotification({ id: 'lunch-notification', title: '점심 시간이에요! 🍽️', body: '근처 맛집을 추천해드릴까요?', android: { channelId: 'default' } }, lunchTrigger);
    await notifee.createTriggerNotification({ id: 'weekend-notification', title: '주말 계획 세우셨나요? 🎉', body: '이번 주말은 즉흥 여행 어떠세요?', android: { channelId: 'default' } }, weekendTrigger);
    
    console.log(`[Notifee] 다음 점심 알림: ${nextLunchTime.toLocaleString()}`);
    console.log(`[Notifee] 다음 주말 알림: ${nextSaturday.toLocaleString()}`);
};


// ===================================================================
// 외부에서 호출할 함수들 (export)
// ===================================================================

/**
 * [마스터 함수] 앱 시작 시 모든 알림 설정을 담당.
 * _layout.tsx에서는 이 함수 하나만 호출하면 됩니다.
 */
export const setupAllNotifications = async (): Promise<() => void> => {
  // 1. 필요한 권한과 채널 설정
  await requestFCMpermission();
  await createNotificationChannel();
  
  // 2. FCM 토큰 가져오기
  await getFCMToken();

  // 3. 앱 최초 실행 시에만 주기적인 로컬 알림 예약
  const isFirstLaunch = await AsyncStorage.getItem('isFirstLaunch');
  if (isFirstLaunch === null) {
    console.log('[앱] 최초 실행 감지! 주기적 로컬 알림을 예약합니다.');
    await schedulePeriodicNotifications();
    await AsyncStorage.setItem('isFirstLaunch', 'true');
  }

  // 4. 포그라운드 메시지 리스너를 실행하고, 정리 함수(unsubscribe)를 반환
  return listenForForegroundMessages();
};

/**
 * [UI 연동 함수] 여행 종료 후 알림 예약.
 * 컴포넌트(버튼 등)에서 직접 호출하기 위해 export 합니다.
 */
export const scheduleTripEndNotification = async (): Promise<void> => {
  const triggerDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 정확히 이틀 뒤

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: triggerDate.getTime(),
  };

  await notifee.createTriggerNotification(
    {
      title: '새로운 여행을 떠나볼까요? ✈️',
      body: '지난 여행의 즐거움을 이어갈 새로운 즉흥 여행지를 추천해 드릴게요!',
      android: { channelId: 'default' },
    },
    trigger,
  );
  console.log(`[알림] 여행 종료 알림이 ${triggerDate.toLocaleString()}에 예약되었습니다.`);
};