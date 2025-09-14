// app/kakao.tsx

import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Alert, TouchableOpacity, Text, Modal, Animated, Dimensions, ScrollView } from 'react-native';
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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState('');
  const [slideAnim] = useState(new Animated.Value(Dimensions.get('window').height));
  // ★★★ 2. AuthContext에서 login 함수를 가져옵니다. (authLogin으로 별칭 부여) ★★★
  const { login: authLogin } = useAuth();

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
        'Pretendard-Light': require('../assets/fonts/Pretendard-Light.otf'),
        'Pretendard-Medium': require('../assets/fonts/Pretendard-Medium.otf'),
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
        카카오 계정으로 로그인하기 전에{'\n'}약관에 동의해주세요.
        </Text>
        
        {/* 약관 동의 체크박스 */}
        <View style={styles.checkboxContainer}>
          <Checkbox
            value={agreePrivacyPolicy}
            onValueChange={() => setShowTermsModal(true)}
            color={agreePrivacyPolicy ? '#FEE500' : undefined}
          />
          <Text
            style={styles.checkboxLabel}
            onPress={() => setShowTermsModal(true)}
          >
            개인정보 수집·이용 동의 (필수)
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.kakaoButton, (!agreePrivacyPolicy || loading) && styles.disabledKakaoButton]} 
          onPress={signInWithKakao} 
          disabled={loading || !agreePrivacyPolicy}
        >
          {loading ? (
            <ActivityIndicator color="#000000" />
          ) : (
            <Text style={[styles.kakaoButtonText, (!agreePrivacyPolicy || loading) && styles.disabledKakaoButtonText]}>
              카카오로 로그인하기
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => !loading && router.back()}>
          <Text style={styles.backButtonText}>이전으로 돌아가기</Text>
        </TouchableOpacity>
      </View>

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
                color={allTermsAgreed ? '#FEE500' : undefined}
              />
            </View>
            
            <View style={styles.termsList}>
              <View style={styles.termItem}>
                <Checkbox
                  value={termsAgreed.privacy}
                  onValueChange={() => toggleTermAgreement('privacy')}
                  color={termsAgreed.privacy ? '#FEE500' : undefined}
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
                  color={termsAgreed.location ? '#FEE500' : undefined}
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
                  color={termsAgreed.thirdParty ? '#FEE500' : undefined}
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
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 10,
    marginTop: 100,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 25,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 80,
    width: '100%',
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
    color: '#FEE500',
    textDecorationLine: 'underline',
  },
  agreeButton: {
    backgroundColor: '#FEE500',
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
    color: '#000',
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
  disabledKakaoButton: {
    backgroundColor: '#D3D3D3',
  },
  kakaoButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  disabledKakaoButtonText: {
    color: '#888888',
  },
  backButton: {
    marginTop: 50,
  },
  backButtonText: {
    fontSize: 14,
    color: '#888888',
    textDecorationLine: 'underline',
  },
});