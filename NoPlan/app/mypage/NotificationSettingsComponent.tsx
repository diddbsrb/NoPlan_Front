import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  createNotificationChannels,
  requestUserPermission,
  scheduleWeekdayLunchNotification,
  scheduleWeekendTravelNotification,
  schedulePostTravelRecommendation,
  loadNotificationPreferences,
  toggleNotificationType,
  type NotificationPreferences,
} from '../../utils/pushNotificationHelper';

// NotificationPreferences는 pushNotificationHelper에서 import

interface Props {
  onBack?: () => void;
}

export default function NotificationSettingsComponent({ onBack }: Props) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    weekday_lunch: true,
    weekend_travel: true,
    travel_recommendations: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      setIsLoading(true);
      
      // 알림 권한 확인
      const permission = await requestUserPermission();
      setHasPermission(permission);
      
      // 저장된 설정 로드
      const savedPreferences = await loadNotificationPreferences();
      setPreferences(savedPreferences);
      
      console.log('[알림 설정] 로드된 설정:', savedPreferences);
    } catch (error) {
      console.error('알림 설정 로드 실패:', error);
      Alert.alert('오류', '알림 설정을 불러오는데 실패했습니다.');
      
      // 오류 시 기본값 사용
      setPreferences({
        weekday_lunch: true,
        weekend_travel: true,
        travel_recommendations: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!hasPermission) {
      Alert.alert(
        '알림 권한 필요',
        '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          { text: '설정으로 이동', onPress: () => {
            // 설정 앱으로 이동하는 로직 (필요시 구현)
          }}
        ]
      );
      return;
    }

    try {
      setIsSaving(true);
      
      // 실제 알림 토글 (설정 저장 + 알림 스케줄링/취소)
      const newPreferences = await toggleNotificationType(key, preferences);
      setPreferences(newPreferences);
      
      console.log(`[알림 설정] ${key} 알림 ${newPreferences[key] ? '활성화' : '비활성화'} 완료`);
      
      // 사용자에게 피드백 제공
      const message = newPreferences[key] 
        ? `${getNotificationDisplayName(key)} 알림이 활성화되었습니다.`
        : `${getNotificationDisplayName(key)} 알림이 비활성화되었습니다.`;
      
      Alert.alert('알림 설정 변경', message);
      
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error);
      Alert.alert('오류', '알림 설정 업데이트에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 알림 타입별 표시 이름
  const getNotificationDisplayName = (key: keyof NotificationPreferences): string => {
    switch (key) {
      case 'weekday_lunch':
        return '평일 점심';
      case 'weekend_travel':
        return '주말 여행';
      case 'travel_recommendations':
        return '여행 추천';
      default:
        return '알림';
    }
  };


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>알림 설정을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹ 뒤로</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.title}>알림 설정</Text>
        <Text style={styles.subtitle}>
          원하는 알림을 선택하여 받아보세요
        </Text>
      </View>

      {!hasPermission && (
        <View style={styles.permissionWarning}>
          <Text style={styles.warningText}>
            ⚠️ 알림 권한이 필요합니다. 설정에서 알림을 허용해주세요.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>평일 점심 알림</Text>
            <Text style={styles.settingDescription}>
              매일 오전 11시 50분에 점심 추천 알림을 받습니다
            </Text>
          </View>
          <Switch
            value={preferences.weekday_lunch}
            onValueChange={() => handleToggle('weekday_lunch')}
            disabled={isSaving}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={preferences.weekday_lunch ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>주말 여행 알림</Text>
            <Text style={styles.settingDescription}>
              매주 금요일 오후 6시, 토/일요일 오전 9시에 주말 여행 추천 알림을 받습니다
            </Text>
          </View>
          <Switch
            value={preferences.weekend_travel}
            onValueChange={() => handleToggle('weekend_travel')}
            disabled={isSaving}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={preferences.weekend_travel ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>여행 추천 알림</Text>
            <Text style={styles.settingDescription}>
              여행 종료 후 새로운 여행 추천 알림을 받습니다
            </Text>
          </View>
          <Switch
            value={preferences.travel_recommendations}
            onValueChange={() => handleToggle('travel_recommendations')}
            disabled={isSaving}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor={preferences.travel_recommendations ? '#FFFFFF' : '#FFFFFF'}
          />
        </View>
      </View>

      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.savingText}>저장 중...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'Pretendard-Medium',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  permissionWarning: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  savingIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 10,
  },
  savingText: {
    fontSize: 14,
    color: '#666',
  },
});

