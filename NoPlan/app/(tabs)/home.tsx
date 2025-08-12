// app/home.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as Font from 'expo-font';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

const imageList = [
  require('../../assets/images/home/bg1.jpeg'),
  require('../../assets/images/home/bg2.jpeg'),
  require('../../assets/images/home/bg3.jpeg'),
  require('../../assets/images/home/bg4.jpeg'),
  require('../../assets/images/home/bg5.jpeg'),
];

export default function HomeScreen() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState(1);
  const fadeAnim1 = useRef(new Animated.Value(1)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

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
          onPress={() => router.push('/survey_travel')}
        >
          <Text style={styles.buttonText}>지금 시작하기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 12,
    paddingBottom: 40,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: -30,
  },
  logo: { width: 100, height: 30 },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 450,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Pretendard-Light',
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    paddingVertical: 18,
    paddingHorizontal: 140,
    borderRadius: 10,
    marginBottom: 2,
    alignItems: 'center',
    alignSelf: 'center',
  },
      buttonText: { color: '#000', fontFamily: 'Pretendard-Medium', fontSize: 14 },
});
