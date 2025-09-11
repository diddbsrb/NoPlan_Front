import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView, // ScrollView 추가
} from 'react-native';
import Checkbox from 'expo-checkbox'; // expo-checkbox 라이브러리 추가
import { authService } from '../../service/authService';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreePrivacyPolicy, setAgreePrivacyPolicy] = useState(false); // 개인정보 수집 이용 동의 상태
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

    if (!agreePrivacyPolicy) {
      setError('개인정보 수집·이용 동의 (필수)에 동의해야 회원가입이 가능합니다.');
      setLoading(false);
      return;
    }

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

  if (!fontsLoaded) {
    return null; // 폰트 로드 전에는 아무것도 렌더링하지 않음
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          autoCapitalize="none"
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

        {/* 개인정보 수집·이용 동의 */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreePrivacyPolicy}
            onValueChange={setAgreePrivacyPolicy}
            color={agreePrivacyPolicy ? '#A9D1F4' : undefined}
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
          {/* '참고' 텍스트를 위한 새로운 스타일 적용 */}
          <Text style={styles.policyNoteText}>
            ※참고:한국관광공사 API등에는 개인을 식별할 수 없는 위치 좌표값만을 일시적으로 전송하여 장소 정보를 조회하며, 이는 개인정보의 제3자 제공에 해당하지 않습니다.{'\n'}
            
          </Text>
          <Text style={styles.alertText}>
          ※경고:앱에서 사용되는 모든 이미지는 저작권이 존재함으로 임의로 캡쳐 및 복사, 사용을 금지합니다.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !agreePrivacyPolicy && styles.disabledButton]} // 동의하지 않으면 비활성화 스타일 적용
          onPress={handleSignup}
          disabled={loading || !agreePrivacyPolicy} // 동의하지 않으면 버튼 비활성화
        >
          <Text style={styles.buttonText}>{loading ? '회원가입 중...' : '회원가입'}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
          <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/signin')}>
            <Text style={styles.loginText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingVertical: 50, // 상하 패딩 추가
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#A9D1F4',
    marginTop:10,
    marginBottom: 13,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'Pretendard-Light', // 폰트 적용
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 20,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
  },
  policyBox: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
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
  // '참고' 텍스트를 위한 새로운 스타일
  policyNoteText: {
    fontSize: 10, // policyText (12) 보다 2pt 작게
    fontFamily: 'Pretendard-Light',
    color: '#777', // 약간 더 연한 색상으로 구분
    lineHeight: 16,
    marginTop: 5, // 위쪽으로 약간 여백 추가
  },
  alertText: {
    fontSize: 10, // policyText (12) 보다 2pt 작게
    fontFamily: 'Pretendard-Light',
    color: 'red', // 약간 더 연한 색상으로 구분
    lineHeight: 16,
    marginTop: 5, // 위쪽으로 약간 여백 추가
  },
  button: {
    backgroundColor: '#A9D1F4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  disabledButton: {
    backgroundColor: '#d3d3d3', // 비활성화 시 버튼 색상
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
    fontFamily: 'Pretendard-Light',
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
    fontSize: 12,
    fontFamily: 'Pretendard-Light',
  },
  successText: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 12,
    fontFamily: 'Pretendard-Light',
  },
});