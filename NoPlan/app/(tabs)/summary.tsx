// app/(tabs)/summary.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
// ★★★ 여행 완료 후 알림 스케줄링을 위한 import 추가 ★★★
import { schedulePostTravelRecommendation } from '../../utils/pushNotificationHelper';

export default function SummaryScreen() {
  const router = useRouter();
  const { tripId, summary, region } = useLocalSearchParams<{
    tripId: string;
    summary: string;
    region: string;
  }>();
  const { setIsTraveling } = useTravelSurvey();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
        'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 🆕 홈으로 돌아가기 버튼 클릭 시 여행 상태 변경
  const handleGoHome = async () => {
    try {
      console.log('[summary.tsx] 홈으로 돌아가기 시작');
      
      // ★★★ 여행 완료 후 이틀 뒤 추천 알림 스케줄링 ★★★
      await schedulePostTravelRecommendation();
      console.log('[summary.tsx] 여행 완료 후 추천 알림 스케줄링 완료');
      
      // 여행 상태를 false로 변경
      await setIsTraveling(false);
      console.log('[summary.tsx] 여행 상태를 false로 변경 완료');
      
      // 홈으로 이동
      router.replace('/home');
    } catch (error) {
      console.error('[summary.tsx] 여행 상태 변경 실패:', error);
      // 실패 시에도 홈으로 이동
      router.replace('/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="checkmark-circle" size={24} color="#659ECF" />
          <Text style={styles.headerTitle}>여행 완료!</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.regionSection}>
            <Text style={styles.regionLabel}>여행 지역</Text>
            <Text style={styles.regionText}>{region}</Text>
          </View>

          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>여행 요약</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        </View>

        <View style={styles.messageSection}>
          <Text style={styles.messageTitle}>소중한 추억이 되었길 바라요!</Text>
          <Text style={styles.messageText}>
            NO PLAN과 함께한 여행이{'\n'}
            특별한 기억으로 남았기를 바랍니다.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleGoHome}
        >
          <Text style={styles.homeButtonText}>홈으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 23,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  summaryCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  regionSection: {
    marginBottom: 20,
  },
  regionLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
    fontFamily: 'Pretendard-Medium',
  },
  regionText: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    color: '#659ECF',
  },
  summarySection: {
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
    fontFamily: 'Pretendard-Medium',
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'justify',
  },
  messageSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  messageTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSection: {
    padding: 24,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  homeButton: {
    backgroundColor: '#659ECF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
});
