// app/survey_travel.tsx
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import * as Font from 'expo-font';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  
} from 'react-native';
import { travelService } from '../service/travelService';
import CustomTopBar from './(components)/CustomTopBar';
import { useTravelSurvey } from './(components)/TravelSurveyContext';

// 기존 headerShown 옵션은 레이아웃에서 관리하므로 제거/주석 처리
// export const options = {
//   headerShown: false,
// };

const KEYWORD_OPTIONS = [
  '고즈넉한', '낭만적인', '모던한', '힙한', '고급스러운',
  '전통적인', '활동적인', '산뜻한', '정겨운',
];

const TRAVEL_TYPE_OPTIONS = [
  { label: '대중교통', image: require('../assets/images/대중교통.jpg') },
  { label: '도보',     image: require('../assets/images/도보.jpg') },
  { label: '자가용',   image: require('../assets/images/자가용.jpg') },
];

const COMPANION_OPTIONS = [
  { label: '혼자', image: require('../assets/images/혼자.jpg') },
  { label: '연인', image: require('../assets/images/연인.jpg') },
  { label: '친구', image: require('../assets/images/친구.jpg') },
  { label: '가족', image: require('../assets/images/가족.jpg') },
];

const FEATURE_SLIDES = [
  {
    id: 1,
    title: '사용자님의 위치 수신',
    icon: '📍',
    description: '현재 위치를 기반으로 최적의 여행지를 찾아드립니다.'
  },
  {
    id: 2,
    title: '사용자님의 정보 수신',
    icon: '👤',
    description: '개인화된 여행 경험을 위한 정보를 안전하게 수집합니다.'
  },
  {
    id: 3,
    title: 'AI가 최적의 즉흥 여행지를 추천',
    icon: '🤖',
    description: '인공지능이 실시간으로 최적의 여행지를 추천해드립니다.'
  },
  {
    id: 4,
    title: 'AI가 만들어주는 사용자님만의 여행 요약',
    icon: '📝',
    description: '여행 후 AI가 개인화된 여행 요약을 생성해드립니다.'
  }
];

