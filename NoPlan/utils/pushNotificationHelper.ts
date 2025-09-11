import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  TriggerType,
  AndroidStyle,
  AndroidAction,
  TimestampTrigger,
  AuthorizationStatus,
  RepeatFrequency,
} from '@notifee/react-native';
import * as SecureStore from 'expo-secure-store';

/* ------------------------------------------------
 * 공통 유틸
 * ------------------------------------------------ */

function nextDowTime(dow: number, hour: number, minute: number) {
  // dow: 0=일 ~ 6=토
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  const delta = (dow - target.getDay() + 7) % 7;
  target.setDate(target.getDate() + delta);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 7);
  }
  return target.getTime();
}

async function ensureChannel(id: string, name: string) {
  await notifee.createChannel({
    id,
    name,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500],
  });
  return id;
}

async function ensureIOSCategories() {
  // iOS 액션 버튼 표시용 카테고리 등록 (앱 부팅 시 1회)
  await notifee.setNotificationCategories([
    {
      id: 'lunch-recommendations',
      actions: [
        { id: 'find_restaurants', title: '시작하기' },
        { id: 'dismiss', title: '나중에' },
      ],
    },
    {
      id: 'travel-recommendations',
      actions: [
        { id: 'start_travel', title: '시작하기' },
        { id: 'dismiss', title: '나중에' },
      ],
    },
    {
      id: 'weekend-travel',
      actions: [
        { id: 'start_weekend_travel', title: '시작하기' },
        { id: 'dismiss', title: '나중에' },
      ],
    },
    {
      id: 'default',
      actions: [{ id: 'dismiss', title: '닫기' }],
    },
  ]);
}

/** 로컬 알림 권한(Notifee) 기준으로 통일 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const st = await notifee.getNotificationSettings();
  if (
    st.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    st.authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  const res = await notifee.requestPermission();
  return (
    res.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    res.authorizationStatus === AuthorizationStatus.PROVISIONAL
  );
}

/* ------------------------------------------------
 * 1. 알림 권한 요청 (로컬 우선, 원격 푸시는 부가적으로 요청)
 * ------------------------------------------------ */
export async function requestUserPermission() {
  const localGranted = await ensureNotificationPermission();
  if (!localGranted) return false;

  // 원격 푸시(APNs/FCM)까지 쓸 계획이라면 추가로 요청
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (enabled) console.log('FCM/APNs 권한 허용됨:', authStatus);
  } catch (e) {
    // 원격푸시가 필수 아니라면 무시 가능
    console.warn('FCM 권한 요청 실패(무시 가능):', e);
  }
  return true;
}

/* ------------------------------------------------
 * 2. FCM 토큰
 * ------------------------------------------------ */
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('FCM 토큰 가져오기 실패', error);
    return null;
  }
}

/* ------------------------------------------------
 * 3. 포그라운드 FCM → 노티 표시
 * ------------------------------------------------ */
export function listenForForegroundMessages() {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('포그라운드에서 메시지 수신:', remoteMessage);
    await ensureChannel('default', '기본 알림');
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
      },
      ios: { categoryId: 'default' },
    });
  });
}

/* ------------------------------------------------
 * 4. 채널/카테고리 초기화 (앱 부팅 시 1회 호출 권장)
 * ------------------------------------------------ */
export async function createNotificationChannels() {
  try {
    await ensureChannel('default', '기본 알림');
    await ensureChannel('travel-recommendations', '여행 추천');
    await ensureChannel('lunch-recommendations', '점심 추천');
    await ensureChannel('weekend-travel', '주말 여행');
    await ensureIOSCategories();
    console.log('모든 알림 채널/카테고리 준비 완료');
  } catch (error) {
    console.error('알림 채널/카테고리 준비 실패:', error);
  }
}

/* ------------------------------------------------
 * ★★★ 4-x. 로컬 알림 스케줄링들 ★★★
 * ------------------------------------------------ */

