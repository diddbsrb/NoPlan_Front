import React, { useState, useEffect } from 'react'; // useEffect 추가
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator, // ActivityIndicator 추가
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../service/authService';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useAuthRequest } from 'expo-auth-session';

// ★★★ 웹 기반 인증 세션을 완료시켜주는 함수 호출 ★★★
WebBrowser.maybeCompleteAuthSession();

// 로그인 응답 타입 명시
interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_info_exist: boolean;
  };
}

// 카카오 로그인 설정 정보
const discovery = {
  authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // 카카오 REST API 키와 Redirect URI 설정
  const KAKAO_REST_API_KEY = '8bd62a5a18a9ca6de96fafab3f154da1'; 
  const REDIRECT_URI = 'https://www.no-plan.cloud/api/v1/users/kakao/';

  // expo-auth-session Hook 설정
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: KAKAO_REST_API_KEY,
      scopes: [],
      redirectUri: REDIRECT_URI,
      responseType: 'code', // 인가 코드를 받기 위해 명시
    },
    discovery
  );

  // ★★★ 카카오 로그인 버튼 클릭 시 실행될 함수 (유일한 버전) ★★★
  const handleKakaoLogin = () => {
    if (request) {
      setLoading(true);
      promptAsync();
    }
  };

  // ★★★ 카카오 로그인 응답 처리 useEffect (추가된 부분) ★★★
  useEffect(() => {
    if (response) {
      if (response.type === 'success') {
        const { code } = response.params;
        console.log(`카카오 인가 코드 수신 성공: ${code}`);
        sendCodeToBackend(code);
      } else if (response.type === 'error') {
        setError('카카오 로그인에 실패했습니다.');
        console.log('카카오 로그인 에러:', response.error);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [response]);

  // 인가 코드를 백엔드로 보내는 함수
  const sendCodeToBackend = async (code: string) => {
    try {
      const res = await authService.kakaoLogin(code);
      const { access, refresh, user } = res.data as LoginResponse;
      await SecureStore.setItemAsync('accessToken', access);
      
      if (user.is_info_exist) {
        router.push('/(tabs)/home');
      } else {
        router.push('/(tabs)/user_info');
      }
    } catch (err: any) {
      setError('로그인 처리 중 오류가 발생했습니다.');
      console.log('백엔드 토큰 교환 에러:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 로그인 함수
  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      const { access, refresh, user } = res.data as LoginResponse;
      await SecureStore.setItemAsync('accessToken', access);

      if (user.is_info_exist) {
        router.push('/(tabs)/home');
      } else {
        router.push('/(tabs)/user_info');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(Array.isArray(err.response.data.error) ? err.response.data.error[0] : err.response.data.error);
      } else {
        setError('로그인에 실패했습니다.');
      }
      console.log('로그인 에러:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/(tabs)/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        지금 <Text style={styles.blue}>NO PLAN</Text>과 함께{'\n'}
        <Text style={styles.blue}>여행</Text>을 시작하세요!
      </Text>

      <Text style={styles.subtext}>
        만나서 반갑습니다! 로그인을 위하여{'\n'}이메일 주소와 비밀번호를 입력해주세요.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
        <Text style={styles.loginButtonText}>{loading ? '로그인 중...' : '로그인'}</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>또는</Text>

      <TouchableOpacity 
        style={styles.kakaoButton} 
        onPress={handleKakaoLogin} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#3B1E1E" />
        ) : (
          <>
            <Image
              source={{
                uri: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
              }}
              style={styles.kakaoIcon}
            />
            <Text style={styles.kakaoText}>카카오톡으로 로그인</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 30 }}>
        <Text style={styles.footerText}>계정이 없으신가요? </Text>
        <TouchableOpacity onPress={handleSignup}>
          <Text style={styles.signupText}>회원가입 하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 스타일 시트는 이전과 동일합니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#000',
  },
  blue: {
    color: '#80BFE8',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#D4E8F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  orText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginBottom: 14,
  },
  kakaoButton: {
    flexDirection: 'row',
    backgroundColor: '#FEE500',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  kakaoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1E1E',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  signupText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});