export default function SurveyTravel() {
  const router = useRouter();
  const { setSurvey, setIsTraveling } = useTravelSurvey();
  const [step, setStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [selectedTravelType, setSelectedTravelType] = useState<number | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<number | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // 슬라이드 모달 관련 상태
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 슬라이드 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURE_SLIDES.length);
    }, 3000); // 3초마다 전환

    return () => clearInterval(interval);
  }, []);

  // 슬라이드 애니메이션
  useEffect(() => {
    Animated.timing(slideAnimation, {
      toValue: -(currentSlide * (Dimensions.get('window').width - 40)),
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentSlide, slideAnimation]);

  useFocusEffect(
    useCallback(() => {
      setStep(1);
      setSelectedKeywords([]);
      setSelectedTravelType(null);
      setSelectedCompanion(null);
      setRegion(null);
      setError(null);
      setLoading(true);
      (async () => {
        try {
          // 위치 권한 요청 및 위치 획득
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setError('위치 권한이 필요합니다.');
            setLoading(false);
            return;
          }
          let location = await Location.getCurrentPositionAsync({});
          setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
          // 지역명 조회
          const res = await travelService.getRegionArea(location.coords.latitude, location.coords.longitude);
          // 응답 구조 확인용 콘솔
          console.log('region api res:', res);
          // Axios 응답에서 실제 데이터는 res.data에 있음
          const regionName = (res as any)?.data?.region_1depth_name || '';
          if (!regionName) {
            setError('지역 정보를 찾을 수 없습니다.');
          } else {
            setRegion(regionName);
          }
        } catch (e) {
          setError('위치 또는 지역 정보 조회에 실패했습니다.');
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const handleKeywordPress = (idx: number) => {
    if (selectedKeywords.includes(idx)) {
      setSelectedKeywords(ks => ks.filter(i => i !== idx));
    } else if (selectedKeywords.length < 3) {
      setSelectedKeywords(ks => [...ks, idx]);
    }
  };

  const isNextEnabled = () => {
    if (step === 2) return selectedKeywords.length > 0;
    if (step === 3) return selectedTravelType !== null;
    if (step === 4) return selectedCompanion !== null;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>
              사용자님에게 최적화된{'\n'}여행을 지금 시작합니다!
            </Text>
            <Text style={styles.desc}>
              개인화된 목적지 추천을 위해서{'\n'}간단한 설문을 진행합니다.
            </Text>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>
              이번 여행의 <Text style={{ color: '#123A86' }}>키워드</Text>를 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              원하는 여행 스타일 1~3개 선택 {'\n'}(최대 3개)
            </Text>
            <View style={styles.circleGrid}>
              {KEYWORD_OPTIONS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.circle,
                    selectedKeywords.includes(idx) && styles.circleSelected,
                  ]}
                  onPress={() => handleKeywordPress(idx)}
                  disabled={
                    selectedKeywords.length === 3 &&
                    !selectedKeywords.includes(idx)
                  }
                >
                  <Text
                    style={{
                      color: selectedKeywords.includes(idx) ? '#fff' : '#333',
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.title}>
              이번 여행의 <Text style={{ color: '#123A86' }}>방식</Text>을 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              NO PLAN이 거리를 고려해 최적의 여행지를 찾아드립니다.
            </Text>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.travelTypeGrid}
              showsVerticalScrollIndicator={false}
            >
              {TRAVEL_TYPE_OPTIONS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.travelTypeOption,
                    selectedTravelType === idx && styles.imageSelected,
                  ]}
                  onPress={() => setSelectedTravelType(idx)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={opt.image}
                    style={styles.optionImage}
                    resizeMode="cover"
                  />
                  <View style={styles.overlay} />
                  <Text style={styles.overlayLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.title}>
              이번 여행의 <Text style={{ color: '#123A86' }}>동반자</Text>를 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              NO PLAN이 여행 인원에 따른 최적의 여행지를 찾아드립니다.
            </Text>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.companionGrid}
              showsVerticalScrollIndicator={false}
            >
              {COMPANION_OPTIONS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.companionOption,
                    selectedCompanion === idx && styles.imageSelected,
                  ]}
                  onPress={() => setSelectedCompanion(idx)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={opt.image}
                    style={styles.optionImage}
                    resizeMode="cover"
                  />
                  <View style={styles.overlay} />
                  <Text style={styles.overlayLabel}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        );
      default:
        return null;
    }
  };

  const handleComplete = async () => {
    if (!region || selectedTravelType === null || selectedCompanion === null || !coords) {
      setError('모든 정보를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // adjectives: 선택된 키워드
      const adjectives = selectedKeywords.map(idx => KEYWORD_OPTIONS[idx]).join(',');
      
      await travelService.createTripWithAuth(
        region,
        TRAVEL_TYPE_OPTIONS[selectedTravelType].label,
        COMPANION_OPTIONS[selectedCompanion].label,
        adjectives
      );
      // radius 설정: 도보=1000, 대중교통=2000, 자가용=3000
      let radius = 2000;
      if (selectedTravelType === 1) radius = 1000;
      else if (selectedTravelType === 2) radius = 3000;
      setSurvey({
        mapX: coords.longitude,
        mapY: coords.latitude,
        radius,
        adjectives,
        region,
        transportation: TRAVEL_TYPE_OPTIONS[selectedTravelType].label,
        companion: COMPANION_OPTIONS[selectedCompanion].label,
      });
      
      // 여행 시작: 여행 상태를 true로 설정
      await setIsTraveling(true);
      
      // 🆕 여행 상태가 제대로 반영될 때까지 잠시 대기
      console.log('[survey_travel] 여행 상태를 true로 설정 완료, 잠시 대기...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[survey_travel] home_travel로 이동 시작');
      router.replace('/home_travel');
    } catch (e) {
      setError('여행 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomTopBar onBack={() => router.back()} />
      {error && <Text style={{color:'red',textAlign:'center',margin:8}}>{error}</Text>}
      <View style={styles.inner}>
        {renderStep()}
        
        {/* 슬라이드 모달 - 첫 번째 단계에서만 표시 */}
        {step === 1 && (
          <View style={styles.slideModalContainer}>
            <View style={{ overflow: 'hidden', width: Dimensions.get('window').width - 40 }}>
              <Animated.View 
                style={[
                  styles.slideContainer,
                  {
                    transform: [{ translateX: slideAnimation }],
                  },
                ]}
              >
                {FEATURE_SLIDES.map((slide, index) => (
                  <View key={slide.id} style={styles.slide}>
                    <Text style={styles.slideIcon}>{slide.icon}</Text>
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideDescription}>{slide.description}</Text>
                  </View>
                ))}
              </Animated.View>
            </View>
            
            {/* 슬라이드 인디케이터 */}
            <View style={styles.slideIndicators}>
              {FEATURE_SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.slideIndicator,
                    { backgroundColor: currentSlide === index ? '#123A86' : '#E0E0E0' },
                  ]}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.progressBarContainer}>
        {[1, 2, 3, 4].map(n => (
          <View
            key={n}
            style={[
              styles.progressBar,
              { backgroundColor: step === n ? '#123A86' : '#E0E0E0' },
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonRow}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={() => setStep(s => s - 1)}
          >
            <Text style={styles.backText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.navButton,
            isNextEnabled() ? styles.nextButton : styles.nextDisabled,
          ]}
          onPress={step < 4 ? () => setStep(s => s + 1) : handleComplete}
          disabled={!isNextEnabled() || loading}
        >
          <Text style={styles.nextText}>
            {loading ? '로딩 중...' : (step < 4 ? '다음' : '완료')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, padding: 24 },

  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 50,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },

  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  circleSelected: { backgroundColor: '#123A86' },

  scrollView: { width: '100%' },
  travelTypeGrid: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  travelTypeOption: {
    width: '90%',
    height: 90,
    borderRadius: 16,
    marginVertical: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  companionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  companionOption: {
    width: '47%',
    aspectRatio: 0.8,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  optionImage: { width: '100%', height: '100%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayLabel: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
  },
  imageSelected: { borderColor: '#123A86' },

  progressBarContainer: {
    flexDirection: 'row',
    marginHorizontal: 32,
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },

  buttonRow: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  backButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#123A86',
  },
  backText: {
    color: '#123A86',
    fontFamily: 'Pretendard-Medium',
  },
  nextButton: {
    backgroundColor: '#123A86',
  },
  nextDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
  },

  // 슬라이드 모달 스타일
  slideModalContainer: {
    height: 160,
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideContainer: {
    flexDirection: 'row',
    height: '100%',
    width: (Dimensions.get('window').width - 40) * FEATURE_SLIDES.length,
  },
  slide: {
    width: Dimensions.get('window').width - 40, // screenWidth - marginHorizontal
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  slideIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  slideTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  slideDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  slideIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
  },
  slideIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
