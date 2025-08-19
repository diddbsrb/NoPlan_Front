// app/home.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { getLastScreen } from '../../utils/pushNotificationHelper';

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

const imageList = [
  require('../../assets/images/home/bg1.jpeg'),
  require('../../assets/images/home/bg2.jpeg'),
  require('../../assets/images/home/bg3.jpeg'),
  require('../../assets/images/home/bg4.jpeg'),
];

export default function HomeScreen() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const fadeAnim1 = useRef(new Animated.Value(1)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // 화면 크기 가져오기
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // 반응형 스타일 함수
  const getResponsiveStyles = () => {
    return StyleSheet.create({
      container: {
        flex: 1,
      },
      background: { 
        flex: 1, 
        width: '100%', 
        height: '100%',
        position: 'absolute',
      },
      overlayBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(147, 144, 144, 0.3)',
      },
      uiContainer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: Math.max(12, screenWidth * 0.03), // 화면 너비의 3% 또는 최소 12px
        paddingBottom: Math.max(20, screenHeight * 0.03), // 탭 바 제거로 인한 여백 조정
        zIndex: 2,
      },
      header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Math.max(12, screenHeight * 0.015), // 화면 높이의 1.5% 또는 최소 12px
        marginLeft: -Math.min(30, screenWidth * 0.08), // 화면 너비의 8% 또는 최대 30px
        marginRight: Math.max(5, screenWidth * 0.01), // 화면 너비의 1% 또는 최소 5px
      },
      logo: { 
        width: Math.min(100, screenWidth * 0.25), // 화면 너비의 25% 또는 최대 100px
        height: Math.min(30, screenHeight * 0.04) // 화면 높이의 4% 또는 최대 30px
      },
      center: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: screenHeight * 0.55, // 화면 높이의 55%
      },
      title: {
        fontSize: Math.max(18, Math.min(24, screenWidth * 0.05)), // 화면 너비의 5% 또는 18-24px 범위
        fontFamily: 'Pretendard-Medium',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      },
      button: {
        backgroundColor: 'rgba(255,255,255,0.65)',
        paddingVertical: Math.max(16, screenHeight * 0.02), // 화면 높이의 2% 또는 최소 16px
        paddingHorizontal: Math.max(32, screenWidth * 0.1), // 화면 너비의 10% 또는 최소 32px
        borderRadius: Math.max(8, screenWidth * 0.02), // 화면 너비의 2% 또는 최소 8px
        marginBottom: Math.max(2, screenHeight * 0.002), // 화면 높이의 0.2% 또는 최소 2px
        alignItems: 'center',
        alignSelf: 'center',
        minWidth: Math.min(350, screenWidth * 0.8), // 화면 너비의 80% 또는 최대 350px
      },
      buttonText: { 
        color: '#000', 
        fontFamily: 'Pretendard-Medium', 
        fontSize: Math.max(14, Math.min(18, screenWidth * 0.04)), // 화면 너비의 4% 또는 14-18px 범위
        textAlign: 'center', // 텍스트 중앙 정렬
        includeFontPadding: false, // 안드로이드에서 폰트 패딩 제거
      },
    });
  };

  // 여행 상태 확인 함수
  const checkTravelStatus = async (): Promise<boolean> => {
    try {
      const isTraveling = await SecureStore.getItemAsync('isTraveling');
      return isTraveling === 'true';
    } catch (error) {
      console.error('여행 상태 확인 실패:', error);
      return false;
    }
  };

  // 시작하기 버튼 핸들러
  const handleStartButton = async () => {
    try {
      const isTraveling = await checkTravelStatus();
      if (isTraveling) {
        // 여행 중이면 마지막으로 머무른 페이지로 이동
        const lastScreen = await getLastScreen();
        if (lastScreen) {
          // 타입 안전성을 위해 as any 사용
          router.push(lastScreen.screen as any);
        } else {
          // 마지막 화면 정보가 없으면 여행 홈 화면으로
          router.push('/home_travel');
        }
      } else {
        // 여행 중이 아니면 여행 설문 화면으로 (새 여행 시작)
        router.push('/survey_travel');
      }
    } catch (error) {
      console.error('화면 이동 실패:', error);
      // 오류 시 기본적으로 여행 설문 화면으로
      router.push('/survey_travel');
    }
  };

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAnimating.current) return; // 애니메이션 중이면 스킵
      
      isAnimating.current = true;
      // 다음 이미지 인덱스 계산
      const nextIndex = (currentImageIndex + 1) % imageList.length;
      setNextImageIndex(nextIndex);

      // 크로스페이드 애니메이션
      Animated.parallel([
        Animated.timing(fadeAnim1, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 애니메이션 완료 후 인덱스 업데이트 (깜빡임 방지)
        setCurrentImageIndex(nextIndex);
        // 애니메이션 값 리셋을 다음 프레임으로 지연
        requestAnimationFrame(() => {
          fadeAnim1.setValue(1);
          fadeAnim2.setValue(0);
          isAnimating.current = false;
        });
      });
    }, 6000); // 6초마다 전환

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  // 반응형 스타일 가져오기
  const styles = getResponsiveStyles();

  return (
    <View style={styles.container}>
      {/* 첫 번째 배경 이미지 */}
      <AnimatedImageBackground
        source={imageList[currentImageIndex]}
        style={[styles.background, { opacity: fadeAnim1 }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </AnimatedImageBackground>

      {/* 두 번째 배경 이미지 (크로스페이드용) */}
      <AnimatedImageBackground
        source={imageList[nextImageIndex]}
        style={[styles.background, styles.overlayBackground, { opacity: fadeAnim2 }]}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </AnimatedImageBackground>

      {/* UI 요소들 (고정 위치) */}
      <SafeAreaView style={styles.uiContainer}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/noplan_logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity onPress={() => router.push('/mypage')}>
            <Ionicons name="person" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Text style={styles.title}>최고의 여행을{'\n'}지금 시작하세요!</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleStartButton}
        >
          <Text style={styles.buttonText} numberOfLines={1} ellipsizeMode="tail">지금 시작하기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
