import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import CustomTopBar from '../components/CustomTopBar';

// 2단계: 키워드 옵션 (최대 3개 선택)
const KEYWORD_OPTIONS = [
  '힐링', '자유로움', '감성적인', '활동적인', '자연', '도전', '체험', '휴식', '문화'
];

// 3단계: 여행 방식 옵션
const TRAVEL_TYPE_OPTIONS = [
  { label: '대중교통', image: require('../../assets/images/index_screen.png') },
  { label: '도보', image: require('../../assets/images/noplan_logo_white.png') },
  { label: '자가용', image: require('../../assets/images/splash-icon.png') },
];

// 4단계: 동반자 옵션
const COMPANION_OPTIONS = [
  { label: '혼자', image: require('../../assets/images/index_screen.png') },
  { label: '연인', image: require('../../assets/images/noplan_logo_white.png') },
  { label: '친구', image: require('../../assets/images/splash-icon.png') },
  { label: '가족', image: require('../../assets/images/icon.png') },
];

export default function SurveyTravel() {
  const [step, setStep] = useState(1);
  const [selectedKeywords, setSelectedKeywords] = useState<number[]>([]);
  const [selectedTravelType, setSelectedTravelType] = useState<number | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<number | null>(null);

  // 진행 바 색상 계산
  const getBarStyle = (barStep: number) => ({
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: step === barStep ? '#A3D8E3' : '#E0E0E0',
  });

  // 키워드 선택 핸들러 (최대 3개)
  const handleKeywordPress = (idx: number) => {
    if (selectedKeywords.includes(idx)) {
      setSelectedKeywords(selectedKeywords.filter(i => i !== idx));
    } else if (selectedKeywords.length < 3) {
      setSelectedKeywords([...selectedKeywords, idx]);
    }
  };

  // 버튼 활성화 조건
  const isNextEnabled = () => {
    if (step === 2) return selectedKeywords.length === 3;
    if (step === 3) return selectedTravelType !== null;
    if (step === 4) return selectedCompanion !== null;
    return true;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {step === 1 && (
          <>
            <Text style={styles.title}>사용자님에게 최적화된{"\n"}여행을 지금 시작합니다!</Text>
            <Text style={styles.desc}>개인화된 목적지 추천을 위해서{"\n"}간단한 설문을 진행합니다.</Text>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.title}>이번 여행의 <Text style={{ color: '#4AB7C8' }}>키워드</Text>를 선택해주세요.</Text>
            <Text style={styles.desc}>{`원하는 여행 스타일을 3개 선택\n(최대 3개)`}</Text>
            <View style={styles.circleGrid}>
              {KEYWORD_OPTIONS.map((option, idx) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.circle, selectedKeywords.includes(idx) && styles.circleSelected]}
                  onPress={() => handleKeywordPress(idx)}
                  disabled={selectedKeywords.length === 3 && !selectedKeywords.includes(idx)}
                >
                  <Text style={{ color: selectedKeywords.includes(idx) ? '#fff' : '#333' }}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.title}>이번 여행의 <Text style={{ color: '#4AB7C8' }}>방식</Text>을 선택해주세요.</Text>
            <View style={styles.imageGrid}>
              {TRAVEL_TYPE_OPTIONS.map((option, idx) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.imageOption, selectedTravelType === idx && styles.imageSelected]}
                  onPress={() => setSelectedTravelType(idx)}
                >
                  <Image source={option.image} style={styles.optionImage} resizeMode="cover" />
                  <Text style={styles.imageLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {step === 4 && (
          <>
            <Text style={styles.title}>이번 여행의 <Text style={{ color: '#4AB7C8' }}>동반자</Text>를 선택해주세요.</Text>
            <View style={styles.imageGrid}>
              {COMPANION_OPTIONS.map((option, idx) => (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.imageOption, selectedCompanion === idx && styles.imageSelected]}
                  onPress={() => setSelectedCompanion(idx)}
                >
                  <Image source={option.image} style={styles.optionImage} resizeMode="cover" />
                  <Text style={styles.imageLabel}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
      {/* 진행 바 */}
      <View style={styles.progressBarContainer}>
        <View style={getBarStyle(1)} />
        <View style={getBarStyle(2)} />
        <View style={getBarStyle(3)} />
        <View style={getBarStyle(4)} />
      </View>
      {/* 버튼 영역 */}
      <View style={styles.buttonRow}>
        {step > 1 && (
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: '#fff', borderColor: '#A3D8E3', borderWidth: 1 }]}
            onPress={() => setStep(step - 1)}
          >
            <Text style={{ color: '#A3D8E3', fontWeight: 'bold', fontSize: 18 }}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: isNextEnabled() ? '#F2FAFC' : '#E0E0E0', borderColor: '#A3D8E3', borderWidth: 1 }]}
          onPress={() => {
            if (step < 4) setStep(step + 1);
            // 마지막 단계에서 완료 처리 추가 가능
          }}
          disabled={!isNextEnabled()}
        >
          <Text style={{ color: '#A3D8E3', fontWeight: 'bold', fontSize: 18 }}>{step < 4 ? '다음' : '완료'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 16,
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
    gap: 12,
    rowGap: 12,
    marginTop: 8,
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
  circleSelected: {
    backgroundColor: '#A3D8E3',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    rowGap: 16,
  },
  imageOption: {
    width: 120,
    height: 140,
    margin: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  imageSelected: {
    borderColor: '#A3D8E3',
  },
  optionImage: {
    width: 120,
    height: 90,
    borderRadius: 12,
  },
  imageLabel: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginHorizontal: 32,
    marginBottom: 100,
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
}); 