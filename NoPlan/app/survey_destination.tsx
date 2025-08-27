// app/survey_destination.tsx
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomTopBar from './(components)/CustomTopBar';
// *** [수정] ImageAssets import 추가 ***
import { ImageAssets } from '../assets/images/ImageAssets';

// *** [수정] ImageAssets를 사용하도록 배열 변경 ***
const DEST_OPTIONS = [
  { label: '식당', image: ImageAssets.dest_restaurant },
  { label: '카페', image: ImageAssets.dest_cafe },
  { label: '숙소', image: ImageAssets.dest_accommodation },
  { label: '관광지', image: ImageAssets.dest_attractions },
];

export default function SurveyDestination() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
      });
    }
    loadFonts();
  }, []);

  const handleNextButton = async (selectedIndex: number) => {
    setLoading(true);
    try {
      const typeMap = ['restaurants', 'cafes', 'accommodations', 'attractions'];
      const type = typeMap[selectedIndex];
      console.log('[survey_destination] list로 이동:', type);
      router.replace({ pathname: '/list', params: { type } });
    } catch (e) {
      console.error('[survey_destination] Error:', e);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar onBack={() => router.back()} />
             <View style={{ flex: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 24, paddingTop: 20 }}>
        <Text style={styles.title}>
          다음은 <Text style={{ color: '#659ECF' }}>어디로</Text> 가볼까요?
        </Text>
        <Text style={styles.desc}>다음 행선지를 선택해주세요.</Text>
        <View style={[styles.grid, { width: '100%' }]}>
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
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: selected !== null ? '#659ECF' : '#E0E0E0' },
        ]}
        disabled={selected === null || loading}
        onPress={() => {
          if (selected !== null) {
            handleNextButton(selected);
          }
        }}
      >
        <Text style={{ color: '#FFFFFF', fontFamily: 'Pretendard-Medium', fontSize: 18 }}>{loading ? '위치 확인 중...' : '다음'}</Text>
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
    borderColor: '#659ECF',
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
    marginBottom: 50,
    paddingVertical: 13,
    alignItems: 'center',
  },
});