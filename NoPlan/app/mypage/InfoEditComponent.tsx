// components/InfoEditComponent.tsx

import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
import { authService } from '../../service/authService';
import { userService } from '../../service/userService';

console.log('🧩 InfoEditComponent 렌더됨');

interface Props {
  onBack: () => void;
  onPassword: () => void;
  onDelete: () => void;
}

const InfoEditComponent: React.FC<Props> = ({ onBack, onPassword, onDelete }) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setIsLoggedIn, setIsTraveling, checkTravelStatus } = useTravelSurvey();

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError('');
      try {
        // *** 핵심 변경 사항: 이제 userInfo 변수에 바로 데이터 객체가 할당됩니다. ***
        const userInfo = await userService.getUserInfo();
        console.log('📦 getUserInfo 응답:', userInfo);
        
        // .data 없이 바로 속성에 접근합니다.
        setName(userInfo.name ?? '회원님');
        setEmail(userInfo.email);

      } catch (err: any) {
        console.error('❌ 사용자 정보 불러오기 실패:', err);
        setError('사용자 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserInfo();
  }, []);
  
  /**
   * *** 핵심 변경 사항: useFocusEffect 사용 ***
   * 이 훅은 이 화면이 사용자에게 보여질 때마다(포커스될 때마다) 실행됩니다.
   * OS 설정에서 권한을 변경하고 앱으로 돌아오는 경우도 완벽하게 처리합니다.
   */
  useFocusEffect(
    // useCallback으로 함수를 감싸서 불필요한 재실행을 방지합니다.
    useCallback(() => {
      // 위치 권한을 확인하고 상태를 업데이트하는 비동기 함수
      const checkLocationPermission = async () => {
        // 권한을 묻지 않고 현재 상태만 가져옵니다.
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('📍 화면 포커스됨. 현재 위치 권한 상태:', status);
        
        // 권한이 '허용됨' 상태일 때만 true로 설정합니다.
        setIsLocationEnabled(status === Location.PermissionStatus.GRANTED);
      };

      checkLocationPermission();
      
      // useFocusEffect는 컴포넌트가 포커스를 잃을 때 실행할 정리(clean-up) 함수를 반환할 수 있습니다.
      // 이 경우에는 특별히 정리할 작업이 없으므로 아무것도 반환하지 않습니다.
    }, []) // 의존성 배열이 비어있으므로, 이 콜백 함수 자체는 재생성되지 않습니다.
  );

     /**
   * *** 최종 수정된 로그아웃 함수 ***
   * 이제 이 함수는 로그아웃을 바로 실행하는 대신, 사용자에게 확인 알림창을 띄웁니다.
   */
  const handleLogout = () => {
    Alert.alert(
      "로그아웃", // 알림창 제목
      "로그아웃 하시겠습니까?", // 알림창 내용
      [
        // 버튼 배열
        {
          text: "취소", // 취소 버튼
          onPress: () => console.log("로그아웃이 취소되었습니다."),
          style: "cancel" // iOS에서 기본 취소 스타일 적용
        },
        { 
          text: "로그아웃", // 확인 버튼
          // '로그아웃' 버튼을 누르면, 아래의 비동기 함수가 실행됩니다.
          onPress: async () => {
            try {
              console.log('사용자가 로그아웃을 확인했습니다. 절차를 시작합니다...');
      
              // 1. 서버에 refresh 토큰 만료 요청
              await authService.logout();
              
              // 2. 여행 상태를 false로 설정
              await setIsTraveling(false);
              
              // 3. 로그인 상태를 false로 설정
              await setIsLoggedIn(false);
              
              // 4. 클라이언트 기기에서 토큰 삭제
              await SecureStore.deleteItemAsync('accessToken');
              await SecureStore.deleteItemAsync('refreshToken');
              
              // 5. 여행 상태 재확인 및 동기화
              await checkTravelStatus();
              
              console.log('로컬 토큰 삭제 완료. 초기 화면으로 이동합니다.');
              // 6. 초기 화면으로 이동 (기본 화면)
              router.replace('/' as any); 
      
            } catch (error) {
              console.error('전체 로그아웃 처리 중 오류 발생:', error);
              Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
            }
          },
          style: 'destructive' // iOS에서 빨간색 텍스트로 강조 (파괴적인 작업임을 암시)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로가기</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        {/* --- 이름, 이메일, 비밀번호 변경 등 (이전과 동일) --- */}
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>{loading ? '로딩 중...' : error ? error : name}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이메일</Text>
          <Text style={styles.value}>{loading ? '로딩 중...' : error ? error : email}</Text>
        </View>
        <TouchableOpacity onPress={onPassword} style={styles.passwordRow}>
          <Text style={styles.label}>비밀번호 변경</Text>
          <Text style={styles.link}>변경</Text>
        </TouchableOpacity>
        <View style={styles.settingRow}>
          <View style={styles.iconLabel}>
            <Image
              source={require('../../assets/images/kakao_icon.jpg')}
              style={styles.kakaoIcon}
            />
            <Text style={styles.label}>카카오 연동</Text>
          </View>
          <Switch value={true} disabled />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.label}>위치 정보 제공</Text>
          <Switch
            // 스위치는 사용자가 직접 제어할 수 없도록 비활성화합니다.
            disabled={true} 
            value={isLocationEnabled}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isLocationEnabled ? '#0077b6' : '#f4f3f4'}
            style={{ opacity: 0.7 }} // 비활성화된 느낌을 주기 위해 투명도 조절
          />
        </View>
        <Text style={styles.subtext}>고객님의 현재 위치 기반으로 더 나은 추천을 위해 수집됩니다.</Text>
        
        {/* --- 알림 설정, 계정 삭제 등 (이전과 동일) --- */}
        <View style={styles.settingRow}>
          <Text style={styles.label}>알림 설정</Text>
          <Switch
            value={isAlarmEnabled}
            onValueChange={() => setIsAlarmEnabled(prev => !prev)}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isAlarmEnabled ? '#0077b6' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.subtext}>고객님의 일정에 대한 알림을 제공합니다.</Text>
        
        {/* 로그아웃 버튼을 계정 삭제 위에 추가 */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>계정 삭제하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InfoEditComponent;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    color: '#0077b6',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoBlock: {
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    color: '#666',
  },
  value: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
  },
  passwordRow: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    color: '#0077b6',
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  subtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    marginBottom: 4,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  logoutButton: {
    marginTop: 30,
  },
  logoutText: {
    color: '#0077b6',
    fontSize: 13,
  },
  deleteButton: {
    marginTop: 30,
  },
  deleteText: {
    color: '#e74c3c',
    fontSize: 13,
  },
});