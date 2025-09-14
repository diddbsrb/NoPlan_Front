import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';

interface PermissionState {
  location: boolean;
  storage: boolean;
  notification: boolean;
}

export default function PermissionConsentScreen() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<PermissionState>({
    location: false,
    storage: false,
    notification: false,
  });
  const [allAgreed, setAllAgreed] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // 폰트 로딩
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  // 필수 권한이 모두 체크되었는지 확인
  const requiredPermissionsChecked = permissions.location && permissions.storage;
  const canProceed = requiredPermissionsChecked;

  // 일괄 동의 체크박스 상태 업데이트
  useEffect(() => {
    const allChecked = permissions.location && permissions.storage && permissions.notification;
    setAllAgreed(allChecked);
  }, [permissions]);

  // 일괄 동의/해제
  const handleAllAgree = () => {
    const newState = !allAgreed;
    setPermissions({
      location: newState,
      storage: newState,
      notification: newState,
    });
  };

  // 개별 권한 체크박스 토글
  const togglePermission = (permission: keyof PermissionState) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission],
    }));
  };

  // 실제 권한 요청
  const requestPermissions = async () => {
    try {
      console.log('권한 요청 시작:', permissions);
      
      // 위치 권한 요청 (필수) - 매번 새로 요청
      if (permissions.location) {
        console.log('위치 권한 요청 중...');
        try {
          // 현재 권한 상태 확인
          const currentStatus = await Location.getForegroundPermissionsAsync();
          console.log('현재 위치 권한 상태:', currentStatus.status);
          
          // 권한 요청 (이미 허용된 경우에도 다시 요청)
          const { status } = await Location.requestForegroundPermissionsAsync();
          console.log('위치 권한 결과:', status);
          
          if (status !== 'granted') {
            console.log('위치 권한이 거부되었습니다.');
            Alert.alert(
              '위치 권한 필요',
              '정확한 위치 정보가 필요합니다. 설정에서 권한을 허용해주세요.',
              [{ text: '확인' }]
            );
            return false; // 위치 권한이 거부되면 진행 중단
          }
        } catch (locationError) {
          console.error('위치 권한 요청 오류:', locationError);
          Alert.alert(
            '위치 권한 오류',
            '위치 권한 요청 중 오류가 발생했습니다.',
            [{ text: '확인' }]
          );
          return false; // 오류 발생 시 진행 중단
        }
      }

      // 알림 권한 요청 (선택) - 매번 새로 요청
      if (permissions.notification) {
        console.log('알림 권한 요청 중...');
        try {
          // 현재 권한 상태 확인
          const currentStatus = await Notifications.getPermissionsAsync();
          console.log('현재 알림 권한 상태:', currentStatus.status);
          
          // 권한 요청 (이미 허용된 경우에도 다시 요청)
          const { status } = await Notifications.requestPermissionsAsync();
          console.log('알림 권한 결과:', status);
          
          if (status !== 'granted') {
            console.log('알림 권한이 거부되었습니다.');
          }
        } catch (notificationError) {
          console.error('알림 권한 요청 오류:', notificationError);
        }
      }

      console.log('모든 권한 요청 완료');
      return true;
    } catch (error) {
      console.error('권한 요청 중 오류:', error);
      return false; // 오류가 발생하면 진행 중단
    }
  };

  // 다음 단계로 진행
  const handleProceed = async () => {
    if (!canProceed) {
      Alert.alert('필수 권한 동의 필요', '위치 정보와 저장 공간 접근 권한에 동의해주세요.');
      return;
    }

    try {
      // 권한 요청 시도
      console.log('권한 요청 시작...');
      const success = await requestPermissions();
      
      if (!success) {
        console.log('권한 요청 실패, 현재 페이지에 머물러 있음');
        return; // 권한 요청이 실패하면 현재 페이지에 머물러 있음
      }
      
      console.log('권한 요청 완료');
      
      // 권한 동의 완료 상태 저장
      await SecureStore.setItemAsync('permissionsConsented', 'true');
      console.log('권한 동의 완료, index로 이동');
      
      // index 화면으로 이동
      router.push('/(tabs)/' as any);
    } catch (error) {
      console.error('권한 처리 중 오류:', error);
      Alert.alert(
        '오류 발생',
        '권한 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
        [{ text: '확인' }]
      );
    }
  };

  if (!fontsLoaded) {
    return null; // 폰트가 로드될 때까지 빈 화면 표시
  }

  return (
    <View style={styles.container}>
      {/* 고정 헤더 */}
      <View style={styles.fixedHeader}>
        <Text style={styles.title}>
          반가워요!{"\n"} <Text style={styles.titleHighlight}>NoPlan</Text>에 오신 여러분을 환영합니다
        </Text>
        <Text style={styles.subtitle}>
          먼저 즐거운 여행에 필요한 권한에 대해 안내할게요
        </Text>
      </View>

      {/* 스크롤 가능한 권한 항목들 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 일괄 동의 체크박스 */}
        <View style={styles.allAgreeContainer}>
          <TouchableOpacity
            style={styles.allAgreeCheckbox}
            onPress={handleAllAgree}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, allAgreed && styles.checkboxChecked]}>
              {allAgreed && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.allAgreeText}>모든 권한에 일괄 동의</Text>
          </TouchableOpacity>
        </View>

        {/* 필수 접근권한 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>[필수 접근권한]</Text>
          
          {/* 위치 정보 접근 권한 */}
          <View style={styles.permissionItem}>
            <TouchableOpacity
              style={styles.permissionCheckbox}
              onPress={() => togglePermission('location')}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, permissions.location && styles.checkboxChecked]}>
                {permissions.location && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>위치 정보 접근 권한 (정확한 위치)</Text>
                <Text style={styles.permissionDescription}>
                  <Text style={styles.bold}>목적:</Text> 사용자의 현재 위치를 실시간으로 파악하여, 주변의 맞춤형 여행지, 식당, 카페 등을 추천하는 <Text style={styles.bold}>AI 기반 핵심 기능을 제공</Text>하기 위해 반드시 필요합니다.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 저장 공간 접근 권한 */}
          <View style={styles.permissionItem}>
            <TouchableOpacity
              style={styles.permissionCheckbox}
              onPress={() => togglePermission('storage')}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, permissions.storage && styles.checkboxChecked]}>
                {permissions.storage && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>저장 공간 (파일 및 데이터)</Text>
                <Text style={styles.permissionDescription}>
                  <Text style={styles.bold}>목적:</Text> 생성된 여행 기록, AI 요약, 사용자 설정 등 서비스 이용 중 발생하는 데이터를 기기에 안전하게 보관하고, 지도 데이터 등 캐시 파일을 저장하여 <Text style={styles.bold}>원활하고 안정적인 서비스 경험을 제공</Text>하기 위해 필요합니다.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 선택 접근권한 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>[선택 접근권한]</Text>
          
          {/* 알림 권한 */}
          <View style={styles.permissionItem}>
            <TouchableOpacity
              style={styles.permissionCheckbox}
              onPress={() => togglePermission('notification')}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, permissions.notification && styles.checkboxChecked]}>
                {permissions.notification && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.permissionContent}>
                <Text style={styles.permissionTitle}>알림 권한</Text>
                <Text style={styles.permissionDescription}>
                  <Text style={styles.bold}>목적:</Text> AI가 발견한 새로운 장소 추천, 사용자의 여행 상황에 맞는 유용한 정보, 이벤트 및 공지사항 등 시의적절한 소식을 푸시 알림으로 보내드리기 위해 사용됩니다.
                </Text>
                <Text style={styles.optionalNote}>
                  ※ 선택 접근권한은 동의하지 않아도 서비스 이용이 가능하나, 맞춤형 여행 정보 알림 등 일부 편의 기능의 사용이 제한될 수 있습니다.
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 고정 하단 버튼 */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.proceedButton, !canProceed && styles.proceedButtonDisabled]}
          onPress={handleProceed}
          disabled={!canProceed}
          activeOpacity={0.8}
        >
          <Text style={[styles.proceedButtonText, !canProceed && styles.proceedButtonTextDisabled]}>
            시작하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fixedHeader: {
    paddingTop: 100,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleHighlight: {
    fontFamily: 'Pretendard-Medium',
    color: '#659ECF',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Pretendard-Light',
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  allAgreeContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#A9D1F4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(169, 209, 244, 0.2)',
  },
  allAgreeCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  allAgreeText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  permissionItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#A9D1F4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(169, 209, 244, 0.15)',
  },
  permissionCheckbox: {
    flexDirection: 'row',
    padding: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#659ECF',
    borderColor: '#659ECF',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontFamily: 'Pretendard-Medium',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 13,
    fontFamily: 'Pretendard-Light',
    color: '#666',
    lineHeight: 18,
  },
  bold: {
    fontFamily: 'Pretendard-Medium',
    color: '#1a1a1a',
  },
  optionalNote: {
    fontSize: 12,
    fontFamily: 'Pretendard-Light',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  fixedButtonContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f8f9fa',
  },
  proceedButton: {
    backgroundColor: '#659ECF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#659ECF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  proceedButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedButtonText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#fff',
  },
  proceedButtonTextDisabled: {
    color: '#999',
  },
});
