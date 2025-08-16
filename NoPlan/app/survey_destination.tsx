// app/survey_destination.tsx
import * as Font from 'expo-font';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomTopBar from './(components)/CustomTopBar';
import { useTravelSurvey } from './(components)/TravelSurveyContext';

const DEST_OPTIONS = [
  { label: '식당', image: require('../assets/images/식당.jpg') },
  { label: '카페', image: require('../assets/images/카페.jpg') },
  { label: '숙소', image: require('../assets/images/숙소.jpg') },
  { label: '관광지', image: require('../assets/images/관광지.jpg') },
];


export default function SurveyDestination() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const { survey } = useTravelSurvey();
  const [loading, setLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

  // 🆕 화면이 포커스될 때마다 survey 상태 로깅
  useFocusEffect(
    useCallback(() => {
      // 🆕 수동 선택 화면이므로 자동 진행 없음
      setSelected(null);
    }, [])
  );

  // 🆕 다음 버튼 로직을 함수로 분리
  const handleNextButton = async (selectedIndex: number) => {
    setLoading(true);
    try {
      // 목적지별 API type 매핑
      const typeMap = ['restaurants', 'cafes', 'accommodations', 'attractions'];
      const type = typeMap[selectedIndex];
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
          다음은 <Text style={{ color: '#123A86' }}>어디로</Text> 가볼까요?
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
        <Text style={{ color: '#123A86', fontFamily: 'Pretendard-Medium', fontSize: 18 }}>{loading ? '위치 확인 중...' : '다음'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Medium',
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
    borderColor: '#123A86',
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
    fontFamily: 'Pretendard-Medium',
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
    borderColor: '#123A86',
  },
});
