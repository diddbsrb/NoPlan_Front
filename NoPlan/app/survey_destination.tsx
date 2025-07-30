// app/survey_destination.tsx
import React, { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import CustomTopBar from './(components)/CustomTopBar';
import * as Location from 'expo-location';
import { useTravelSurvey } from './(components)/TravelSurveyContext';

const DEST_OPTIONS = [
  { label: '식당', image: require('../assets/images/식당.jpg') },
  { label: '카페', image: require('../assets/images/카페.jpg') },
  { label: '숙소', image: require('../assets/images/숙소.jpg') },
  { label: '관광지', image: require('../assets/images/관광지.jpg') },
];


export default function SurveyDestination() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const { survey, setSurvey } = useTravelSurvey();
  const [loading, setLoading] = useState(false);

  // 화면에 포커스될 때마다 선택 초기화
  useFocusEffect(
    useCallback(() => {
      setSelected(null);
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar onBack={() => router.back()} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={styles.title}>
          다음은 <Text style={{ color: '#4AB7C8' }}>어디로</Text> 가볼까요?
        </Text>
        <Text style={styles.desc}>다음 행선지를 선택해주세요.</Text>
        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {DEST_OPTIONS.map((option, idx) => (
            <TouchableOpacity
              key={option.label}
              style={[styles.option, selected === idx && styles.selectedOption]}
              onPress={() => setSelected(idx)}
              activeOpacity={0.8}
            >
              <Image source={option.image} style={styles.optionImage} resizeMode="cover" />
              <View style={styles.overlay} />
              <Text style={styles.optionLabel}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <TouchableOpacity
        style={[
          styles.nextButton,
          { backgroundColor: selected !== null ? '#F2FAFC' : '#E0E0E0' },
        ]}
        disabled={selected === null || loading}
        onPress={async () => {
          if (selected !== null) {
            setLoading(true);
            try {
              // 현재 위치 받아서 글로벌 상태에 업데이트
              let { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') throw new Error('위치 권한이 필요합니다.');
              let location = await Location.getCurrentPositionAsync({});
              const newSurvey = {
                ...survey,
                mapX: location.coords.longitude,
                mapY: location.coords.latitude,
              };
              console.log('[survey_destination] setSurvey request body:', newSurvey);
              setSurvey(newSurvey);
              // 목적지별 API type 매핑
              const typeMap = ['restaurants', 'cafes', 'accommodations', 'attractions'];
              const type = typeMap[selected];
              router.replace({ pathname: '/list', params: { type } });
            } catch (e) {
              alert('위치 정보를 가져올 수 없습니다.');
            } finally {
              setLoading(false);
            }
          }
        }}
      >
        <Text style={{ color: '#A3D8E3', fontWeight: 'bold', fontSize: 18 }}>{loading ? '위치 확인 중...' : '다음'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  option: {
    width: '47%',
    aspectRatio: 0.45,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#A3D8E3',
  },
  optionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
  },
  optionLabel: {
    position: 'absolute',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    alignSelf: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    top: '40%',
  },
  nextButton: {
    borderRadius: 8,
    marginHorizontal: 32,
    marginBottom: 100,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A3D8E3',
  },
});
