import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ★★★ AuthContext import 추가 ★★★
import { useAuth } from '../(contexts)/AuthContext';
import { authService } from '../../service/authService'; // 이메일 로그인을 위한 서비스

// 백엔드 응답 타입 (기존과 동일)
interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    name: string;
    email: string;
    is_info_exist: boolean;
    is_kakao_linked?: boolean; // ★★★ is_kakao_linked 속성 추가 ★★★
  };
}

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // ★★★ AuthContext에서 login 함수 가져오기 ★★★
  const { login } = useAuth();

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

  // ★★★ expo-auth-session 관련 코드는 모두 삭제되었습니다. ★★★

  // 이메일 로그인 함수 (AuthContext 사용)
  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      const { access, refresh, user } = res.data as LoginResponse;
      
      // ★★★ AuthContext의 login 함수 사용 ★★★
      await login(access, refresh, {
        ...user,
        is_kakao_linked: user.is_kakao_linked ?? false // ★★★ 기본값 false로 설정 ★★★
      });

      if (user.is_info_exist) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(tabs)/user_info');
      }
    } catch (err: any) {
      setError('이메일 또는 비밀번호가 일치하지 않습니다.');
      console.log('이메일 로그인 에러:', err.response ? err.response.data : err);
    } finally {
      setLoading(false);
    }
  };

  // ★★★ 카카오 로그인 버튼을 눌렀을 때의 동작이 변경되었습니다. ★★★
  const handleKakaoLogin = () => {
    // 이제 웹뷰를 띄우는 /kakao 경로로 이동시킵니다.
    router.push('../kakao');
  };

  // 회원가입 페이지로 이동하는 함수
  const handleSignup = () => {
    router.replace('/(tabs)/signup');
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

      <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin} disabled={loading}>
        <Text style={styles.loginButtonText}>{loading ? '로그인 중...' : '로그인'}</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>또는</Text>

      <TouchableOpacity 
        style={styles.kakaoButton} 
        onPress={handleKakaoLogin} // ★★★ 새로 정의된 함수를 연결합니다. ★★★
        disabled={loading} // 이메일 로그인 중에는 카카오 로그인 버튼도 비활성화
      >
        {/* 이메일 로그인 시에는 카카오 버튼에 로딩 표시를 하지 않도록 수정 */}
        <>
          <Image
            source={{
              uri: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
            }}
            style={styles.kakaoIcon}
          />
          <Text style={styles.kakaoText}>카카오톡으로 로그인</Text>
        </>
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

// 스타일 시트는 기존과 동일합니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginBottom: 12,
    color: '#000',
  },
  blue: {
    color: '#A9D1F4',
    fontFamily: 'Pretendard-Medium',
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
    backgroundColor: '#A9D1F4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
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
    fontFamily: 'Pretendard-Medium',
    color: '#3B1E1E',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  signupText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#000',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});