/** 4-1. 여행 종료 후 48시간 뒤 1회 알림 */
export async function schedulePostTravelRecommendation() {
  try {
    await ensureChannel('travel-recommendations', '여행 추천');

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + 48 * 60 * 60 * 1000,
      // alarmManager: false  // 기본 false: 정확알람 권한 부담 줄이기
    };

    await notifee.createTriggerNotification(
      {
        id: `post-travel-${Date.now()}`,
        title: '새로운 여행을 떠나볼까요? 🚀',
        body: '즉흥 여행으로 새로운 추억을 만들어보세요!',
        data: { screen: 'survey_travel', type: 'post_travel_recommendation' },
        android: {
          channelId: 'travel-recommendations',
          importance: AndroidImportance.HIGH,
          style: { type: AndroidStyle.BIGTEXT, text: '즉흥 여행으로 새로운 추억을 만들어보세요! 지금 바로 여행을 시작해보세요.' },
          actions: [
            { title: '시작하기', pressAction: { id: 'start_travel', launchActivity: 'default' } },
            { title: '나중에', pressAction: { id: 'dismiss' } },
          ],
        },
        ios: { categoryId: 'travel-recommendations' },
      },
      trigger
    );

    console.log('여행 종료 후 추천 알림이 48시간 후로 스케줄링되었습니다.');
  } catch (error) {
    console.error('여행 종료 후 추천 알림 스케줄링 실패:', error);
  }
}

/** 4-2. 여행 중 평일 점심/오후/저녁 스마트 알림 (1회씩 예약)
 *  - “여행 중일 때만, 추천 조건이 바뀔 때”라는 주석을 존중 → 반복 대신 당일/다음날 1회 예약
 */
