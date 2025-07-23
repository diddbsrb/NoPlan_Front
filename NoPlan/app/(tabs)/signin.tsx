import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../../service/authService';
import * as SecureStore from 'expo-secure-store';

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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      const { access, refresh, user } = res.data as LoginResponse;
      // access token 저장
      await SecureStore.setItemAsync('accessToken', access);
      if (user.is_info_exist) {
        router.push('/(tabs)/user_info');
      } else {
        router.push('/(tabs)/user_info'); // 실제 경로로 수정
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

  const handleKakaoLogin = () => {
    console.log('카카오 로그인');
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

      <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin}>
        <Image
          source={{
            uri: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
          }}
          style={styles.kakaoIcon}
        />
        <Text style={styles.kakaoText}>카카오톡으로 로그인</Text>
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
