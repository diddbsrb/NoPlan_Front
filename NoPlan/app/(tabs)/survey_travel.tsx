import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import CustomTopBar from '../components/CustomTopBar';

const CIRCLE_OPTIONS = [
  '자연', '도시', '역사', '음식', '휴식', '모험', '문화', '쇼핑', '예술'
];

const IMAGE_OPTIONS = [
  require('../../assets/images/index_screen.png'),
  require('../../assets/images/noplan_logo_white.png'),
  require('../../assets/images/splash-icon.png'),
];

export default function SurveyTravel() {
  const [step, setStep] = useState(1);
  const [selectedCircle, setSelectedCircle] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  // 진행 바 색상 계산
  const getBarStyle = (barStep: number) => ({
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
    backgroundColor: step === barStep ? '#A3D8E3' : '#E0E0E0',
    // 현재 단계까지 색을 채우고 싶으면: step >= barStep ? '#A3D8E3' : '#E0E0E0'
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        {step === 1 && (
          <>
            <Text style={styles.title}>설문지에서 프로필을{"\n"}아래와 같이 시작합니다.</Text>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.title}>어떤 여행을{"\n"}가장 선호하시나요?</Text>
            <View style={styles.circleGrid}>
              {CIRCLE_OPTIONS.map((option, idx) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.circle, selectedCircle === idx && styles.circleSelected]}
                  onPress={() => setSelectedCircle(idx)}
                >
                  <Text style={{ color: selectedCircle === idx ? '#fff' : '#333' }}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {step === 3 && (
          <>
            <Text style={styles.title}>이런 여행지는{"\n"}어떠신가요?</Text>
            <FlatList
              data={IMAGE_OPTIONS}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.imageOption, selectedImage === index && styles.imageSelected]}
                  onPress={() => setSelectedImage(index)}
                >
                  <Image source={item} style={{ width: '100%', height: 80, borderRadius: 8 }} resizeMode="cover" />
                </TouchableOpacity>
              )}
              style={{ width: '100%' }}
            />
          </>
        )}
      </View>
      {/* 진행 바 */}
      <View style={styles.progressBarContainer}>
        <View style={getBarStyle(1)} />
        <View style={getBarStyle(2)} />
        <View style={getBarStyle(3)} />
      </View>
      {/* 다음 버튼 */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={() => {
          if (step < 3) setStep(step + 1);
          // 마지막 단계에서 완료 처리 추가 가능
        }}
        disabled={
          (step === 2 && selectedCircle === null) ||
          (step === 3 && selectedImage === null)
        }
      >
        <Text style={{ color: '#A3D8E3', fontWeight: 'bold', fontSize: 18 }}>
          {step < 3 ? '다음' : '완료'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 16,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  circleSelected: {
    backgroundColor: '#A3D8E3',
  },
  imageOption: {
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageSelected: {
    borderColor: '#A3D8E3',
  },
  progressBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 32,
  },
  nextButton: {
    backgroundColor: '#F2FAFC',
    borderRadius: 8,
    marginHorizontal: 32,
    marginBottom: 100,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A3D8E3',
  },
}); 