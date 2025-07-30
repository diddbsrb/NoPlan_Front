// components/InfoEditComponent.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Image } from 'react-native';
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

        <View style={styles.settingRow}>
          <Text style={styles.label}>위치 정보 제공</Text>
          <Switch
            value={isLocationEnabled}
            onValueChange={() => setIsLocationEnabled(prev => !prev)}
            trackColor={{ false: '#ccc', true: '#b2dffc' }}
            thumbColor={isLocationEnabled ? '#0077b6' : '#f4f3f4'}
          />
        </View>
        <Text style={styles.subtext}>고객님의 현재 위치 기반으로 더 나은 추천을 위해 수집됩니다.</Text>

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
  deleteButton: {
    marginTop: 30,
  },
  deleteText: {
    color: '#e74c3c',
    fontSize: 13,
  },
});