// app/(tabs)/test.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
import { travelService } from '../../service/travelService';
// ★★★ 알림 테스트를 위한 import 추가 ★★★
import { 
  sendTestNotification, 
  schedulePostTravelRecommendation,
  scheduleWeekdayLunchNotification,
  scheduleWeekendTravelNotification,
  createNotificationChannels
} from '../../utils/pushNotificationHelper';

export default function TestScreen() {
  const router = useRouter();
  const { setIsTraveling } = useTravelSurvey();
  const [showModal, setShowModal] = useState(false);

  // ★★★ 알림 테스트 함수들 ★★★
  const testLunchNotification = async () => {
    try {
      console.log('[테스트 화면] 점심 알림 테스트 시작');
      const result = await sendTestNotification('lunch');
      console.log('[테스트 화면] 점심 알림 테스트 결과:', result);
      alert('점심 알림 테스트 완료! 알림을 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 점심 알림 테스트 실패:', error);
      alert(`점심 알림 테스트 실패: ${error.message}`);
    }
  };

  const testWeekendNotification = async () => {
    try {
      console.log('[테스트 화면] 주말 여행 알림 테스트 시작');
      const result = await sendTestNotification('weekend');
      console.log('[테스트 화면] 주말 여행 알림 테스트 결과:', result);
      alert('주말 여행 알림 테스트 완료! 알림을 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 주말 여행 알림 테스트 실패:', error);
      alert(`주말 여행 알림 테스트 실패: ${error.message}`);
    }
  };

  const testTravelNotification = async () => {
    try {
      console.log('[테스트 화면] 여행 추천 알림 테스트 시작');
      const result = await sendTestNotification('travel');
      console.log('[테스트 화면] 여행 추천 알림 테스트 결과:', result);
      alert('여행 추천 알림 테스트 완료! 알림을 확인해보세요.');
    } catch (error) {
      console.error('[테스트 화면] 여행 추천 알림 테스트 실패:', error);
      alert(`여행 추천 알림 테스트 실패: ${error.message}`);
    }
  };

  const testScheduledNotifications = async () => {
    try {
      await createNotificationChannels();
      await scheduleWeekdayLunchNotification();
      await scheduleWeekendTravelNotification();
      console.log('스케줄된 알림 설정 완료');
    } catch (error) {
      console.error('스케줄된 알림 설정 실패:', error);
    }
  };

  const testPostTravelNotification = async () => {
    try {
      await schedulePostTravelRecommendation();
      console.log('여행 완료 후 알림 스케줄링 완료 (48시간 후)');
    } catch (error) {
      console.error('여행 완료 후 알림 스케줄링 실패:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>테스트 화면</Text>
      </View>

      <View style={styles.content}>
        {/* ★★★ 알림 테스트 섹션 추가 ★★★ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 알림 테스트</Text>
          
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
      </View>

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
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    fontWeight: '600',
  },
});
