// app/(tabs)/app_guide.tsx
import * as Font from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';



export default function AppGuide() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
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
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/images/guide/case1.png')} 
                style={styles.icon} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>
              AI가 실시간으로{'\n'}최적의 여행지를 추천해줘요
            </Text>
            <Text style={styles.desc}>
              지금 당신에게 딱 맞는{'\n'}맛집, 카페, 명소를 찾아보세요
            </Text>
          </>
        );
      case 2:
        return (
          <>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/images/guide/case2.png')} 
                style={styles.icon} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>
              원하는 분위기만 알려주세요.{'\n'}AI가 완벽한 장소를 찾아드릴게요
            </Text>
            <Text style={styles.desc}>
              조용한 감성 카페, 활기찬 로컬 맛집 등{'\n'}원하는 무드를 선택하세요
            </Text>
          </>
        );
      case 3:
        return (
          <>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/images/guide/case3.png')} 
                style={styles.icon} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>
              내 위치 기반으로{'\n'}여행지를 추천해줘요
            </Text>
            <Text style={styles.desc}>
              현재 위치 주변의 숨은 명소와 인기 {'\n'}장소를 바로 알려드릴게요. {'\n'}사용자 정보는 안전하게 보호됩니다
            </Text>
          </>
        );
      case 4:
        return (
          <>
            <View style={styles.iconContainer}>
              <Image 
                source={require('../../assets/images/guide/case4.png')} 
                style={styles.icon} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>
              여행 후 AI가 작성해주는{'\n'}특별한 여행 요약을 만나보세요
            </Text>
            <Text style={styles.desc}>
              AI가 나만의 여행을{'\n'}자동으로 기록해줍니다
            </Text>
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
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomTopBar onBack={() => {
        if (from === 'home_travel') {
          router.push('/(tabs)/home_travel');
        } else {
          router.back();
        }
      }} />
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
    marginTop: 0,
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
    marginTop: 50,
    marginBottom: 40,

  },
  icon: {
    width: 200,
    height: 200,
  },
});
