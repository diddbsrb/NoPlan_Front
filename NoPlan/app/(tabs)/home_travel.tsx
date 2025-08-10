// app/(tabs)/home_travel.tsx

import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';
import { TravelSurveyData, useTravelSurvey } from '../(components)/TravelSurveyContext';
import {
  travelService,
  Trip,
  VisitedContent,
} from '../../service/travelService';
import { categoryMapping, VisitedContentWithCategory } from '../../utils/categoryMapping';

interface TripWithDate extends Trip {
  created_at: string;
}
interface VisitedContentWithDate extends VisitedContent {
  created_at: string;
}

interface TripItem {
  time: string;
  place: string;
}
interface TripSection {
  date: string;
  data: TripItem[];
}

type RecommendationType = 'restaurants' | 'cafes' | 'attractions' | 'accommodations';

interface RecommendationContext {
  currentTime: Date;
  lastVisitedType: string | null;
  recommendationType: RecommendationType;
  message: string;
  buttonText: string;
}

export default function HomeTravel() {
  const router = useRouter();
  const { survey, setSurvey } = useTravelSurvey();
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationContext, setRecommendationContext] = useState<RecommendationContext | null>(null);

  // sections 상태 변화를 문자열화해서 로그
  useEffect(() => {
    console.log('[HomeTravel] sections updated:', JSON.stringify(sections, null, 2));
  }, [sections]);

  // 추천 컨텍스트 생성 함수
  const getRecommendationContext = (visitedContents: VisitedContentWithCategory[]): RecommendationContext => {
    const now = new Date();
    const hour = now.getHours();
    
    // 저녁 시간대 (18:00 이후) → 숙소 추천
    if (hour >= 18) {
      return {
        currentTime: now,
        lastVisitedType: null,
        recommendationType: 'accommodations',
        message: '하루가 가고 있어요! 숙소는 정하셨나요?',
        buttonText: '숙소 추천받기'
      };
    }
    
    // 방문 이력이 없음 → 식당 추천
    if (!visitedContents.length) {
      return {
        currentTime: now,
        lastVisitedType: null,
        recommendationType: 'restaurants',
        message: '여행을 시작했어요! 우선 식사부터 하시는 건 어떨까요?',
        buttonText: '식당 추천받기'
      };
    }
    
    // 마지막 방문지의 카테고리 기반 추천
    const lastVisited = visitedContents[visitedContents.length - 1];
    const lastCategory = lastVisited.category || 'attractions'; // 기본값
    
    switch (lastCategory) {
      case 'restaurants':
        return {
          currentTime: now,
          lastVisitedType: 'restaurants',
          recommendationType: 'cafes',
          message: '식사를 마쳤어요! 시원한 커피 한 잔 어떠세요?',
          buttonText: '카페 추천받기'
        };
      case 'cafes':
        return {
          currentTime: now,
          lastVisitedType: 'cafes',
          recommendationType: 'attractions',
          message: '다음엔 관광지를 방문해보아요!',
          buttonText: '관광지 추천받기'
        };
      case 'attractions':
        return {
          currentTime: now,
          lastVisitedType: 'attractions',
          recommendationType: 'restaurants',
          message: '관광을 마쳤어요! 맛있는 식사 어떠세요?',
          buttonText: '식당 추천받기'
        };
      case 'accommodations':
        return {
          currentTime: now,
          lastVisitedType: 'accommodations',
          recommendationType: 'attractions',
          message: '숙소에 도착했어요! 주변 관광지도 둘러보세요!',
          buttonText: '관광지 추천받기'
        };
      default:
        return {
          currentTime: now,
          lastVisitedType: null,
          recommendationType: 'restaurants',
          message: '다음 행선지를 찾아보세요!',
          buttonText: '식당 추천받기'
        };
    }
  };

  // 자동 추천 처리 함수
  const handleAutoRecommendation = async (type: RecommendationType) => {
    try {
      // 현재 위치 가져오기
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한', '위치 권한이 필요합니다.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      
      // 이동수단에 따른 반경 설정
      const radiusMap: { [key: string]: number } = {
        '도보': 1000,
        '대중교통': 2000,
        '자가용': 3000,
      };
      const radius = radiusMap[survey.transportation || '대중교통'] || 500;
      
      // survey context 업데이트 (자동 추천 타입 포함)
      const newSurvey: TravelSurveyData = {
        ...survey,
        mapX: location.coords.longitude,
        mapY: location.coords.latitude,
        radius,
        adjectives: survey.adjectives || '',
        autoRecommendType: type, // 🆕 자동 추천 타입 저장
      };
      setSurvey(newSurvey);
      
      // 🆕 survey_destination.tsx로 이동하여 일관된 흐름 유지
      router.replace('/survey_destination');
    } catch (e) {
      console.error('자동 추천 처리 실패:', e);
      Alert.alert('오류', '위치 정보를 가져올 수 없습니다.');
    }
  };

  const fetchData = async () => {
    console.log('[HomeTravel] fetchData 시작');
    setLoading(true);
    setError(null);

    try {
      // 1) 트립 전체 조회
      const trips = (await travelService.getTripData()) as TripWithDate[];
      console.log('[HomeTravel] trips:', JSON.stringify(trips, null, 2));

      if (!trips.length) {
        console.warn('[HomeTravel] 트립이 없습니다');
        setError('최근 여정을 찾을 수 없습니다.');
        return;
      }

      // 2) 최신 트립 고르기
      const latest = trips
        .slice()
        .sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      console.log('[HomeTravel] latest trip:', JSON.stringify(latest, null, 2));

      // 3) 전체 방문지 조회 → 클라이언트 필터
      const allVisited = (await travelService.getVisitedContents()) as VisitedContentWithDate[];
      console.log('[HomeTravel] allVisited raw:', JSON.stringify(allVisited, null, 2));

      const visited = allVisited.filter((c) => c.trip === latest.id);
      console.log(
        `[HomeTravel] filtered visited (trip === ${latest.id}):`,
        JSON.stringify(visited, null, 2)
      );

      if (!visited.length) {
        console.warn('[HomeTravel] 해당 trip의 방문지가 없습니다');
      }

      // 4) 시간순 정렬
      visited.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      console.log('[HomeTravel] sorted visited:', JSON.stringify(visited, null, 2));

      // 🆕 카테고리 정보 추가
      const visitedWithCategories = await categoryMapping.getVisitedCategories(visited);
      console.log('[HomeTravel] visitedWithCategories:', JSON.stringify(visitedWithCategories, null, 2));

      // 🆕 추천 컨텍스트 생성
      const recommendationContext = getRecommendationContext(visitedWithCategories);
      setRecommendationContext(recommendationContext);
      console.log('[HomeTravel] recommendationContext:', JSON.stringify(recommendationContext, null, 2));

      // 5) SectionList용 포맷 변환
      const grouped: TripSection[] = [
        {
          date: `${latest.region} (${latest.created_at.split('T')[0]})`,
          data: visitedWithCategories.map((c) => ({
            time: c.created_at.split('T')[1].slice(0, 5),
            place: c.title,
          })),
        },
      ];
      console.log('[HomeTravel] grouped sections:', JSON.stringify(grouped, null, 2));

      setSections(grouped);
    } catch (e) {
      console.error('[HomeTravel] fetchData 에러:', e);
      setError('여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      console.log('[HomeTravel] fetchData 완료');
    }
  };

  // 화면 포커스될 때마다 호출
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <CustomTopBar />
      <View style={styles.content}>
        <Text style={styles.title}>사용자님!{"\n"}여행은 즐거우신가요?</Text>
        <Text style={styles.subtitle}>사용자님의 행복하고 감성적인 여행이에요.</Text>

        {loading && <Text style={styles.loading}>로딩 중...</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        {/* 🆕 추천 섹션 */}
        {recommendationContext && !loading && !error && (
          <View style={styles.recommendationSection}>
            <Text style={styles.recommendationMessage}>{recommendationContext.message}</Text>
            <TouchableOpacity
              style={styles.recommendationButton}
              onPress={() => handleAutoRecommendation(recommendationContext.recommendationType)}
            >
              <Text style={styles.recommendationButtonText}>{recommendationContext.buttonText}</Text>
            </TouchableOpacity>
          </View>
        )}

        <SectionList
          sections={sections}
          keyExtractor={(item, i) => item.place + i}
          renderSectionHeader={({ section: { date } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{date}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={styles.timelineRow}>
              <View style={styles.timelineCol}>
                <View style={styles.timelineCircle} />
                {index < section.data.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <View style={styles.timelineBox}>
                  <Text style={styles.timelinePlace}>{item.place}</Text>
                </View>
              </View>
            </View>
          )}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* 하단 바 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtnGray} onPress={() => setShowModal(true)}>
          <Text style={styles.bottomBtnTextGray}>여행 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtnBlue}
          onPress={() => router.replace('/survey_destination')}
        >
          <Text style={styles.bottomBtnTextBlue}>다음 행선지</Text>
        </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 12 },
  loading: { textAlign: 'center', margin: 16 },
  error: { color: 'red', textAlign: 'center', margin: 8 },
  list: { marginTop: 16 },

  sectionHeader: { marginTop: 18, marginBottom: 8, alignItems: 'flex-start' },
  sectionHeaderText: {
    backgroundColor: '#A3D8E3',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  timelineCol: { width: 24, alignItems: 'center' },
  timelineCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#A3D8E3', marginTop: 4, marginBottom: 2 },
  timelineLine: { width: 2, height: 36, backgroundColor: '#E0E0E0' },
  timelineContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  timelineTime: { fontSize: 13, color: '#3CB4C7', width: 64, marginRight: 6 },
  timelineBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  timelinePlace: { fontSize: 15, color: '#222' },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  bottomBtnGray: { backgroundColor: '#E0E0E0', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginRight: 8 },
  bottomBtnTextGray: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  bottomBtnBlue: { backgroundColor: '#A3D8E3', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginLeft: 8 },
  bottomBtnTextBlue: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', width: 280, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#666', marginBottom: 18, textAlign: 'center' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtnGray: { backgroundColor: '#E0E0E0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  modalBtnTextGray: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  modalBtnBlue: { backgroundColor: '#A3D8E3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginLeft: 8 },
  modalBtnTextBlue: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  // 🆕 추천 섹션 스타일
  recommendationSection: {
    backgroundColor: '#F2FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A3D8E3',
  },
  recommendationMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  recommendationButton: {
    backgroundColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  recommendationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
