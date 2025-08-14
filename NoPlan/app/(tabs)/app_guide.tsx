// app/(tabs)/app_guide.tsx
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';



export default function AppGuide() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // 슬라이드 모달 관련 상태 제거

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 슬라이드 관련 useEffect 제거

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.title}>
              사용자님의 위치 수신
            </Text>
            <Text style={styles.desc}>
              현재 위치를 기반으로 최적의 여행지를 찾아드립니다.
            </Text>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📍</Text>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>
              사용자님의 정보 수신
            </Text>
            <Text style={styles.desc}>
              개인화된 여행 경험을 위한 정보를 안전하게 수집합니다.
            </Text>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>👤</Text>
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.title}>
              AI가 최적의 즉흥 여행지를 추천
            </Text>
            <Text style={styles.desc}>
              인공지능이 실시간으로 최적의 여행지를 추천해드립니다.
            </Text>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🤖</Text>
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.title}>
              AI가 만들어주는 사용자님만의 여행 요약
            </Text>
            <Text style={styles.desc}>
              여행 후 AI가 개인화된 여행 요약을 생성해드립니다.
            </Text>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📝</Text>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStartTravel = () => {
    router.replace('/survey_travel');
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomTopBar onBack={() => router.back()} />
      <View style={styles.inner}>
        {renderStep()}
        

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

      <View style={styles.buttonContainer}>
        {step < 4 ? (
          <View style={styles.buttonRow}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.previousButton}
                onPress={handlePrevious}
              >
                <Text style={styles.previousText}>이전</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                step === 1 && styles.nextButtonFull
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>다음</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.previousButton}
              onPress={handlePrevious}
            >
              <Text style={styles.previousText}>이전</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartTravel}
            >
              <Text style={styles.startText}>여행 시작하기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  inner: { 
    flex: 1, 
    padding: 24 
  },
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
  buttonContainer: {
    paddingHorizontal: 32,
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  previousButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previousText: {
    color: '#666',
    fontFamily: 'Pretendard-Medium',
  },
  nextButton: {
    backgroundColor: '#123A86',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
  },
  startButton: {
    backgroundColor: '#123A86',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  startText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  icon: {
    fontSize: 60,
    textAlign: 'center',
  },
});
