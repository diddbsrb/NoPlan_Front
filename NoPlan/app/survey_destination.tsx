// app/survey_destination.tsx
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomTopBar from './(components)/CustomTopBar';
import { TravelSurveyData, useTravelSurvey } from './(components)/TravelSurveyContext';

const DEST_OPTIONS = [
  { label: '식당', image: require('../assets/images/식당.jpg') },
  { label: '카페', image: require('../assets/images/카페.jpg') },
  { label: '숙소', image: require('../assets/images/숙소.jpg') },
  { label: '관광지', image: require('../assets/images/관광지.jpg') },
];


export default function SurveyDestination() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const { survey, setSurvey } = useTravelSurvey();
  const [loading, setLoading] = useState(false);

  // 🆕 자동 추천 타입이 있으면 자동 선택 및 자동 진행
  useFocusEffect(
    useCallback(() => {
      // 🆕 현재 survey 상태 로깅 (adjectives 포함)
      console.log('[survey_destination] 현재 survey 상태:', {
        adjectives: survey.adjectives,
        transportation: survey.transportation,
        companion: survey.companion,
        region: survey.region,
        autoRecommendType: survey.autoRecommendType
      });
      
      if (survey.autoRecommendType) {
        // 자동 추천 타입에 따른 인덱스 매핑
        const typeMap = ['restaurants', 'cafes', 'accommodations', 'attractions'];
        const autoIndex = typeMap.indexOf(survey.autoRecommendType);
        if (autoIndex !== -1) {
          setSelected(autoIndex);
          console.log(`[survey_destination] 자동 선택: ${survey.autoRecommendType} -> 인덱스 ${autoIndex}`);
          
          // 🆕 자동으로 다음 버튼 클릭 효과
          setTimeout(() => {
            handleNextButton(autoIndex);
          }, 500); // 0.5초 후 자동 진행
        }
      } else {
        setSelected(null);
      }
    }, [survey.autoRecommendType, survey.adjectives, survey.transportation, survey.companion, survey.region])
  );

  // 🆕 다음 버튼 로직을 함수로 분리
  const handleNextButton = async (selectedIndex: number) => {
    setLoading(true);
    try {
      // 현재 위치 받아서 글로벌 상태에 업데이트
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('위치 권한이 필요합니다.');
      let location = await Location.getCurrentPositionAsync({});

      // 이동수단에 따른 반경 설정
      const radiusMap: { [key: string]: number } = {
        '도보': 1000,
        '대중교통': 2000,
        '자가용': 3000,
      };
      const radius = radiusMap[survey.transportation || '대중교통'] || 500;

      // 키워드 설정
      const adjectives = survey.adjectives || '';

      // autoRecommendType을 제외한 새로운 survey 객체 생성
      const { autoRecommendType, ...surveyWithoutAuto } = survey;
      const newSurvey: TravelSurveyData = {
        ...surveyWithoutAuto,
        mapX: location.coords.longitude,
        mapY: location.coords.latitude,
        radius,
        adjectives,
      };
      console.log('[survey_destination] setSurvey request body:', newSurvey);
      console.log('[survey_destination] Location data:', {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        radius,
        transportation: survey.transportation
      });
      console.log('[survey_destination] Adjectives being set:', adjectives);
      setSurvey(newSurvey);

      // 목적지별 API type 매핑
      const typeMap = ['restaurants', 'cafes', 'accommodations', 'attractions'];
      const type = typeMap[selectedIndex];
      console.log('[survey_destination] Navigating to list with type:', type);
      router.replace({ pathname: '/list', params: { type } });
    } catch (e) {
      console.error('[survey_destination] Error:', e);
      alert('위치 정보를 가져올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar onBack={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={styles.title}>
          다음은 <Text style={{ color: '#4AB7C8' }}>어디로</Text> 가볼까요?
        </Text>
        <Text style={styles.desc}>다음 행선지를 선택해주세요.</Text>
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {DEST_OPTIONS.map((option, idx) => (
            <TouchableOpacity
              key={option.label}
              style={[styles.option, selected === idx && styles.selectedOption]}
              onPress={() => setSelected(idx)}
              activeOpacity={0.8}
            >
              <Image source={option.image} style={styles.optionImage} resizeMode="cover" />
              <View style={styles.overlay} />
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: selected !== null ? '#F2FAFC' : '#E0E0E0' },
        ]}
        disabled={selected === null || loading}
        onPress={() => {
          if (selected !== null) {
            handleNextButton(selected);
          }
        }}
      >
        <Text style={{ color: '#A3D8E3', fontWeight: 'bold', fontSize: 18 }}>{loading ? '위치 확인 중...' : '다음'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  option: {
    width: '47%',
    aspectRatio: 0.45,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#A3D8E3',
  },
  optionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
  },
  optionLabel: {
    position: 'absolute',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    alignSelf: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    top: '40%',
  },
  nextButton: {
    borderRadius: 8,
    marginHorizontal: 32,
    marginBottom: 100,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A3D8E3',
  },
});
