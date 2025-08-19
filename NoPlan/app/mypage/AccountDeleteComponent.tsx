import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as Font from 'expo-font';
import { userService } from '../../service/userService';
import { useRouter } from 'expo-router';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  // 회원 탈퇴 처리
  const handleDeleteAccount = async () => {
    if (!selectedReason) {
      Alert.alert('알림', '탈퇴 사유를 선택해주세요.');
      return;
    }

    if (selectedReason === '기타' && !etcReason.trim()) {
      Alert.alert('알림', '기타 사유를 입력해주세요.');
      return;
    }

    Alert.alert(
      '회원 탈퇴',
      '정말로 탈퇴하시겠습니까?\n모든 데이터가 영구적으로 삭제되며 복구가 불가능합니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await userService.withdrawAccount();
              Alert.alert(
                '탈퇴 완료',
                '회원 탈퇴가 성공적으로 처리되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: () => {
                      // index 페이지로 이동
                      router.replace('/');
                    }
                  }
                ]
              );
            } catch (error: any) {
              console.error('회원 탈퇴 실패:', error);
              Alert.alert(
                '오류',
                '회원 탈퇴 처리 중 오류가 발생했습니다. 다시 시도해주세요.'
              );
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 10 }}>
        <Text style={{ color: '#123A86' }}>← 뒤로가기</Text>
      </TouchableOpacity>
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#ddd' }}>
        <Text style={{ fontSize: 14, fontFamily: 'Pretendard-Medium', marginBottom: 10 }}>삭제 전 확인해주세요!</Text>
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
                            <Text style={{ fontSize: 13, color: selectedReason === reason ? '#123A86' : '#222', fontFamily: selectedReason === reason ? 'Pretendard-Medium' : 'Pretendard-Light' }}>{reason}</Text>
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

                  <TouchableOpacity 
                    style={{ 
                      backgroundColor: isDeleting ? '#ccc' : '#123A86', 
                      borderRadius: 8, 
                      height: 44, 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                    onPress={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                      <Text style={{ color: '#fff', fontFamily: 'Pretendard-Medium' }}>
                        {isDeleting ? '처리 중...' : '계정 삭제하기'}
                      </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountDeleteComponent;