export async function scheduleWeekdayLunchNotification() {
  try {
    const isTraveling = await checkTravelStatus();
    if (!isTraveling) {
      console.log('여행 중이 아니므로 평일 점심/스마트 알림을 스케줄링하지 않습니다.');
      return;
    }

    await ensureChannel('lunch-recommendations', '점심 추천');
    await ensureChannel('travel-recommendations', '여행 추천');

    const now = new Date();
    console.log('[알림 시간] 현재 시간:', now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));

    // 점심: 11:50 (한국 시간 기준)
    const lunchTime = new Date();
    // 한국 시간대로 설정 (UTC+9)
    const koreaTimeOffset = 9 * 60; // 9시간을 분으로
    const localOffset = lunchTime.getTimezoneOffset();
    const totalOffset = koreaTimeOffset + localOffset;
    
    lunchTime.setHours(11, 50, 0, 0);
    lunchTime.setMinutes(lunchTime.getMinutes() + totalOffset);

    // 평일만 → 오늘이 주말이면 다음 월요일로
    const lunchDOW = lunchTime.getDay();
    if (lunchDOW === 0 || lunchDOW === 6) {
      const daysUntilMonday = (1 - lunchDOW + 7) % 7;
      lunchTime.setDate(lunchTime.getDate() + daysUntilMonday);
      console.log('[알림 시간] 주말이어서 점심 알림을 다음 월요일로 설정:', lunchTime);
    }
    // 이미 지났으면 1분 후(테스트)
    if (now.getTime() > lunchTime.getTime()) {
      lunchTime.setTime(now.getTime() + 60_000);
      console.log('[알림 시간] 점심 알림이 이미 지나서 1분 후로 설정:', lunchTime);
    } else {
      console.log('[알림 시간] 점심 알림 시간 설정:', lunchTime);
    }

    const lunchTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: lunchTime.getTime(),
      // alarmManager: true  // 정말 초단위 정확도가 필요할 때만 활성화
    };

    const rec = await getRecommendationTypeBasedOnLastVisit();

    await notifee.createTriggerNotification(
      {
        id: 'weekday-lunch',
        title: `여행 중 ${rec.buttonText} 🎯`,
        body: rec.message,
        data: { screen: 'home_travel', type: 'smart_recommendation', category: rec.type },
        android: {
          channelId: 'lunch-recommendations',
          importance: AndroidImportance.HIGH,
          style: { type: AndroidStyle.BIGTEXT, text: `${rec.message} 지금 확인해보세요.` },
          actions: [
            { title: rec.buttonText, pressAction: { id: `find_${rec.type}`, launchActivity: 'default' } },
            { title: '나중에', pressAction: { id: 'dismiss' } },
          ],
        },
        ios: { categoryId: 'lunch-recommendations' },
      },
      lunchTrigger
    );
    console.log('여행 중 평일 점심 알림이 스케줄링되었습니다:', lunchTime);

    // 오후: 15:00 (한국 시간 기준)
    const afternoonTime = new Date();
    // 한국 시간대로 설정 (UTC+9)
    const afternoonKoreaTimeOffset = 9 * 60; // 9시간을 분으로
    const afternoonLocalOffset = afternoonTime.getTimezoneOffset();
    const afternoonTotalOffset = afternoonKoreaTimeOffset + afternoonLocalOffset;
    
    afternoonTime.setHours(15, 0, 0, 0);
    afternoonTime.setMinutes(afternoonTime.getMinutes() + afternoonTotalOffset);
    if (now.getTime() > afternoonTime.getTime()) afternoonTime.setDate(afternoonTime.getDate() + 1);

    const afternoonRec = await getRecommendationTypeBasedOnLastVisit();
    const afternoonType = afternoonRec.type;
    
    // 오후 시간대에 맞는 멘트로 수정
    const afternoonMessage = afternoonType === 'cafes'
      ? '오후 커피 한 잔 어떠세요?'
      : afternoonType === 'attractions'
      ? '오후 관광지도 둘러보세요!'
      : afternoonType === 'restaurants'
      ? '오후 간식이나 식사 어떠세요?'
      : '오후 다음 장소를 찾아보세요!';

    const afternoonTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: afternoonTime.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: 'afternoon-smart',
        title: `오후 시간! ${
          afternoonType === 'cafes'
            ? '카페'
            : afternoonType === 'attractions'
            ? '관광지'
            : afternoonType === 'restaurants'
            ? '식당'
            : '다음'
        } 추천 ☕`,
        body: afternoonMessage,
        data: { screen: 'home_travel', type: 'afternoon_recommendation', category: afternoonType },
        android: {
          channelId: 'travel-recommendations',
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `${afternoonMessage} 근처 ${
              afternoonType === 'cafes' ? '카페' : afternoonType === 'attractions' ? '관광지' : afternoonType === 'restaurants' ? '맛집' : '다음 장소'
            }를 추천해드릴게요!`,
          },
          actions: [
            {
              title: afternoonType === 'cafes' ? '카페 찾기' : '관광지 찾기',
              pressAction: { id: `find_${afternoonType}`, launchActivity: 'default' },
            },
            { title: '나중에', pressAction: { id: 'dismiss' } },
          ],
        },
        ios: { categoryId: 'travel-recommendations' },
      },
      afternoonTrigger
    );
    console.log('여행 중 오후 스마트 알림이 스케줄링되었습니다:', afternoonTime);

    // 저녁: 18:00 (한국 시간 기준)
    const eveningTime = new Date();
    // 한국 시간대로 설정 (UTC+9)
    const eveningKoreaTimeOffset = 9 * 60; // 9시간을 분으로
    const eveningLocalOffset = eveningTime.getTimezoneOffset();
    const eveningTotalOffset = eveningKoreaTimeOffset + eveningLocalOffset;
    
    eveningTime.setHours(18, 0, 0, 0);
    eveningTime.setMinutes(eveningTime.getMinutes() + eveningTotalOffset);
    if (now.getTime() > eveningTime.getTime()) eveningTime.setDate(eveningTime.getDate() + 1);

    const eveningRec = await getRecommendationTypeBasedOnLastVisit();
    let eveningType = eveningRec.type;
    let eveningMessage = eveningRec.message;
    // 저녁 이후는 숙소 우선
    if (now.getHours() >= 18) {
      eveningType = 'accommodations';
      eveningMessage = '하루가 가고 있어요! 숙소는 정하셨나요?';
    }

    const eveningTrigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: eveningTime.getTime(),
    };

    await notifee.createTriggerNotification(
      {
        id: 'evening-smart',
        title: `여행 중 ${eveningType === 'accommodations' ? '숙소' : eveningType === 'restaurants' ? '저녁' : '다음'} 추천 🎯`,
        body: eveningMessage,
        data: { screen: 'home_travel', type: 'evening_recommendation', category: eveningType },
        android: {
          channelId: 'travel-recommendations',
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: `${eveningMessage} 근처 ${
              eveningType === 'accommodations'
                ? '숙소'
                : eveningType === 'restaurants'
                ? '맛집'
                : eveningType === 'cafes'
                ? '카페'
                : '관광지'
            }를 추천해드릴게요!`,
          },
          actions: [
            {
              title:
                eveningType === 'accommodations'
                  ? '숙소 찾기'
                  : eveningType === 'restaurants'
                  ? '저녁 찾기'
                  : eveningType === 'cafes'
                  ? '카페 찾기'
                  : '관광지 찾기',
              pressAction: { id: `find_${eveningType}`, launchActivity: 'default' },
            },
            { title: '나중에', pressAction: { id: 'dismiss' } },
          ],
        },
        ios: { categoryId: 'travel-recommendations' },
      },
      eveningTrigger
    );
    console.log('여행 중 저녁 스마트 알림이 스케줄링되었습니다:', eveningTime);
  } catch (error) {
    console.error('평일 점심/스마트 알림 스케줄링 실패:', error);
  }
}

