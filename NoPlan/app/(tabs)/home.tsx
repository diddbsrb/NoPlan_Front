import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ImageBackground } from 'react-native'; // 기존처럼 import
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
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // 페이드아웃 후 이미지 변경 및 페이드인
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatedImageBackground
      source={imageList[currentImageIndex]}
      style={[styles.background, { opacity: fadeAnim }]}
      resizeMode="cover"
    >
      {/* 흐린 오버레이 추가 */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/noplan_logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity>
            <Ionicons name="person" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.center}>
          <Text style={styles.title}>최고의 여행을{'\n'}지금 시작하세요!</Text>
        </View>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>지금 시작하기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </AnimatedImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(147, 144, 144, 0.3)', // 원하는 투명도와 색상으로 조절
    zIndex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 40,
    zIndex: 2, // 오버레이 위에 내용이 보이도록
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: -30,
  },
  logo: {
    width: 100,
    height: 30,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 450,
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: 12,
    borderRadius: 28,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
});
