import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, TriggerType, AndroidStyle, AndroidAction, TimestampTrigger } from '@notifee/react-native';

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

// ★★★ 4. 새로운 로컬 알림 기능들 ★★★

// 4-1. 여행 종료 후 이틀 뒤 추천 알림 스케줄링
export async function schedulePostTravelRecommendation() {
  try {
    // 이틀 후 (48시간) 스케줄링
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: Date.now() + (48 * 60 * 60 * 1000), // 48시간 후
    };

    await notifee.createTriggerNotification(
      {
        title: '새로운 여행을 떠나볼까요? 🚀',
        body: '즉흥 여행으로 새로운 추억을 만들어보세요!',
        data: {
          screen: 'survey_travel',
          type: 'post_travel_recommendation'
        },
        android: {
          channelId: 'travel-recommendations',
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: '즉흥 여행으로 새로운 추억을 만들어보세요! 지금 바로 여행을 시작해보세요.',
          },
          actions: [
            {
              title: '시작하기',
              pressAction: {
                id: 'start_travel',
                launchActivity: 'default',
              },
            },
            {
              title: '나중에',
              pressAction: {
                id: 'dismiss',
              },
            },
          ],
        },
        ios: {
          categoryId: 'travel-recommendations',
        },
      },
      trigger,
    );
    
    console.log('여행 종료 후 추천 알림이 48시간 후로 스케줄링되었습니다.');
  } catch (error) {
    console.error('여행 종료 후 추천 알림 스케줄링 실패:', error);
  }
}

// 4-2. 평일 점심 알림 스케줄링 (매일 오전 11:30)
export async function scheduleWeekdayLunchNotification() {
  try {
    const now = new Date();
    const triggerTime = new Date();
    triggerTime.setHours(11, 30, 0, 0); // 오전 11:30
    
    // 오늘 이미 11:30이 지났으면 내일로 설정
    if (now.getTime() > triggerTime.getTime()) {
      triggerTime.setDate(triggerTime.getDate() + 1);
    }
    
    // 평일인지 확인 (0: 일요일, 6: 토요일)
    const dayOfWeek = triggerTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 주말이면 다음 월요일로 설정
      const daysUntilMonday = (1 - dayOfWeek + 7) % 7;
      triggerTime.setDate(triggerTime.getDate() + daysUntilMonday);
    }
    
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
      alarmManager: true, // Android에서 정확한 시간에 알림
    };

    await notifee.createTriggerNotification(
      {
        id: 'weekday-lunch', // 고유 ID로 중복 방지
        title: '점심 시간이에요! 🍽️',
        body: '근처 맛집을 추천해드릴까요?',
        data: {
          screen: 'survey_destination',
          type: 'lunch_recommendation',
          category: 'restaurants'
        },
        android: {
          channelId: 'lunch-recommendations',
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: '근처 맛집을 추천해드릴까요? 지금 바로 맛집을 찾아보세요!',
          },
          actions: [
            {
              title: '시작하기',
              pressAction: {
                id: 'find_restaurants',
                launchActivity: 'default',
              },
            },
            {
              title: '나중에',
              pressAction: {
                id: 'dismiss',
              },
            },
          ],
        },
        ios: {
          categoryId: 'lunch-recommendations',
        },
      },
      trigger,
    );
    
    console.log('평일 점심 알림이 스케줄링되었습니다:', triggerTime);
  } catch (error) {
    console.error('평일 점심 알림 스케줄링 실패:', error);
  }
}

// 4-3. 주말 여행 추천 알림 스케줄링 (매주 금요일 오후 6시)
export async function scheduleWeekendTravelNotification() {
  try {
    const now = new Date();
    const triggerTime = new Date();
    
    // 다음 금요일 오후 6시로 설정
    const daysUntilFriday = (5 - now.getDay() + 7) % 7; // 0: 일요일, 5: 금요일
    triggerTime.setDate(now.getDate() + daysUntilFriday);
    triggerTime.setHours(18, 0, 0, 0); // 오후 6시
    
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime.getTime(),
      alarmManager: true,
    };

    await notifee.createTriggerNotification(
      {
        id: 'weekend-travel', // 고유 ID로 중복 방지
        title: '이번 주말은 즉흥 여행 어떠세요? 🎒',
        body: '새로운 곳을 탐험해보세요!',
        data: {
          screen: 'survey_travel',
          type: 'weekend_travel_recommendation'
        },
        android: {
          channelId: 'weekend-travel',
          importance: AndroidImportance.HIGH,
          style: {
            type: AndroidStyle.BIGTEXT,
            text: '이번 주말은 즉흥 여행 어떠세요? 새로운 곳을 탐험해보세요!',
          },
          actions: [
            {
              title: '시작하기',
              pressAction: {
                id: 'start_weekend_travel',
                launchActivity: 'default',
              },
            },
            {
              title: '나중에',
              pressAction: {
                id: 'dismiss',
              },
            },
          ],
        },
        ios: {
          categoryId: 'weekend-travel',
        },
      },
      trigger,
    );
    
    console.log('주말 여행 추천 알림이 스케줄링되었습니다:', triggerTime);
  } catch (error) {
    console.error('주말 여행 추천 알림 스케줄링 실패:', error);
  }
}

