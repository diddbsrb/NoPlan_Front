// app/survey_travel.tsx
import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CustomTopBar from './(components)/CustomTopBar';

// 기존 headerShown 옵션은 레이아웃에서 관리하므로 제거/주석 처리
// export const options = {
//   headerShown: false,
// };

const KEYWORD_OPTIONS = [
  '힐링', '자유로움', '감성적인', '활동적인',
  '자연', '도전', '체험', '휴식', '문화',
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

export default function SurveyTravel() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [selectedTravelType, setSelectedTravelType] = useState<number | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<number | null>(null);

  // 포커스될 때마다 상태 초기화
  useFocusEffect(
    useCallback(() => {
      setStep(1);
      setSelectedKeywords([]);
      setSelectedTravelType(null);
      setSelectedCompanion(null);
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
    if (step === 2) return selectedKeywords.length === 3;
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
              이번 여행의 <Text style={{ color: '#4AB7C8' }}>키워드</Text>를 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              원하는 여행 스타일을 3개 선택 {'\n'}(최대 3개)
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
              이번 여행의 <Text style={{ color: '#4AB7C8' }}>방식</Text>을 선택해주세요.
            </Text>
            <Text style={styles.desc}>
              NO PLAN이 방식에 맞는 최적의 여행지를 찾아드립니다.
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
              이번 여행의 <Text style={{ color: '#4AB7C8' }}>동반자</Text>를 선택해주세요.
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

  return (
    <SafeAreaView style={styles.container}>
      <CustomTopBar onBack={() => router.back()} />

      <View style={styles.inner}>{renderStep()}</View>

      <View style={styles.progressBarContainer}>
        {[1, 2, 3, 4].map(n => (
          <View
            key={n}
            style={[
              styles.progressBar,
              { backgroundColor: step === n ? '#A3D8E3' : '#E0E0E0' },
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
          onPress={() => {
            if (step < 4) {
              setStep(s => s + 1);
            } else {
              // 완료 시 survey_travel을 대체하고 home_travel으로 이동
              router.replace('/home_travel');
            }
          }}
          disabled={!isNextEnabled()}
        >
          <Text style={styles.nextText}>{step < 4 ? '다음' : '완료'}</Text>
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
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
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
  circleSelected: { backgroundColor: '#A3D8E3' },

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
    fontWeight: 'bold',
  },
  imageSelected: { borderColor: '#A3D8E3' },

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
    borderColor: '#A3D8E3',
  },
  backText: {
    color: '#A3D8E3',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#A3D8E3',
  },
  nextDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
