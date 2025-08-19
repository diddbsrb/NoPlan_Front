// app/(tabs)/test.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
import { travelService } from '../../service/travelService';
// ★★★ 알림 테스트를 위한 import 추가 ★★★
import {
  createNotificationChannels,
  requestUserPermission,
  schedulePostTravelRecommendation,
  scheduleWeekdayLunchNotification,
  scheduleWeekendTravelNotification,
  testBackgroundNotifications,
  checkScheduledNotifications,
  cancelTestNotifications,
  scheduleTestNotification
} from '../../utils/pushNotificationHelper';

export default function TestScreen() {
  const router = useRouter();
  const { setIsTraveling } = useTravelSurvey();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<string[]>([]);

  // 컴포넌트 렌더링 확인
  console.log('[테스트 화면] 컴포넌트 렌더링됨');

  // ★★★ 백그라운드 종합 테스트 함수들 ★★★
  const handleTestBackgroundNotifications = async () => {
    setIsLoading(true);
    try {
      const result = await testBackgroundNotifications();
      if (result) {
        Alert.alert('성공', '백그라운드 테스트 알림이 스케줄링되었습니다.\n앱을 완전히 종료하고 알림을 기다려보세요.');
      } else {
        Alert.alert('실패', '백그라운드 테스트 알림 스케줄링에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '테스트 중 오류가 발생했습니다.');
      console.error('백그라운드 테스트 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckScheduledNotifications = async () => {
    setIsLoading(true);
    try {
      const notifications = await checkScheduledNotifications();
      setScheduledNotifications(notifications);
    } catch (error) {
      Alert.alert('오류', '스케줄된 알림 확인 중 오류가 발생했습니다.');
      console.error('알림 확인 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelTestNotifications = async () => {
    setIsLoading(true);
    try {
      await cancelTestNotifications();
      Alert.alert('성공', '모든 테스트 알림이 취소되었습니다.');
      setScheduledNotifications([]);
    } catch (error) {
      Alert.alert('오류', '테스트 알림 취소 중 오류가 발생했습니다.');
      console.error('알림 취소 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScheduleTestNotification = async () => {
    setIsLoading(true);
    try {
      await scheduleTestNotification();
      Alert.alert('성공', '1분 후 테스트 알림이 스케줄링되었습니다.');
    } catch (error) {
      Alert.alert('오류', '테스트 알림 스케줄링 중 오류가 발생했습니다.');
      console.error('테스트 알림 스케줄링 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ★★★ 알림 테스트 함수들 ★★★
  const testLunchNotification = async () => {
    try {
      console.log('[테스트 화면] 점심 알림 테스트 시작');
      console.log('[테스트 화면] 현재 시간:', new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }));
      await scheduleWeekdayLunchNotification();
      console.log('[테스트 화면] 점심 알림 테스트 결과: 성공');
      alert('점심 알림 테스트 완료! 알림을 확인해보세요.');
      } catch (error) {
      console.error('[테스트 화면] 점심 알림 테스트 실패:', error);
      alert(`점심 알림 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const testWeekendNotification = async () => {
    try {
      console.log('[테스트 화면] 주말 여행 알림 테스트 시작');
      await scheduleWeekendTravelNotification();
      console.log('[테스트 화면] 주말 여행 알림 테스트 결과: 성공');
      alert('주말 여행 알림 테스트 완료! 알림을 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 주말 여행 알림 테스트 실패:', error);
      alert(`주말 여행 알림 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const testTravelNotification = async () => {
    try {
      console.log('[테스트 화면] 여행 추천 알림 테스트 시작');
      await schedulePostTravelRecommendation();
      console.log('[테스트 화면] 여행 추천 알림 테스트 결과: 성공');
      alert('여행 추천 알림 테스트 완료! 알림을 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 여행 추천 알림 테스트 실패:', error);
      alert(`여행 추천 알림 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const testScheduledNotifications = async () => {
    try {
      await createNotificationChannels();
      await scheduleWeekdayLunchNotification();
      await scheduleWeekendTravelNotification();
      console.log('스케줄된 알림 설정 완료');
      alert('스케줄된 알림 설정 완료!');
    } catch (error) {
      console.error('스케줄된 알림 설정 실패:', error);
      alert(`스케줄된 알림 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const testPostTravelNotification = async () => {
    try {
      await schedulePostTravelRecommendation();
      console.log('여행 완료 후 알림 스케줄링 완료 (48시간 후)');
      alert('여행 완료 후 알림 스케줄링 완료 (48시간 후)!');
    } catch (error) {
      console.error('여행 완료 후 알림 스케줄링 실패:', error);
      alert(`여행 완료 후 알림 스케줄링 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const testNotificationWithActions = async () => {
    try {
      console.log('[테스트 화면] 알림 액션 테스트 시작');
      await scheduleTestNotification();
      console.log('[테스트 화면] 알림 액션 테스트 결과: 성공');
      alert('알림 액션 테스트 완료! 알림을 눌러서 앱이 열리는지 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 알림 액션 테스트 실패:', error);
      alert(`알림 액션 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('[테스트 화면] 알림 권한 요청 시작');
      await requestUserPermission();
      alert('알림 권한 요청 완료! 설정에서 알림 권한을 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 알림 권한 요청 실패:', error);
      alert(`알림 권한 요청 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>테스트 화면</Text>
        </View>

        <View style={styles.content}>
          {/* ★★★ 백그라운드 종합 테스트 섹션 추가 ★★★ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 백그라운드 종합 테스트</Text>
            
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={() => Alert.alert('테스트', '버튼이 작동합니다!')}
            >
              <Text style={styles.testButtonText}>🔧 간단한 테스트 버튼</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleScheduleTestNotification}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>1분 후 테스트 알림</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleTestBackgroundNotifications}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>백그라운드 종합 테스트 (1,5,10분)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.testButton} 
              onPress={handleCheckScheduledNotifications}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>스케줄된 알림 확인</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.testButton, styles.cancelButton]} 
              onPress={handleCancelTestNotifications}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>테스트 알림 모두 취소</Text>
            </TouchableOpacity>
          </View>

          {scheduledNotifications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>현재 스케줄된 알림</Text>
              {scheduledNotifications.map((id, index) => (
                <Text key={index} style={styles.notificationItem}>
                  • {id}
                </Text>
              ))}
            </View>
          )}

          {/* ★★★ 알림 테스트 섹션 추가 ★★★ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 즉시 알림 테스트</Text>
            
            <TouchableOpacity style={styles.testButton} onPress={testLunchNotification}>
              <Text style={styles.testButtonText}>점심 알림 테스트</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={testWeekendNotification}>
              <Text style={styles.testButtonText}>주말 여행 알림 테스트</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={testTravelNotification}>
              <Text style={styles.testButtonText}>여행 추천 알림 테스트</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={testScheduledNotifications}>
              <Text style={styles.testButtonText}>스케줄된 알림 설정</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={testPostTravelNotification}>
              <Text style={styles.testButtonText}>여행 완료 후 알림 (48시간 후)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={testNotificationWithActions}>
              <Text style={styles.testButtonText}>알림 액션 테스트 (즉시)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.testButton} onPress={requestNotificationPermission}>
              <Text style={styles.testButtonText}>🔔 알림 권한 요청</Text>
            </TouchableOpacity>
          </View>

          {/* 기존 여행 테스트 섹션 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🧳 여행 테스트</Text>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/survey_travel')}
            >
              <Text style={styles.buttonText}>여행 시작</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.buttonText}>여행 종료</Text>
            </TouchableOpacity>
          </View>

          {/* 테스트 방법 안내 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 백그라운드 테스트 방법</Text>
            <Text style={styles.instruction}>
              1. "백그라운드 종합 테스트" 버튼을 누르세요{'\n'}
              2. 앱을 완전히 종료하세요 (백그라운드에서도 제거){'\n'}
              3. 1분, 5분, 10분 후 알림이 오는지 확인하세요{'\n'}
              4. 알림을 탭해서 앱이 정상적으로 열리는지 확인하세요
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* 종료 모달 */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>여행을 종료하시겠어요?</Text>
            <Text style={styles.modalDesc}>여행 이력은 마이페이지에 저장됩니다.</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnGray} onPress={() => setShowModal(false)}>
                <Text style={styles.modalBtnTextGray}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnBlue}
                onPress={async () => {
                  setShowModal(false);
                  try {
                    // 최신 trip 가져오기
                    const trips = await travelService.getTripData();
                    const latest = trips.sort((a, b) => b.id - a.id)[0];
                    
                    // 여행 요약 생성
                    const summaryData = await travelService.summarizeTrip(latest.id);
                    
                    // summary.tsx로 이동하면서 요약 데이터 전달
                    router.replace({
                      pathname: '/summary',
                      params: { 
                        tripId: latest.id.toString(),
                        summary: summaryData.summary,
                        region: latest.region
                      }
                    });
                  } catch (e) {
                    console.error('여행 요약 생성 실패:', e);
                    // 요약 생성 실패 시에도 여행 상태를 false로 설정
                    await setIsTraveling(false);
                    // 요약 생성 실패 시 바로 홈으로 이동
                    router.replace('/home');
                  }
                }}
              >
                <Text style={styles.modalBtnTextBlue}>여행 종료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  notificationItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#123A86',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  modalBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24,
    margin: 20,
    alignItems: 'center', 
  },
  modalTitle: { 
    fontSize: 18, 
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 8, 
  },
  modalDesc: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBtnRow: { 
    flexDirection: 'row', 
    gap: 12,
  },
  modalBtnGray: { 
    backgroundColor: '#E0E0E0', 
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8, 
  },
  modalBtnTextGray: { 
    color: '#666',
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
  modalBtnBlue: { 
    backgroundColor: '#123A86',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8, 
  },
  modalBtnTextBlue: { 
    color: '#fff', 
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
  },
});
