import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import * as Font from 'expo-font';
// *** 변경점 1: Alert와 Linking을 import 합니다. ***
import { Alert, Image, StyleSheet, Switch, Text, TouchableOpacity, View, Linking } from 'react-native';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError('');
      try {
        const userInfo = await userService.getUserInfo();
        console.log('📦 getUserInfo 응답:', userInfo);
        
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
  
  useFocusEffect(
    useCallback(() => {
      const checkLocationPermission = async () => {
        const { status } = await Location.getForegroundPermissionsAsync();
        console.log('📍 화면 포커스됨. 현재 위치 권한 상태:', status);
        
        setIsLocationEnabled(status === Location.PermissionStatus.GRANTED);
      };

      checkLocationPermission();
      
    }, [])
  );
  
  /**
   * *** 변경점 2: 위치 설정 토글 클릭 시 알림을 띄우는 함수 ***
   * 사용자가 직접 권한을 변경할 수 있도록 디바이스 설정 화면으로 안내합니다.
   */
  const handleLocationSettingPress = () => {
    Alert.alert(
      "권한 설정 안내",
      "위치 정보 제공을 변경하시려면 기기의 설정 메뉴로 이동해야 합니다. 설정 화면으로 이동하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel"
        },
        { 
          text: "설정으로 이동",
          // '설정으로 이동'을 누르면 앱의 설정 화면을 엽니다.
          onPress: () => Linking.openSettings(),
          style: 'default'
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

        {/* --- 변경점 3: View를 TouchableOpacity로 바꾸고 onPress에 핸들러를 연결합니다. --- */}
        <TouchableOpacity onPress={handleLocationSettingPress} style={styles.settingRow}>
          <Text style={styles.label}>위치 정보 제공</Text>
          <Switch
            disabled={true} 
            value={isLocationEnabled}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isLocationEnabled ? '#123A86' : '#f4f3f4'}
            style={{ opacity: 0.7 }}
          />
        </TouchableOpacity>
        <Text style={styles.subtext}>고객님의 현재 위치 기반으로 더 나은 추천을 위해 수집됩니다.</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.label}>알림 설정</Text>
          <Switch
            value={isAlarmEnabled}
            onValueChange={() => setIsAlarmEnabled(prev => !prev)}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isAlarmEnabled ? '#123A86' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.subtext}>고객님의 일정에 대한 알림을 제공합니다.</Text>
        
        
        
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
    color: '#123A86',
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
    fontFamily: 'Pretendard-Medium',
  },
  passwordRow: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    color: '#123A86',
    fontFamily: 'Pretendard-Medium',
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
    color: '#123A86',
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