/** 4-3. 주말 여행 추천 (금 18시/토 9시/일 9시) — 반복 주기 */
export async function scheduleWeekendTravelNotification() {
  try {
    const isTraveling = await checkTravelStatus();
    if (isTraveling) {
      console.log('여행 중이므로 주말 여행 알림을 스케줄링하지 않습니다.');
      return;
    }

    await ensureChannel('weekend-travel', '주말 여행');

    const specs = [
      {
        id: 'weekend-travel-fri-18',
        ts: nextDowTime(5, 18, 0), // 금 18:00
        title: '이번 주말은 즉흥 여행 어떠세요? 🎒',
        body: '새로운 곳을 탐험해보세요!',
      },
      {
        id: 'weekend-travel-sat-9',
        ts: nextDowTime(6, 9, 0), // 토 9:00
        title: '토요일 아침! 🎒',
        body: '오늘은 새로운 여행을 시작해보세요!',
      },
      {
        id: 'weekend-travel-sun-9',
        ts: nextDowTime(0, 9, 0), // 일 9:00
        title: '일요일 아침! 🎒',
        body: '주말 마지막, 특별한 여행을 시작해보세요!',
      },
    ];

    for (const s of specs) {
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: s.ts,
        repeatFrequency: RepeatFrequency.WEEKLY,
      };

      await notifee.createTriggerNotification(
        {
          id: s.id,
          title: s.title,
          body: s.body,
          data: { screen: 'survey_travel', type: 'weekend_travel_recommendation' },
          android: {
            channelId: 'weekend-travel',
            importance: AndroidImportance.HIGH,
            style: { type: AndroidStyle.BIGTEXT, text: s.body },
            actions: [
              { title: '시작하기', pressAction: { id: 'start_weekend_travel', launchActivity: 'default' } },
              { title: '나중에', pressAction: { id: 'dismiss' } },
            ],
          },
          ios: { categoryId: 'weekend-travel' },
        },
        trigger
      );
    }

    console.log('주말 여행 추천 알림(금/토/일 반복)이 스케줄링되었습니다.');
  } catch (error) {
    console.error('주말 여행 추천 알림 스케줄링 실패:', error);
  }
}

/* ------------------------------------------------
 * 4-5. 취소 유틸
 * ------------------------------------------------ */
export async function cancelNotification(notificationId: string) {
  try {
    // 이미 표시된 알림을 끄는 용도
    await notifee.cancelNotification(notificationId);
    console.log(`표시된 알림 취소: ${notificationId}`);
  } catch (error) {
    console.error('알림 취소 실패:', error);
  }
}

export async function cancelAllWeekendTravelNotifications() {
  try {
    // 트리거 예약 취소 (반복 포함)
    await notifee.cancelTriggerNotifications([
      'weekend-travel-fri-18',
      'weekend-travel-sat-9',
      'weekend-travel-sun-9',
    ]);
    console.log('모든 주말 여행(트리거) 알림 예약이 취소되었습니다.');
  } catch (error) {
    console.error('주말 여행 트리거 알림 취소 실패:', error);
  }
}

export async function cancelAllNotifications() {
  try {
    await notifee.cancelAllNotifications(); // 표시된 알림
    await notifee.cancelAllNotifications(); // id중복 호출 무해
    console.log('표시된 모든 알림이 취소되었습니다.');
  } catch (error) {
    console.error('모든 알림 취소 실패:', error);
  }
}

