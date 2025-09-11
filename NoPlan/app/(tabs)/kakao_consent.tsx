// app/(tabs)/kakao_consent.tsx
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import Checkbox from 'expo-checkbox';

export default function KakaoConsentScreen() {
  const [agreePrivacyPolicy, setAgreePrivacyPolicy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

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

  const handleConfirmConsent = () => {
    setError('');
    if (!agreePrivacyPolicy) {
      setError('개인정보 수집·이용 동의 (필수)에 동의해야 카카오 로그인이 가능합니다.');
      return;
    }
    // 동의했으면 실제 카카오 로그인 웹뷰 경로로 이동
    router.push('/kakao'); // 기존 카카오 로그인 웹뷰 경로
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>카카오 로그인 약관 동의</Text>
        <Text style={styles.description}>
          카카오 계정으로 로그인하기 전에{'\n'}개인정보 수집·이용에 동의해주세요.
        </Text>

        {/* 개인정보 수집·이용 동의 */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreePrivacyPolicy}
            onValueChange={setAgreePrivacyPolicy}
            color={agreePrivacyPolicy ? '#A9D1F4' : undefined}
          />
          <Text style={styles.checkboxLabel}>개인정보 수집·이용 동의 (필수)</Text>
        </View>
        <View style={styles.policyBox}>
          <Text style={styles.policyTitle}>1. 개인정보 수집·이용 동의 (필수)</Text>
          <Text style={styles.policyText}>
            [ 수집·이용 목적 ]{'\n'}
            회원 식별 및 본인 확인, 서비스 제공 및 개선, 맞춤형 여행 정보 제공
          </Text>
          <Text style={styles.policyText}>
            [ 수집하는 개인정보 항목 ]{'\n'}
            필수: 이메일 주소, (카카오 로그인 시) 카카오 ID, 이름, 나이, 성별{'\n'}
            자동 수집: 서비스 이용 기록, 접속 로그{'\n'}
            위치정보(선택): 단말기 GPS 기반 위치 (주변 장소 추천 기능 이용 시)
          </Text>
          <Text style={styles.policyNoteText}>
            ※참고:비밀번호는 안전하게 암호화하여 저장합니다.   {'\n'}         
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

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, !agreePrivacyPolicy && styles.disabledButton]}
          onPress={handleConfirmConsent}
          disabled={!agreePrivacyPolicy}
        >
          <Text style={styles.buttonText}>카카오 로그인 계속하기</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>이전으로 돌아가기</Text>
        </TouchableOpacity>
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
    paddingVertical: 50,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
    color: '#A9D1F4',
    marginTop:10,
    marginBottom: 13,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  policyNoteText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Light',
    color: '#777',
    lineHeight: 16,
    marginTop: 5,
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
    marginBottom: 10, // 돌아가기 버튼과의 간격 조정
  },
  disabledButton: {
    backgroundColor: '#d3d3d3',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#fff',
  },
  backButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#666',
    textDecorationLine: 'underline',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 12,
    fontFamily: 'Pretendard-Light',
  },
});