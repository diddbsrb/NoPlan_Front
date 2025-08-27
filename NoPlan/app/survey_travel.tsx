// app/survey_travel.tsx
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect } from '@react-navigation/native';
import * as Font from 'expo-font';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { travelService } from '../service/travelService';
import { requestUserPermission } from '../utils/pushNotificationHelper';
import CustomTopBar from './(components)/CustomTopBar';
import { useTravelSurvey } from './(components)/TravelSurveyContext';
import { ImageAssets } from '../assets/images/ImageAssets'; // [변경] ImageAssets import

// [변경] ImageAssets를 사용하도록 배열들 수정
const KEYWORD_OPTIONS = [
  { label: '고즈넉한', icon: ImageAssets.adjective_tranquil },
  { label: '낭만적인', icon: ImageAssets.adjective_romantic },
  { label: '모던한', icon: ImageAssets.adjective_modern },
  { label: '힙한', icon: ImageAssets.adjective_hip },
  { label: '고급스러운', icon: ImageAssets.adjective_luxurious },
  { label: '전통적인', icon: ImageAssets.adjective_traditional },
  { label: '활동적인', icon: ImageAssets.adjective_active },
  { label: '산뜻한', icon: ImageAssets.adjective_fresh },
  { label: '정겨운', icon: ImageAssets.adjective_friendly },
];

const TRAVEL_TYPE_OPTIONS = [
  { label: '대중교통', image: ImageAssets.travel_public },
  { label: '도보',     image: ImageAssets.travel_walking },
  { label: '자가용',   image: ImageAssets.travel_car },
];

const COMPANION_OPTIONS = [
  { label: '혼자', image: ImageAssets.companion_solo },
  { label: '연인', image: ImageAssets.companion_couple },
  { label: '친구', image: ImageAssets.companion_friends },
  { label: '가족', image: ImageAssets.companion_family },
];

export default function SurveyTravel() {
  const router = useRouter();
  const { setIsTraveling } = useTravelSurvey();
  
  const [step, setStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [selectedTravelType, setSelectedTravelType] = useState<number | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<number | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  const checkNotificationPermission = async () => {
    try {
      const authStatus = await messaging().hasPermission();
      const isNotificationEnabled = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      console.log('🔔 현재 알림 권한 상태:', authStatus);
      
      if (!isNotificationEnabled) {
        Alert.alert(
          "알림 권한 설정",
          "더 나은 서비스 이용을 위해 알림 권한을 허용해주세요. 설정 화면으로 이동하시겠습니까?",
          [
            {
              text: "나중에",
              style: "cancel"
            },
            { 
              text: "설정으로 이동",
              onPress: () => Linking.openSettings(),
              style: 'default'
            }
          ]
        );
      }
    } catch (error) {
      console.log('알림 권한 확인 실패:', error);
    }
  };

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

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
          await requestUserPermission();
          setTimeout(() => {
            checkNotificationPermission();
          }, 1000);
        } catch (e) {
          console.log('알림 권한 요청 실패:', e);
        }
        
        try {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setError('위치 권한이 필요합니다.');
            setLoading(false);
            return;
          }
          
          try {
            await requestUserPermission();
            console.log('[survey_travel] 알림 권한 요청 완료');
          } catch (error) {
            console.log('[survey_travel] 알림 권한 요청 실패:', error);
          }
          
          let location = await Location.getCurrentPositionAsync({});
          setCoords({ latitude: location.coords.latitude, longitude: location.coords.longitude });
          const res = await travelService.getRegionArea(location.coords.latitude, location.coords.longitude);
          console.log('region api res:', res);
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
    if (step === 1) return selectedKeywords.length > 0;
    if (step === 2) return selectedTravelType !== null;
    if (step === 3) return selectedCompanion !== null;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>
              이번 여행의 <Text style={{ color: '#659ECF' }}>키워드</Text>를 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              원하는 여행 스타일 1~3개 선택 {'\n'}(최대 3개)
            </Text>
            <View style={styles.circleGrid}>
              {KEYWORD_OPTIONS.map((opt, idx) => (
                <TouchableOpacity
                  key={opt.label}
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
                  <Image 
                    source={opt.icon} 
                    style={styles.keywordIcon} 
                    resizeMode="contain"
                  />
                                     <Text
                     style={[
                       styles.keywordLabel,
                       {
                         color: selectedKeywords.includes(idx) ? '#659ECF' : '#333',
                       }
                     ]}
                   >
                     {opt.label}
                   </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>
              이번 여행의 <Text style={{ color: '#659ECF' }}>방식</Text>을 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              거리를 고려해 최적의 여행지를 찾아드립니다.
            </Text>
            <View style={[styles.travelTypeGrid, { width: '100%' }]}>
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
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.title}>
              이번 여행의 <Text style={{ color: '#659ECF' }}>동반자</Text>를 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              여행 인원에 따른 최적의 여행지를 찾아드립니다.
            </Text>
            <View style={[styles.companionGrid, { width: '100%' }]}>
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
            </View>
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
      const adjectives = selectedKeywords.map(idx => KEYWORD_OPTIONS[idx].label).join(',');
      
      await travelService.createTripWithAuth(
        region,
        TRAVEL_TYPE_OPTIONS[selectedTravelType].label,
        COMPANION_OPTIONS[selectedCompanion].label,
        adjectives
      );
      
      await setIsTraveling(true);
      
      console.log('[survey_travel] 여행 상태를 true로 설정 완료, home_travel로 이동');
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
      </View>

      <View style={styles.progressBarContainer}>
        {[1, 2, 3].map(n => (
          <View
            key={n}
            style={[
              styles.progressBar,
              { backgroundColor: step === n ? '#659ECF' : '#E0E0E0' },
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
          onPress={step < 3 ? () => setStep(s => s + 1) : handleComplete}
          disabled={!isNextEnabled() || loading}
        >
          <Text style={styles.nextText}>
            {loading ? '로딩 중...' : (step < 3 ? '다음' : '완료')}
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
    marginBottom: 10,
    marginTop: 30,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },

  circleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 30
  },
  circle: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingVertical: 8,
  },
  circleSelected: { 
    backgroundColor: '#F8F9FA',
    borderColor: '#659ECF',
    borderWidth: 3,
  },
  keywordIcon: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  keywordLabel: {
    fontSize: 11,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    lineHeight: 14,
  },

  travelTypeGrid: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingTop: 20
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
    paddingVertical: 5,
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
  imageSelected: { borderColor: '#659ECF' },

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
    borderColor: '#659ECF',
  },
  backText: {
    color: '#659ECF',
    fontFamily: 'Pretendard-Medium',
  },
  nextButton: {
    backgroundColor: '#659ECF',
  },
  nextDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
  },
});