// 4-4. 모든 알림 채널 생성
export async function createNotificationChannels() {
  try {
    // 기본 채널
    await notifee.createChannel({
      id: 'default',
      name: '기본 알림',
      importance: AndroidImportance.HIGH,
    });

    // 여행 추천 채널
    await notifee.createChannel({
      id: 'travel-recommendations',
      name: '여행 추천',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    // 점심 추천 채널
    await notifee.createChannel({
      id: 'lunch-recommendations',
      name: '점심 추천',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    // 주말 여행 채널
    await notifee.createChannel({
      id: 'weekend-travel',
      name: '주말 여행',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });

    console.log('모든 알림 채널이 생성되었습니다.');
  } catch (error) {
    console.error('알림 채널 생성 실패:', error);
  }
}

// 4-5. 특정 알림 취소
export async function cancelNotification(notificationId: string) {
  try {
    await notifee.cancelNotification(notificationId);
    console.log(`알림이 취소되었습니다: ${notificationId}`);
  } catch (error) {
    console.error('알림 취소 실패:', error);
  }
}

// 4-6. 모든 알림 취소
export async function cancelAllNotifications() {
  try {
    await notifee.cancelAllNotifications();
    console.log('모든 알림이 취소되었습니다.');
  } catch (error) {
    console.error('모든 알림 취소 실패:', error);
  }
}

// ★★★ 4-7. 테스트용 즉시 알림 (개발/테스트용) ★★★
export async function sendTestNotification(type: 'lunch' | 'weekend' | 'travel') {
  try {
    console.log(`[알림 테스트] ${type} 알림 발송 시작`);
    
    let notification = {
      title: '',
      body: '',
      data: {},
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
        actions: [] as AndroidAction[],
      },
      ios: {
        categoryId: 'default',
      },
    };

    switch (type) {
      case 'lunch':
        notification.title = '점심 시간이에요! 🍽️';
        notification.body = '근처 맛집을 추천해드릴까요?';
        notification.data = {
          screen: 'survey_destination',
          type: 'lunch_recommendation',
          category: 'restaurants'
        };
        notification.android.channelId = 'lunch-recommendations';
        notification.android.actions = [
          {
            title: '시작하기',
            pressAction: {
              id: 'find_restaurants',
              launchActivity: 'default',
            },
          },
          {
            title: '나중에',
            pressAction: {
              id: 'dismiss',
            },
          },
        ];
        notification.ios.categoryId = 'lunch-recommendations';
        break;
      case 'weekend':
        notification.title = '이번 주말은 즉흥 여행 어떠세요? 🎒';
        notification.body = '새로운 곳을 탐험해보세요!';
        notification.data = {
          screen: 'survey_travel',
          type: 'weekend_travel_recommendation'
        };
        notification.android.channelId = 'weekend-travel';
        notification.android.actions = [
          {
            title: '시작하기',
            pressAction: {
              id: 'start_weekend_travel',
              launchActivity: 'default',
            },
          },
          {
            title: '나중에',
            pressAction: {
              id: 'dismiss',
            },
          },
        ];
        notification.ios.categoryId = 'weekend-travel';
        break;
      case 'travel':
        notification.title = '새로운 여행을 떠나볼까요? 🚀';
        notification.body = '즉흥 여행으로 새로운 추억을 만들어보세요!';
        notification.data = {
          screen: 'survey_travel',
          type: 'travel_recommendation'
        };
        notification.android.channelId = 'travel-recommendations';
        notification.android.actions = [
          {
            title: '시작하기',
            pressAction: {
              id: 'start_travel',
              launchActivity: 'default',
            },
          },
          {
            title: '나중에',
            pressAction: {
              id: 'dismiss',
            },
          },
        ];
        notification.ios.categoryId = 'travel-recommendations';
        break;
    }

    console.log(`[알림 테스트] 알림 객체 생성 완료:`, notification);

    // 알림 채널 생성 확인
    await createNotificationChannels();
    console.log(`[알림 테스트] 알림 채널 생성 완료`);

    // 알림 발송
    await notifee.displayNotification(notification);
    console.log(`[알림 테스트] ${type} 알림 발송 완료`);
    
    return true;
  } catch (error) {
    console.error(`[알림 테스트] ${type} 알림 발송 실패:`, error);
    throw error;
  }
}

// ★★★ 5. 알림 액션 처리 함수 ★★★
export function handleNotificationAction(actionId: string, notificationData: any) {
  console.log('[알림 액션] 액션 ID:', actionId);
  console.log('[알림 액션] 알림 데이터:', notificationData);
  
  // 액션 ID에 따른 처리
  switch (actionId) {
    case 'start_travel':
      console.log('[알림 액션] start_travel 처리 -> survey_travel 화면으로 이동');
      return {
        screen: 'survey_travel',
        params: { fromNotification: true }
      };
    case 'start_weekend_travel':
      console.log('[알림 액션] start_weekend_travel 처리 -> survey_travel 화면으로 이동');
      return {
        screen: 'survey_travel',
        params: { fromNotification: true }
      };
    case 'find_restaurants':
      console.log('[알림 액션] find_restaurants 처리 -> survey_travel 화면으로 이동');
      return {
        screen: 'survey_travel',
        params: { 
          fromNotification: true,
          category: 'restaurants'
        }
      };
    case 'dismiss':
      console.log('[알림 액션] dismiss 처리 -> 아무것도 하지 않음');
      return null; // 아무것도 하지 않음
    default:
      console.log('[알림 액션] default 케이스 처리');
      // 알림 데이터에서 screen 정보 확인
      if (notificationData?.screen) {
        console.log('[알림 액션] notificationData.screen 존재:', notificationData.screen);
        // 모든 알림에서 survey_travel로 이동
        return {
          screen: 'survey_travel',
          params: { 
            fromNotification: true,
            ...notificationData
          }
        };
      }
      console.log('[알림 액션] notificationData.screen 없음 -> survey_travel로 이동');
      return {
        screen: 'survey_travel',
        params: { fromNotification: true }
      };
  }
}