import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import * as Font from 'expo-font';

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

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
        <Text style={{ color: '#123A86' }}>← 뒤로가기</Text>
      </TouchableOpacity>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#ddd' }}>
        <Text style={{ fontSize: 14, fontFamily: 'Pretendard-Light', fontWeight: 'bold', marginBottom: 10 }}>삭제 전 확인해주세요!</Text>
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
                borderColor: selectedReason === reason ? '#123A86' : '#ccc',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              {selectedReason === reason && (
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#123A86' }} />
              )}
            </View>
            <Text style={{ fontSize: 13, color: selectedReason === reason ? '#123A86' : '#222', fontFamily: 'Pretendard-Light', fontWeight: selectedReason === reason ? 'bold' : 'normal' }}>{reason}</Text>
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

                  <TouchableOpacity style={{ backgroundColor: '#123A86', borderRadius: 8, height: 44, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontFamily: 'Pretendard-Light', fontWeight: 'bold' }}>계정 삭제하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountDeleteComponent;