/** 4-6. 여행 상태에 따른 재설정 */
export async function resetNotificationsBasedOnTravelStatus() {
  try {
    const isTraveling = await checkTravelStatus();

    // 여행 중 알림(트리거) ID들
    const travelTriggerIds = ['weekday-lunch', 'evening-smart', 'afternoon-smart'];

    if (isTraveling) {
      // 주말 반복 취소 + 여행 중 1회성 재설정
      await cancelAllWeekendTravelNotifications();
      await notifee.cancelTriggerNotifications(travelTriggerIds);
      await scheduleWeekdayLunchNotification();
      console.log('여행 중 - 주말 알림 취소, 여행 중 알림(점심/오후/저녁) 재설정');
    } else {
      // 여행 중 알림 취소 + 주말 반복 등록
      await notifee.cancelTriggerNotifications(travelTriggerIds);
      await scheduleWeekendTravelNotification();
      console.log('여행 중 아님 - 여행 중 알림 취소, 주말 여행 알림만 유지');
    }
  } catch (error) {
    console.error('여행 상태에 따른 알림 재설정 실패:', error);
  }
}

/* ------------------------------------------------
 * 4-7. 테스트 유틸
 * ------------------------------------------------ */

export async function sendTestNotification(type: 'lunch' | 'weekend' | 'travel') {
  try {
    console.log(`[알림 테스트] ${type} 알림 발송 시작`);

    await createNotificationChannels();

    const notification: {
      title: string;
      body: string;
      data: any;
      android: { channelId: string; importance: AndroidImportance; actions: AndroidAction[] };
      ios: { categoryId: string };
    } = {
      title: '',
      body: '',
      data: {},
      android: { channelId: 'default', importance: AndroidImportance.HIGH, actions: [] as AndroidAction[] },
      ios: { categoryId: 'default' },
    };

    switch (type) {
      case 'lunch':
        notification.title = '점심 시간이에요! 🍽️';
        notification.body = '근처 맛집을 추천해드릴까요?';
        notification.data = { screen: 'survey_destination', type: 'lunch_recommendation', category: 'restaurants' };
        notification.android.channelId = 'lunch-recommendations';
        notification.android.actions = [
          { title: '시작하기', pressAction: { id: 'find_restaurants', launchActivity: 'default' } },
          { title: '나중에', pressAction: { id: 'dismiss' } },
        ];
        notification.ios.categoryId = 'lunch-recommendations';
        break;
      case 'weekend':
        notification.title = '이번 주말은 즉흥 여행 어떠세요? 🎒';
        notification.body = '새로운 곳을 탐험해보세요!';
        notification.data = { screen: 'survey_travel', type: 'weekend_travel_recommendation' };
        notification.android.channelId = 'weekend-travel';
        notification.android.actions = [
          { title: '시작하기', pressAction: { id: 'start_weekend_travel', launchActivity: 'default' } },
          { title: '나중에', pressAction: { id: 'dismiss' } },
        ];
        notification.ios.categoryId = 'weekend-travel';
        break;
      case 'travel':
        notification.title = '새로운 여행을 떠나볼까요? 🚀';
        notification.body = '즉흥 여행으로 새로운 추억을 만들어보세요!';
        notification.data = { screen: 'survey_travel', type: 'travel_recommendation' };
        notification.android.channelId = 'travel-recommendations';
        notification.android.actions = [
          { title: '시작하기', pressAction: { id: 'start_travel', launchActivity: 'default' } },
          { title: '나중에', pressAction: { id: 'dismiss' } },
        ];
        notification.ios.categoryId = 'travel-recommendations';
        break;
    }

    await notifee.displayNotification(notification);
    console.log(`[알림 테스트] ${type} 알림 발송 완료`);

    return true;
  } catch (error) {
    console.error(`[알림 테스트] ${type} 알림 발송 실패:`, error);
    throw error;
  }
}

/** 1분 뒤 테스트 트리거 */
export async function scheduleTestNotification() {
  try {
    await ensureChannel('default', '기본 알림');
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + 60_000,
    };
    await notifee.createTriggerNotification(
      {
        id: 'test-notification',
        title: '테스트 알림 🔔',
        body: '알림이 정상적으로 작동합니다!',
        data: { screen: 'survey_travel', type: 'test_notification' },
        android: { channelId: 'default', importance: AndroidImportance.HIGH },
        ios: { categoryId: 'default' },
      },
      trigger
    );
    console.log('테스트 알림이 1분 후로 스케줄링되었습니다.');
  } catch (error) {
    console.error('테스트 알림 스케줄링 실패:', error);
  }
}

