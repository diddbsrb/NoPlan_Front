import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { authService } from '../../service/authService';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

  const handleSignup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await authService.signUp(email, password, confirmPassword);
      setSuccess('회원가입이 완료되었습니다!');
      // 회원가입 후 로그인 페이지로 이동
      setTimeout(() => {
        router.replace('/(tabs)/signin');
      }, 1000); // 사용자가 성공 메시지를 볼 수 있도록 1초 지연
    } catch (err: any) {
      if (err.response) {
        if (err.response.data.email) {
          setError(err.response.data.email[0]);
        } else if (err.response.data.password) {
          setError(err.response.data.password[0]);
        } else {
          setError('회원가입에 실패했습니다.');
        }
        console.log('응답 에러:', err.response.data);
      } else if (err.request) {
        setError('서버로부터 응답이 없습니다.');
        console.log('요청 에러:', err.request);
      } else {
        setError('네트워크 오류가 발생했습니다.');
        console.log('기타 에러:', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>회원가입</Text>
      <Text style={styles.description}>
        반갑습니다! 회원가입을 위해{'\n'}이메일 주소, 비밀번호를 입력해주세요.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="이메일 주소"
        keyboardType="email-address"
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
      <TextInput
        style={styles.input}
        placeholder="비밀번호 확인"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '회원가입 중...' : '회원가입'}</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
        <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/signin')}>
          <Text style={styles.loginText}>로그인하기</Text>
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
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#A9D1F4',
    marginBottom: 15, // headerTitle과 description 사이 간격 넓힘
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 44, // description과 TextInput 사이 간격 넓힘
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#A9D1F4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#fff',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loginText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
    color: '#000',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  successText: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },
});