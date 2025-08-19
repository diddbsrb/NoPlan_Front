// app/kakao.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { login } from '@react-native-seoul/kakao-login';

// ★★★ 1. useAuth 훅을 import 합니다. ★★★
import { useAuth } from './(contexts)/AuthContext';
// UserInfo 타입을 사용하기 위해 import 합니다.
import { UserInfo } from '../service/userService';

// 백엔드 API URL (환경 변수로 관리하는 것을 권장)
// 예: const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const BACKEND_API_URL = 'https://www.no-plan.cloud/api/v1/users/kakao/';

export default function KakaoLoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  // ★★★ 2. AuthContext에서 login 함수를 가져옵니다. (authLogin으로 별칭 부여) ★★★
  const { login: authLogin } = useAuth();

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 백엔드로 카카오 액세스 토큰을 전송하는 함수
  const sendTokenToBackend = async (accessToken: string) => {
    try {
      console.log(`백엔드로 카카오 액세스 토큰(accessToken)을 POST 요청으로 보냅니다: ${accessToken}`);

      const response = await axios.post(BACKEND_API_URL, {
        access_token: accessToken,
      });

      console.log('백엔드로부터 최종 JWT 응답 수신:', response.data);

      // ★★★ 3. 백엔드 응답에서 user 객체까지 모두 추출합니다. ★★★
      const { access, refresh, user } = response.data as { access: string; refresh: string; user: UserInfo };
      
      if (access && user) {
        // ★★★ 4. Context의 login 함수를 호출하여 전역 상태를 업데이트하고 토큰을 저장합니다. ★★★
        await authLogin(access, refresh, user);
        
        // ★★★ 5. 이제 user 객체를 통해 is_info_exist를 바로 사용할 수 있습니다. ★★★
        if (user.is_info_exist) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(tabs)/user_info');
        }

      } else {
        throw new Error('백엔드로부터 유효한 토큰 또는 사용자 정보를 받지 못했습니다.');
      }
    } catch (error) {
      console.error('백엔드로 토큰 전송 중 에러 발생:', error);
      Alert.alert('로그인 오류', '서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      // 실패 시 현재 화면에 머물러 재시도 유도
    }
  };

  // 카카오 SDK를 사용하여 로그인하는 함수
  const signInWithKakao = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const token = await login();
      console.log('카카오 로그인 성공, 액세스 토큰:', token.accessToken);
      await sendTokenToBackend(token.accessToken);
    } catch (error) {
      console.error('카카오 로그인 실패:', error);
      if (String(error).includes('cancel')) {
        // 사용자가 로그인을 취소한 경우, 이전 화면으로 돌아감
        Alert.alert('알림', '카카오 로그인이 취소되었습니다.');
        router.back();
      } else {
        // 그 외 에러의 경우, 현재 화면에 머물며 재시도 유도
        Alert.alert('로그인 실패', '카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>카카오 로그인</Text>
        <Text style={styles.description}>
          카카오 계정으로 간편하게 로그인하고{'\n'}서비스를 이용해보세요.
        </Text>
        <TouchableOpacity style={styles.kakaoButton} onPress={signInWithKakao} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={styles.kakaoButtonText}>카카오로 로그인하기</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => !loading && router.back()}>
          <Text style={styles.backButtonText}>이전으로 돌아가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 40,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 50,
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: '#888888',
    textDecorationLine: 'underline',
  },
});