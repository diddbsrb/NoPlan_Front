import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    // 회원가입 로직 처리
    console.log(email, password, confirmPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>회원가입</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 40 }}>
        <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
        <TouchableOpacity onPress={() => console.log('로그인하기 클릭')}>
          <Text style={styles.loginText}>로그인하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#80BFE8',
    marginBottom: 15, // headerTitle과 description 사이 간격 넓힘
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 44, // description과 TextInput 사이 간격 넓힘
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#D4E8F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  loginText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});