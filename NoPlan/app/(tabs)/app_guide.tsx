// app/(tabs)/app_guide.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Font from 'expo-font';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';




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
        'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 슬라이드 관련 useEffect 제거

  // 화면이 포커스될 때마다 step을 1로 초기화
  useFocusEffect(
    useCallback(() => {
      setStep(1);
    }, [])
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <View style={[styles.iconContainer, { marginTop: 50, marginBottom: 40 }]}>
              <Image 
                source={require('../../assets/images/guide/case1.png')} 
                style={[styles.icon, { width: 220, height: 220 }]} 
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
            <View style={[styles.iconContainer, { marginTop: 50, marginBottom: 60 }]}>
              <Image 
                source={require('../../assets/images/guide/case2.png')} 
                style={[styles.icon, { width: 200, height: 200 }]} 
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
            <View style={[styles.iconContainer, { marginTop: 20, marginBottom: 0 }]}>
              <Image 
                source={require('../../assets/images/guide/case3.png')} 
                style={[styles.icon, { width: 250, height: 280 }]} 
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
            <View style={[styles.iconContainer, { marginTop: 25, marginBottom: 0 }]}>
              <Image 
                source={require('../../assets/images/guide/case4.png')} 
                style={[styles.icon, { width: 300, height: 300 }]} 
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
    // from 파라미터에 따라 다른 동작 수행
    if (from === 'home_travel') {
      // home_travel에서 접근한 경우 다시 home_travel로 이동
      router.replace('/(tabs)/home_travel');
    } else {
      // user_info에서 접근한 경우 home으로 이동
      router.replace('/home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단바 - 뒤로가기 버튼 제외 */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft} />
        <View style={styles.topBarCenter}>
          <Image
            source={require('../../assets/images/noplan_logo_blue.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
          <Text style={styles.topBarTitle}>NO PLAN</Text>
        </View>
        <TouchableOpacity
          style={styles.topBarRight}
          onPress={() => router.push('/mypage')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="person" size={28} color="#659ECF" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inner}>
        {renderStep()}
        

      </View>

      <View style={styles.progressBarContainer}>
        {[1, 2, 3, 4].map(n => (
          <View
            key={n}
            style={[
              styles.progressBar,
              { backgroundColor: step === n ? '#659ECF' : '#E0E0E0' },
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
    backgroundColor: '#659ECF',
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
    backgroundColor: '#659ECF',
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
  
  // 상단바 스타일 - CustomTopBar와 동일
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingTop: 60,
    paddingBottom: 17,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  topBarLeft: {
    width: 40, // icon size + padding과 동일
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  topBarTitle: {
    fontSize: 22,
    color: '#659ECF',
    fontFamily: 'Pretendard-Medium',
    letterSpacing: 1,
    textShadowColor: '#B2D1D4',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  topBarRight: {
    width: 40, // icon size + padding과 동일
    alignItems: 'center',
    justifyContent: 'center',
  },
});
