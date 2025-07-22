import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { RadioGroup } from 'react-native-radio-buttons-group';
import { useRouter } from 'expo-router'; // ✅ 추가

const InfoInputScreen = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedGenderId, setSelectedGenderId] = useState<string | undefined>(undefined);
  const router = useRouter(); // ✅ 추가

  const genderOptions = [
    { id: '1', label: '남성', value: '남' },
    { id: '2', label: '여성', value: '여' },
  ];

  const handleStart = () => {
    const selected = genderOptions.find((item) => item.id === selectedGenderId);
    const gender = selected?.value || '';
    console.log('이름:', name);
    console.log('나이:', age);
    console.log('성별:', gender);
    router.push('/(tabs)/home'); // ✅ home.tsx로 이동
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>회원님의 정보를 알려주세요!</Text>
      <Text style={styles.subtitle}>NoPlan의 첫 시작을 환영합니다.</Text>
      <Text style={styles.description}>
        사용자의 정보를 입력해주시면 NoPlan을 더 잘 즐길 수 있습니다.
      </Text>

      <TextInput
        placeholder="이름"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="나이"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
        style={styles.input}
      />

      <View style={styles.radioContainer}>
        <RadioGroup
          radioButtons={genderOptions}
          selectedId={selectedGenderId}
          onPress={setSelectedGenderId}
          layout="row"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>여행 시작하기</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>해당 과정은 첫 실행 한 번만 진행됩니다.</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 130,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  description: {
    fontSize: 11,
    color: '#999',
    marginBottom: 35,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fafafa',
    fontSize: 14,
  },
  radioContainer: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#e0f0ff',
    borderRadius: 22,
    height: 44,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '500',
  },
  footer: {
    fontSize: 11,
    color: '#aaa',
    position: 'absolute',
    bottom: 30,
    textAlign: 'center',
  },
});

export default InfoInputScreen;
