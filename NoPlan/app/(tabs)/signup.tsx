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
  Modal,
  Animated,
  Dimensions,
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [slideAnim] = useState(new Animated.Value(Dimensions.get('window').height));
  const router = useRouter();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // 약관 동의 상태들
  const [termsAgreed, setTermsAgreed] = useState({
    privacy: false,
    location: false,
    thirdParty: false,
  });

  // 폰트 로드 및 페이지 초기화
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
        'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
    
    // 페이지 진입 시 약관 동의 상태 초기화
    setAgreePrivacyPolicy(false);
    setTermsAgreed({
      privacy: false,
      location: false,
      thirdParty: false,
    });
  }, []);

  // 약관 모달 애니메이션
  useEffect(() => {
    if (showTermsModal) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showTermsModal]);

  // 모든 약관 동의 여부 확인
  const allTermsAgreed = termsAgreed.privacy && termsAgreed.location && termsAgreed.thirdParty;

  // 약관 상세보기 열기
  const openDetailModal = (termType: string) => {
    setSelectedTerm(termType);
    setShowDetailModal(true);
  };

  // 약관 모달 닫기
  const closeTermsModal = () => {
    setShowTermsModal(false);
    // 모달이 닫힐 때 메인 페이지 체크박스 상태를 팝업 내 상태와 동기화
    setAgreePrivacyPolicy(allTermsAgreed);
  };

  // 약관 동의 처리
  const handleTermsAgreement = () => {
    if (allTermsAgreed) {
      setAgreePrivacyPolicy(true);
      closeTermsModal();
    }
  };

  // 개별 약관 동의 토글
  const toggleTermAgreement = (termType: keyof typeof termsAgreed) => {
    setTermsAgreed(prev => ({
      ...prev,
      [termType]: !prev[termType],
    }));
  };

  // 전체 동의 토글
  const toggleAllAgreement = () => {
    const newValue = !allTermsAgreed;
    setTermsAgreed({
      privacy: newValue,
      location: newValue,
      thirdParty: newValue,
    });
  };

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

        {/* 약관 동의 체크박스 */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreePrivacyPolicy}
            onValueChange={() => setShowTermsModal(true)}
            color={agreePrivacyPolicy ? '#A9D1F4' : undefined}
          />
          <Text
            style={styles.checkboxLabel}
            onPress={() => setShowTermsModal(true)}
          >
            개인정보 수집·이용 동의 (필수)
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

      {/* 약관 동의 모달 */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeTermsModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.termsModal, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>약관에 모두 동의</Text>
              <Checkbox
                value={allTermsAgreed}
                onValueChange={toggleAllAgreement}
                color={allTermsAgreed ? '#A9D1F4' : undefined}
              />
            </View>
            
            <View style={styles.termsList}>
              <View style={styles.termItem}>
                <Checkbox
                  value={termsAgreed.privacy}
                  onValueChange={() => toggleTermAgreement('privacy')}
                  color={termsAgreed.privacy ? '#A9D1F4' : undefined}
                />
                <Text style={styles.termText}>[필수] 개인정보 수집·이용 동의 (서비스 제공)</Text>
                <TouchableOpacity onPress={() => openDetailModal('privacy')}>
                  <Text style={styles.viewButton}>보기</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.termItem}>
                <Checkbox
                  value={termsAgreed.location}
                  onValueChange={() => toggleTermAgreement('location')}
                  color={termsAgreed.location ? '#A9D1F4' : undefined}
                />
                <Text style={styles.termText}>[필수] 위치정보 수집·이용 동의 (위치기반서비스)</Text>
                <TouchableOpacity onPress={() => openDetailModal('location')}>
                  <Text style={styles.viewButton}>보기</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.termItem}>
                <Checkbox
                  value={termsAgreed.thirdParty}
                  onValueChange={() => toggleTermAgreement('thirdParty')}
                  color={termsAgreed.thirdParty ? '#A9D1F4' : undefined}
                />
                <Text style={styles.termText}>[필수] 개인정보 제3자 제공 동의</Text>
                <TouchableOpacity onPress={() => openDetailModal('thirdParty')}>
                  <Text style={styles.viewButton}>보기</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.agreeButton, !allTermsAgreed && styles.disabledAgreeButton]}
              onPress={handleTermsAgreement}
              disabled={!allTermsAgreed}
            >
              <Text style={styles.agreeButtonText}>동의</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* 약관 상세보기 모달 */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModal}>
            <View style={styles.detailModalHeader}>
              <Text style={styles.detailModalTitle}>
                {selectedTerm === 'privacy' && '개인정보 수집·이용 동의 (서비스 제공)'}
                {selectedTerm === 'location' && '위치정보 수집·이용 동의 (위치기반서비스)'}
                {selectedTerm === 'thirdParty' && '개인정보 제3자 제공 동의'}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.detailModalContent}>
              {selectedTerm === 'privacy' && (
                <View>
                  <Text style={styles.detailText}>
                    [ 수집 목적 ]{'\n'}
                    • 회원 식별, 본인 확인, 중복 가입 방지 등 안정적인 서비스 운영{'\n'}
                    • 사용자의 여행 설문(키워드, 동행 등)과 위치 정보를 결합한 AI 기반 맞춤형 여행 정보 제공{'\n'}
                    • 서비스 이용에 따른 문의 및 민원 처리, 중요 공지사항 전달
                  </Text>
                  <Text style={styles.detailText}>
                    [ 수집 항목 ]{'\n'}
                    • 필수: 이메일 주소, 비밀번호, 이름, 나이, 성별, (소셜 로그인 시) 카카오 ID{'\n'}
                    • 서비스 이용 중 생성/수집: 여행 설문 정보(키워드, 이동수단, 동행), 북마크한 장소, 방문한 장소 기록, AI 여행 요약, 서비스 이용 기록, 접속 로그
                  </Text>
                  <Text style={styles.detailText}>
                    [ 보유 및 이용 기간 ]{'\n'}
                    회원 탈퇴 시까지. 단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우, 회사는 아래와 같이 관계 법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.{'\n'}
                    • 소비자의 불만 또는 분쟁처리에 관한 기록 : 3년 (전자상거래 등에서의 소비자보호에 관한 법률){'\n'}
                    • 접속 로그 기록 : 3개월 (통신비밀보호법)
                  </Text>
                </View>
              )}
              
              {selectedTerm === 'location' && (
                <View>
                  <Text style={styles.detailText}>
                    [ 수집 목적 ]{'\n'}
                    • 실시간 위치 기반 추천: 사용자의 현재 위치를 기반으로 한 주변 여행지, 식당, 카페, 숙소 등 맞춤형 장소 추천 서비스 제공{'\n'}
                    • 여행 경로 기록 및 분석: 사용자의 여행 중 이동 경로에 따른 방문지 기록 및 이를 활용한 AI 여행 요약 생성
                  </Text>
                  <Text style={styles.detailText}>
                    [ 수집 항목 ]{'\n'}
                    단말기 GPS 기반 위치 정보 (위도, 경도)
                  </Text>
                  <Text style={styles.detailText}>
                    [ 보유 및 이용 기간 ]{'\n'}
                    각 여행별 서비스 제공 목적 달성(여행 종료) 시 즉시 파기합니다. 단, 서비스 개선 및 통계 분석을 위해 개인을 알아볼 수 없도록 익명화 처리한 정보는 최대 1년간 보관될 수 있습니다.
                  </Text>
                </View>
              )}
              
              {selectedTerm === 'thirdParty' && (
                <View>
                  <Text style={styles.detailText}>
                    NO_PLAN 서비스는 원칙적으로 사용자의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.
                  </Text>
                  <Text style={styles.detailText}>
                    • 이용자가 사전에 제3자 제공에 동의한 경우{'\n'}
                    • 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관(경찰, 검찰 등)의 요구가 있는 경우
                  </Text>
                  <Text style={styles.detailNoteText}>
                    ※ 외부 서비스 연동에 대한 참고사항:{'\n'}
                    한국관광공사 API, 카카오 지도 API 등 서비스 기능 구현에 필요한 외부 서비스와 통신할 때, NO_PLAN은 개인을 식별할 수 없는 비식별 정보(예: 위치 좌표, 검색 키워드)만을 일시적으로 전송하여 장소 정보를 조회합니다. 이 과정은 특정 개인을 지목하여 정보를 넘겨주는 것이 아니므로, 개인정보 보호법상 '개인정보의 제3자 제공'에 해당하지 않습니다.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 120, // 상하 패딩 더 증가
    justifyContent: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#A9D1F4',
    marginTop: 35,
    marginBottom: 13,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
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
    marginTop: 0,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'Pretendard-Light', // 폰트 적용
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 40,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
  },
  // 모달 관련 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  termsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
  },
  termsList: {
    marginBottom: 20,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  termText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
  },
  viewButton: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#A9D1F4',
    textDecorationLine: 'underline',
  },
  agreeButton: {
    backgroundColor: '#A9D1F4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledAgreeButton: {
    backgroundColor: '#D3D3D3',
  },
  agreeButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#fff',
  },
  // 상세보기 모달 스타일
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    maxHeight: '80%',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  detailModalTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    fontSize: 18,
    color: '#666',
    padding: 5,
  },
  detailModalContent: {
    padding: 20,
  },
  detailTitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Pretendard-Light',
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
  detailNoteText: {
    fontSize: 10,
    fontFamily: 'Pretendard-Light',
    color: '#777',
    lineHeight: 16,
    marginTop: 5,
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