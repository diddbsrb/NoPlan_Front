import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

interface Props {
  onBack: () => void;
}

const reasons = [
  '자주 방문하지 않아서',
  '사용이 불편해서',
  '개인정보가 걱정돼서',
  '기타',
];

const AccountDeleteComponent: React.FC<Props> = ({ onBack }) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [etcReason, setEtcReason] = useState('');

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
        <Text style={{ color: '#0077b6' }}>← 뒤로가기</Text>
      </TouchableOpacity>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#ddd' }}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>삭제 전 확인해주세요!</Text>
        <Text style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
          - 계정 삭제 시 모든 데이터가 영구적으로 삭제되며 복구가 불가합니다.
        </Text>

        <Text style={{ fontSize: 13, marginBottom: 10 }}>계정을 삭제하는 이유가 무엇인가요?</Text>
        {reasons.map((reason, index) => (
          <TouchableOpacity
            key={index}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
            onPress={() => setSelectedReason(reason)}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selectedReason === reason ? '#0077b6' : '#ccc',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              {selectedReason === reason && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#0077b6' }} />
              )}
            </View>
            <Text style={{ fontSize: 13, color: selectedReason === reason ? '#0077b6' : '#222', fontWeight: selectedReason === reason ? 'bold' : 'normal' }}>{reason}</Text>
          </TouchableOpacity>
        ))}

        {selectedReason === '기타' && (
          <TextInput
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, minHeight: 60, marginBottom: 20 }}
            placeholder="기타 사유를 입력해주세요."
            multiline
            value={etcReason}
            onChangeText={setEtcReason}
          />
        )}

        <TouchableOpacity style={{ backgroundColor: '#0077b6', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>계정 삭제하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountDeleteComponent;
