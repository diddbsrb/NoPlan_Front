import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import CustomTopBar from '../components/CustomTopBar';

const DEST_OPTIONS = [
  { label: '식당', image: require('../../assets/images/index_screen.png') },
  { label: '카페', image: require('../../assets/images/noplan_logo_white.png') },
  { label: '숙소', image: require('../../assets/images/splash-icon.png') },
  { label: '관광지', image: require('../../assets/images/icon.png') },
];

export default function SurveyDestination() {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={styles.title}>
          다음은 <Text style={{ color: '#4AB7C8' }}>어디로</Text> 가볼까요?
        </Text>
        <Text style={styles.desc}>다음 행선지를 선택해주세요.</Text>
        <View style={styles.grid}>
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
        </View>
      </View>
      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: selected !== null ? '#F2FAFC' : '#E0E0E0' }]}
        disabled={selected === null}
      >
        <Text style={{ color: '#A3D8E3', fontWeight: 'bold', fontSize: 18 }}>다음</Text>
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
    justifyContent: 'center',
    gap: 16,
    rowGap: 16,
    width: '100%',
    marginBottom: 24,
  },
  option: {
    width: 140,
    height: 120,
    borderRadius: 12,
    margin: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedOption: {
    borderColor: '#A3D8E3',
  },
  optionImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  optionLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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