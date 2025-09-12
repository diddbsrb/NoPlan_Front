// service/notificationService.ts

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  TimestampTrigger,
  TriggerType,
  AndroidImportance,
} from '@notifee/react-native';
import {
  createNotificationChannels,
  clearAllScheduledNotifications,
  resetNotificationsBasedOnTravelStatus,
  listenForForegroundMessages as listenForForegroundMessagesFromHelper,
} from '../utils/pushNotificationHelper';

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

// 포그라운드 수신은 pushNotificationHelper의 로직을 사용합니다.

// 채널 생성은 pushNotificationHelper.createNotificationChannels 사용

// periodic(반복) 예약은 pushNotificationHelper 쪽 로직을 사용하므로 이 파일에서는 제거


// ===================================================================
// 외부에서 호출할 함수들 (export)
// ===================================================================

/**
 * [마스터 함수] 앱 시작 시 모든 알림 설정을 담당.
 * _layout.tsx에서는 이 함수 하나만 호출하면 됩니다.
 */
export const setupAllNotifications = async (): Promise<() => void> => {
  // 1) 원격 푸시 권한 및 토큰
  await requestFCMpermission();
  await getFCMToken();

  // 2) 로컬 알림 채널 생성
  await createNotificationChannels();

  // 3) 과거 스케줄 정리 후, 여행 상태 기반 스케줄 재설정
  await clearAllScheduledNotifications();
  await resetNotificationsBasedOnTravelStatus();

  // 4) 포그라운드 수신 리스너 등록
  const unsubscribe = listenForForegroundMessagesFromHelper();
  return unsubscribe;
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