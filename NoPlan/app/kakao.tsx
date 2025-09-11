// app/kakao.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Alert, TouchableOpacity, Text } from 'react-native';
import Checkbox from 'expo-checkbox';
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
  const [agreePrivacyPolicy, setAgreePrivacyPolicy] = useState(false);
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
        카카오 계정으로 로그인하기 전에{'\n'}개인정보 수집·이용에 동의해주세요.
        </Text>
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreePrivacyPolicy}
            onValueChange={setAgreePrivacyPolicy}
            color={agreePrivacyPolicy ? '#FEE500' : undefined}
          />
          <Text
            style={styles.checkboxLabel}
            onPress={() => setAgreePrivacyPolicy((prev) => !prev)}
          >
            개인정보 수집·이용 동의 (필수)
          </Text>
        </View>
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>1. 개인정보 수집·이용 동의 (필수)</Text>
          <Text style={styles.policyText}>
            [ 수집·이용 목적 ]{'\n'}
            회원 식별 및 본인 확인, 서비스 제공 및 개선, 맞춤형 여행 정보 제공
          </Text>
          <Text style={styles.policyText}>
            [ 수집하는 개인정보 항목 ]{'\n'}
            필수: 이메일 주소, 비밀번호, 이름, 나이, 성별, (소셜 로그인 시) 카카오 ID{'\n'}
            자동 수집: 서비스 이용 기록, 접속 로그{'\n'}
            위치정보(선택): 단말기 GPS 기반 위치 (주변 장소 추천 기능 이용 시)
          </Text>
          <Text style={styles.policyNoteText}>
            ※참고:비밀번호는 안전하게 암호화하여 저장합니다.         {'\n'}
          </Text>
          <Text style={styles.policyText}>
            [ 보유 및 이용기간 ]{'\n'}
            회원 탈퇴 시 지체 없이 파기 (단, 관계 법령에 따라 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보관)
          </Text>
          <Text style={styles.policyTitle}>2. 개인정보 제3자 제공 동의</Text>
          <Text style={styles.policyText}>
            NO_PLAN 서비스는 수집한 개인정보를 제3자에게 제공하는 내역이 없습니다.
          </Text>
          <Text style={styles.policyNoteText}>
            ※참고:한국관광공사 API등에는 개인을 식별할 수 없는 위치 좌표값만을 일시적으로 전송하여 장소 정보를 조회하며, 이는 개인정보의 제3자 제공에 해당하지 않습니다.{'\n'}
          </Text>
          <Text style={styles.alertText}>
            ※경고:앱에서 사용되는 모든 이미지는 저작권이 존재함으로 임의로 캡쳐 및 복사, 사용을 금지합니다.
          </Text>
        </View>

        <TouchableOpacity style={styles.kakaoButton} onPress={signInWithKakao} disabled={loading || !agreePrivacyPolicy}>
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
    marginBottom: 25,
  },
  policyBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    width: '100%',
  },
  policyTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  policyText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Light',
    color: '#555',
    lineHeight: 18,
    marginBottom: 5,
  },
  policyNoteText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Light',
    color: '#777',
    lineHeight: 16,
    marginTop: 5,
  },
  alertText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Light',
    color: 'red',
    lineHeight: 16,
    marginTop: 5,
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
    marginTop: 10
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 0,
    width: '100%',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
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