/** 백그라운드 알림 테스트 함수들 */
export async function testBackgroundNotifications() {
  try {
    console.log('[백그라운드 테스트] 시작...');
    
    // 1. 알림 권한 확인
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) {
      console.error('[백그라운드 테스트] 알림 권한이 없습니다.');
      throw new Error('알림 권한이 필요합니다. 설정에서 알림 권한을 허용해주세요.');
    }
    
    // 2. 채널 생성
    await ensureChannel('test-background', '백그라운드 테스트');
    
    // 3. 기존 테스트 알림 취소
    await cancelTestNotifications();
    
    // 4. 10초 후 알림 (빠른 테스트)
    await scheduleDelayedTestNotification(0.17);
    
    // 5. 1분 후 알림 (중간 테스트)
    await scheduleDelayedTestNotification(1);
    
    // 6. 3분 후 알림 (긴 테스트)
    await scheduleDelayedTestNotification(3);
    
    console.log('[백그라운드 테스트] 모든 테스트 알림이 스케줄링되었습니다.');
    console.log('[백그라운드 테스트] 앱을 완전히 종료하고 알림을 기다려보세요.');
    
    return true;
  } catch (error) {
    console.error('[백그라운드 테스트] 실패:', error);
    throw error;
  }
}

/** 지정된 분 후 테스트 알림 스케줄링 */
export async function scheduleDelayedTestNotification(minutes: number) {
  try {
    await ensureChannel('test-background', '백그라운드 테스트');
    
    // 현재 시간에 분을 더해서 정확한 시간 계산
    const now = new Date();
    const targetTime = new Date(now.getTime() + minutes * 60 * 1000);
    
    console.log(`[백그라운드 테스트] 현재 시간: ${now.toLocaleString('ko-KR')}`);
    console.log(`[백그라운드 테스트] ${minutes}분 후 시간: ${targetTime.toLocaleString('ko-KR')}`);
    
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: targetTime.getTime(),
    };
    
    await notifee.createTriggerNotification(
      {
        id: `test-background-${minutes}min`,
        title: `백그라운드 테스트 (${minutes}분 후) 🔔`,
        body: `앱이 종료된 상태에서도 알림이 잘 작동합니다! (${minutes}분 후 발송)`,
        data: { 
          screen: 'home_travel', 
          type: 'background_test', 
          minutes,
          actionId: 'open_app', // 액션 ID를 명시적으로 추가
          testType: 'background_delayed'
        },
        android: {
          channelId: 'test-background',
          importance: AndroidImportance.HIGH,
          style: { 
            type: AndroidStyle.BIGTEXT, 
            text: `백그라운드 알림 테스트 성공! 앱이 종료된 상태에서도 알림이 잘 작동합니다. (${minutes}분 후 발송)` 
          },
          actions: [
            { title: '앱 열기', pressAction: { id: 'open_app', launchActivity: 'default' } },
            { title: '확인', pressAction: { id: 'dismiss' } },
          ],
        },
        ios: { 
          categoryId: 'test-background',
        },
      },
      trigger
    );
    
    console.log(`[백그라운드 테스트] ${minutes}분 후 테스트 알림 스케줄링 완료`);
    console.log(`[백그라운드 테스트] 알림 ID: test-background-${minutes}min`);
    console.log(`[백그라운드 테스트] 액션 ID: open_app, dismiss`);
  } catch (error) {
    console.error(`[백그라운드 테스트] ${minutes}분 후 알림 스케줄링 실패:`, error);
    throw error;
  }
}

/** 모든 테스트 알림 취소 */
export async function cancelTestNotifications() {
  try {
    const testIds = [
      'test-notification',
      'test-background-0.17min',
      'test-background-1min', 
      'test-background-3min'
    ];
    
    for (const id of testIds) {
      await notifee.cancelNotification(id);
    }
    
    // 트리거 알림도 취소
    await notifee.cancelTriggerNotifications(testIds);
    
    console.log('[테스트 알림] 모든 테스트 알림이 취소되었습니다.');
  } catch (error) {
    console.error('[테스트 알림] 취소 실패:', error);
  }
}

