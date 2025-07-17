import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 로그인 처리 로직
    console.log(email, password);
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 처리
    console.log('카카오 로그인');
  };

  const handleSignup = () => {
    // 회원가입 페이지 이동
    console.log('회원가입으로 이동');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        지금 <Text style={styles.blue}>NO PLAN</Text>과 함께{'\n'}
        <Text style={styles.blue}>여행</Text>을 시작하세요!
      </Text>

      <Text style={styles.subtext}>
        만나서 반갑습니다! 로그인을 위하여{'\n'}이메일 주소와 비밀번호를 입력해주세요.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="이메일"
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

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>로그인</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>또는</Text>

      <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin}>
        <Image
          source={{
            uri: 'https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png',
          }}
          style={styles.kakaoIcon}
        />
        <Text style={styles.kakaoText}>카카오톡으로 로그인</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 30 }}>
        <Text style={styles.footerText}>계정이 없으신가요? </Text>
        <TouchableOpacity onPress={handleSignup}>
          <Text style={styles.signupText}>회원가입 하기</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    color: '#000',
  },
  blue: {
    color: '#80BFE8',
    fontWeight: '700',
  },
  subtext: {
    fontSize: 13,
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
    marginBottom: 14,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#D4E8F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  orText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    marginBottom: 14,
  },
  kakaoButton: {
    flexDirection: 'row',
    backgroundColor: '#FEE500',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  kakaoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  kakaoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B1E1E',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  signupText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
});
