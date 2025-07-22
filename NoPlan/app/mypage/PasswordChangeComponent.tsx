import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

interface Props {
  onBack: () => void;
}

const PasswordChangeComponent: React.FC<Props> = ({ onBack }) => (
  <View style={{ padding: 10 }}>
    <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
      <Text style={{ color: '#0077b6' }}>← 뒤로가기</Text>
    </TouchableOpacity>
    <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, borderWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>변경 전 확인해주세요!</Text>
      <Text style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
        - 비밀번호 변경 시, 기존 비밀번호로는 로그인할 수 없습니다.
      </Text>
      <Text style={{ fontSize: 13, marginBottom: 5 }}>이전 비밀번호</Text>
      <TextInput style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 15, padding: 8 }} secureTextEntry />
      <Text style={{ fontSize: 13, marginBottom: 5 }}>변경할 비밀번호</Text>
      <TextInput style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 15, padding: 8 }} secureTextEntry />
      <Text style={{ fontSize: 13, marginBottom: 5 }}>비밀번호 확인</Text>
      <TextInput style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 8, marginBottom: 20, padding: 8 }} secureTextEntry />
      <TouchableOpacity style={{ backgroundColor: '#b2dffc', borderRadius: 8, height: 40, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>비밀번호 변경</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default PasswordChangeComponent;