/** 현재 스케줄된 모든 알림 확인 */
export async function checkScheduledNotifications() {
  try {
    const scheduledIds = await notifee.getTriggerNotificationIds();
    console.log('[알림 확인] 현재 스케줄된 알림들:', scheduledIds);
    
    // 각 알림의 상세 정보 확인
    for (const id of scheduledIds) {
      try {
        const notifications = await notifee.getTriggerNotifications();
        const notification = notifications.find(n => n.notification.id === id);
        console.log(`[알림 확인] ${id}:`, {
          title: notification?.notification?.title,
          body: notification?.notification?.body,
          trigger: notification?.trigger,
        });
      } catch (error) {
        console.log(`[알림 확인] ${id} 상세 정보 조회 실패:`, error);
      }
    }
    
    return scheduledIds;
  } catch (error) {
    console.error('[알림 확인] 실패:', error);
    return [];
  }
}

/** 즉시 테스트 알림 발송 (포그라운드 테스트용) */
export async function sendImmediateTestNotification() {
  try {
    await ensureChannel('test-immediate', '즉시 테스트');
    
    await notifee.displayNotification({
      id: 'test-immediate',
      title: '즉시 테스트 알림 🔔',
      body: '알림이 즉시 표시됩니다!',
      data: { screen: 'home_travel', type: 'immediate_test' },
      android: {
        channelId: 'test-immediate',
        importance: AndroidImportance.HIGH,
        style: { 
          type: AndroidStyle.BIGTEXT, 
          text: '즉시 테스트 알림이 성공적으로 표시되었습니다!' 
        },
        actions: [
          { title: '확인', pressAction: { id: 'dismiss' } },
        ],
      },
      ios: { 
        categoryId: 'test-immediate',
        sound: 'default',
      },
    });
    
    console.log('[즉시 테스트] 알림 발송 완료');
    return true;
  } catch (error) {
    console.error('[즉시 테스트] 알림 발송 실패:', error);
    throw error;
  }
}

/** 알림 권한 상태 상세 확인 */
export async function getDetailedNotificationStatus() {
  try {
    const notifeeSettings = await notifee.getNotificationSettings();
    const fcmSettings = await messaging().hasPermission();
    
    const status = {
      notifee: {
        authorizationStatus: notifeeSettings.authorizationStatus,
        isAuthorized: notifeeSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
        isProvisional: notifeeSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL,
      },
      fcm: {
        hasPermission: fcmSettings === messaging.AuthorizationStatus.AUTHORIZED,
        status: fcmSettings,
      },
      summary: {
        canSendNotifications: notifeeSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED || 
                              notifeeSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL,
        canSendBackgroundNotifications: notifeeSettings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
      }
    };
    
    console.log('[알림 상태] 상세 정보:', status);
    return status;
  } catch (error) {
    console.error('[알림 상태] 확인 실패:', error);
    throw error;
  }
}

/* ------------------------------------------------
 * 5. 액션 처리
 * ------------------------------------------------ */
export async function handleNotificationAction(actionId: string, notificationData: any) {
  console.log('[알림 액션] 액션 ID:', actionId);
  console.log('[알림 액션] 알림 데이터:', notificationData);

  const isTraveling = await checkTravelStatus();
  console.log('[알림 액션] 여행 상태:', isTraveling);

  const goLastOrHome = async (extra?: any) => {
    const last = await getLastScreen();
    if (last) {
      return { screen: last.screen, params: { fromNotification: true, ...last.params, ...extra } };
    }
    return { screen: 'home_travel', params: { fromNotification: true, ...extra } };
  };

  switch (actionId) {
    case 'start_travel':
      return { screen: 'survey_travel', params: { fromNotification: true } };
    case 'start_weekend_travel':
      return { screen: 'survey_travel', params: { fromNotification: true } };
    case 'find_restaurants':
      return isTraveling ? goLastOrHome({ category: 'restaurants' }) : { screen: 'survey_travel', params: { fromNotification: true, category: 'restaurants' } };
    case 'find_accommodations':
      return isTraveling ? goLastOrHome({ category: 'accommodations' }) : { screen: 'survey_travel', params: { fromNotification: true, category: 'accommodations' } };
    case 'find_cafes':
      return isTraveling ? goLastOrHome({ category: 'cafes' }) : { screen: 'survey_travel', params: { fromNotification: true, category: 'cafes' } };
    case 'open_app':
      // 백그라운드 테스트용 액션
      return isTraveling ? goLastOrHome() : { screen: 'home_travel', params: { fromNotification: true, testType: 'background' } };
    case 'dismiss':
      return null;
    default:
      if (notificationData?.screen) {
        return isTraveling
          ? goLastOrHome(notificationData)
          : { screen: 'survey_travel', params: { fromNotification: true, ...notificationData } };
      }
      return isTraveling ? goLastOrHome() : { screen: 'survey_travel', params: { fromNotification: true } };
  }
}

