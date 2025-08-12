import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as Font from 'expo-font';
import { userService } from '../../service/userService';

const PasswordChangeComponent = ({ onBack }: { onBack: () => void }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [loading, setLoading] = useState(false);
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

  const handleChangePassword = async () => {
    if (newPassword1 !== newPassword2) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await userService.changePassword(oldPassword, newPassword1, newPassword2);
      Alert.alert('성공', '비밀번호가 성공적으로 변경되었습니다.');
      onBack(); // 이전 화면으로 이동
    } catch (err: any) {
      const msg = err.response?.data?.detail || JSON.stringify(err.response?.data) || err.message;
      Alert.alert('오류', `비밀번호 변경 실패: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← 뒤로가기</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="현재 비밀번호"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="새 비밀번호"
        secureTextEntry
        value={newPassword1}
        onChangeText={setNewPassword1}
      />
      <TextInput
        style={styles.input}
        placeholder="새 비밀번호 확인"
        secureTextEntry
        value={newPassword2}
        onChangeText={setNewPassword2}
      />

      <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? '변경 중...' : '비밀번호 변경'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PasswordChangeComponent;

const styles = StyleSheet.create({
  container: { padding: 20 },
  back: { color: '#123A86', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12,
  },
  button: {
    backgroundColor: '#123A86', padding: 14, borderRadius: 8, alignItems: 'center',
  },
  buttonText: {
    color: '#fff', fontFamily: 'Pretendard-Light', fontWeight: 'bold',
  },
});
