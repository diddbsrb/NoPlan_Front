import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomTopBarProps {
  title?: string;
  onBack?: () => void;
  onProfile?: () => void;
  logoSource?: any; // Image source for logo
}

export default function CustomTopBar({
  title = 'NO PLAN',
  onBack,
  onProfile,
  logoSource,
}: CustomTopBarProps) {
  // 기본 로고 경로
  const defaultLogo = require('../../assets/images/noplan_logo_blue.png');
  return (
    <View style={styles.container}>
      {/* Left: Back button */}
      <TouchableOpacity onPress={onBack} style={styles.iconButton} hitSlop={{top:10, bottom:10, left:10, right:10}}>
        <Ionicons name="chevron-back" size={32} color="#39939B" />
      </TouchableOpacity>
      {/* Center: Logo + Title */}
      <View style={styles.centerContainer}>
        <Image source={logoSource || defaultLogo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>{title}</Text>
      </View>
      {/* Right: Profile button */}
      <TouchableOpacity onPress={onProfile} style={styles.iconButton} hitSlop={{top:10, bottom:10, left:10, right:10}}>
        <Ionicons name="person-circle-outline" size={32} color="#39939B" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent', // ← 여기만 수정!
    paddingTop: 55,
    paddingBottom: 17,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // iOS 스타일 그림자
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Android 스타일 그림자
    elevation: 2,
  },
  iconButton: {
    padding: 4,
  },
  centerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    color: '#39939B',
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: '#B2D1D4',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 