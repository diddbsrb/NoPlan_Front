import React from 'react';
import { ImageBackground, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
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
        <Text style={styles.subtitle}>계획 NO! 출발 NOW!{"\n"}당신만의 즉흥 여행을 시작합니다.</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>지금 시작하기</Text>
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
    paddingHorizontal: 20,
    paddingTop: 100, // 추가: 위에서부터 여백
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16, // 변경: 아래 여백 줄임
    marginTop: 0,     // 변경: 위 여백 제거
  },
  title: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8, // 변경: 아래 여백 줄임
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32, // 변경: 아래 여백 줄임
    lineHeight: 24,
    textShadowColor: 'rgba(211, 200, 200, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  button: {
    backgroundColor: 'rgba(213, 237, 250, 0.85)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
});
