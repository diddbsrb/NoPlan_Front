import * as Font from 'expo-font';
import { useRouter } from 'expo-router'; // ✅ 추가
import { useEffect, useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter(); // ✅ 라우터 객체 생성
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // 폰트가 로드될 때까지 빈 화면 표시
  }

  return (
    <ImageBackground
      source={require('../../assets/images/index_screen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={require('../../assets/images/noplan_logo_white.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>NO PLAN</Text>
        <Text style={styles.subtitle}>실시간 위치와 취향을 분석하는{"\n"}나만의 AI 여행도우미</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(tabs)/signin')} // ✅ 버튼 눌렀을 때 이동
        >
          <Text style={styles.buttonText} numberOfLines={1} ellipsizeMode="tail">지금 시작하기</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // 변경: 위쪽 정렬
    paddingVertical: 10,
    paddingTop: 100, // 추가: 위에서부터 여백
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16, // 변경: 아래 여백 줄임
    marginTop: 0,     // 변경: 위 여백 제거
  },
  title: {
    fontSize: 38,
    color: '#fff',
    fontFamily: 'Pretendard-Light',
    marginBottom: 8, // 변경: 아래 여백 줄임
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#fff',
    fontFamily: 'Pretendard-Light',
    textAlign: 'center',
    marginBottom: 32, // 변경: 아래 여백 줄임
    lineHeight: 24,
    textShadowColor: 'rgba(211, 200, 200, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 32, // 140에서 32로 줄여서 텍스트에 맞는 적절한 패딩 설정
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    minWidth: 350, // 최소 너비 설정으로 텍스트가 잘리지 않도록 함
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#000',
    fontSize: 16, // 15에서 16으로 증가하여 home.tsx와 일치
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center', // 텍스트 중앙 정렬
    includeFontPadding: false, // 안드로이드에서 폰트 패딩 제거
  },
});
