import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Image } from 'react-native';

interface Props {
  onBack: () => void;
  onPassword: () => void;
  onDelete: () => void;
}

const InfoEditComponent: React.FC<Props> = ({ onBack, onPassword, onDelete }) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);  // 위치 정보 제공
  const [isAlarmEnabled, setIsAlarmEnabled] = useState(false);       // 알림 설정

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Text style={styles.backText}>← 뒤로가기</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.infoBlock}>
          <Text style={styles.label}>이름</Text>
          <Text style={styles.value}>정가경</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>휴대폰 번호</Text>
          <Text style={styles.value}>01038104169</Text>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.label}>이메일</Text>
          <Text style={styles.value}>uhuhu@naver.com</Text>
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