/* ------------------------------------------------
 * 6. 상태 저장/조회 & 추천 타입
 * ------------------------------------------------ */

export async function checkTravelStatus(): Promise<boolean> {
  try {
    const isTraveling = await SecureStore.getItemAsync('isTraveling');
    return isTraveling === 'true';
  } catch (error) {
    console.error('여행 상태 확인 실패:', error);
    return false;
  }
}

export async function saveLastScreen(screen: string, params?: any) {
  try {
    await SecureStore.setItemAsync('lastScreen', screen);
    if (params) await SecureStore.setItemAsync('lastScreenParams', JSON.stringify(params));
    console.log('[알림] 마지막 화면 저장:', screen, params);
  } catch (error) {
    console.error('마지막 화면 저장 실패:', error);
  }
}

export async function getLastScreen(): Promise<{ screen: string; params?: any } | null> {
  try {
    const screen = await SecureStore.getItemAsync('lastScreen');
    const paramsStr = await SecureStore.getItemAsync('lastScreenParams');
    if (screen) {
      const params = paramsStr ? JSON.parse(paramsStr) : undefined;
      console.log('[알림] 마지막 화면 복원:', screen, params);
      return { screen, params };
    }
    return null;
  } catch (error) {
    console.error('마지막 화면 가져오기 실패:', error);
    return null;
  }
}

export async function getRecommendationTypeBasedOnLastVisit(): Promise<{
  type: 'restaurants' | 'cafes' | 'attractions' | 'accommodations';
  message: string;
  buttonText: string;
}> {
  try {
    const { travelService } = require('../service/travelService');
    const visitedContents = await travelService.getVisitedContents();

    if (!visitedContents.length) {
      return { type: 'restaurants', message: '여행을 시작했어요! 우선 식사부터 하시는 건 어떨까요?', buttonText: '식당 추천받기' };
    }

    const trips = await travelService.getTripData();
    const latestTrip = trips.sort((a: any, b: any) => b.id - a.id)[0];
    const currentTripVisits = visitedContents.filter((v: any) => v.trip === latestTrip.id);

    if (!currentTripVisits.length) {
      return { type: 'restaurants', message: '여행을 시작했어요! 우선 식사부터 하시는 건 어떨까요?', buttonText: '식당 추천받기' };
    }

    const lastVisited = currentTripVisits[currentTripVisits.length - 1];
    const lastCategory = lastVisited.category || 'attractions';
    console.log(`[알림] 마지막 방문지 카테고리: ${lastCategory} (${lastVisited.title})`);

    switch (lastCategory) {
      case 'restaurants':
        return { type: 'cafes', message: '식사를 마쳤어요! 시원한 커피 한 잔 어떠세요?', buttonText: '카페 추천받기' };
      case 'cafes':
        return { type: 'attractions', message: '다음엔 관광지를 방문해보아요!', buttonText: '관광지 추천받기' };
      case 'attractions':
        return { type: 'restaurants', message: '관광을 마쳤어요! 맛있는 식사 어떠세요?', buttonText: '식당 추천받기' };
      case 'accommodations':
        return { type: 'attractions', message: '숙소에 도착했어요! 주변 관광지도 둘러보세요!', buttonText: '관광지 추천받기' };
      default:
        return { type: 'restaurants', message: '다음 행선지를 찾아보세요!', buttonText: '식당 추천받기' };
    }
  } catch (error) {
    console.error('마지막 방문지 기반 추천 타입 결정 실패:', error);
    return { type: 'restaurants', message: '다음 행선지를 찾아보세요!', buttonText: '식당 추천받기' };
  }
}

/* ------------------------------------------------
 * 7. 권한 상태 확인 (Notifee 기준)
 * ------------------------------------------------ */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const st = await notifee.getNotificationSettings();
    return (
      st.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      st.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.error('알림 권한 확인 실패:', error);
    return false;
  }
}
