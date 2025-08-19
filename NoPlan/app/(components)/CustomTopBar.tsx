// components/CustomTopBar.tsx
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CustomTopBarProps {
  title?: string;
  onBack?: () => void;
  onProfile?: () => void;
  logoSource?: any;
  showProfile?: boolean;
}

export default function CustomTopBar({
  title = 'NO PLAN',
  onBack,
  onProfile,
  logoSource,
  showProfile = true,
}: CustomTopBarProps) {
  const router = useRouter();
  const defaultLogo = require('../../assets/images/noplan_logo_blue.png');
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

  const handleProfile = () => {
    if (onProfile) {
      onProfile();
    } else {
      router.push('/mypage');
    }
  };

  return (
    <View style={styles.container}>
      {/* Left: Back button */}
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={32} color="#659ECF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      {/* Center: Logo + Title */}
      <View style={styles.centerContainer}>
        <Image
          source={logoSource || defaultLogo}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Right: Profile button */}
      {showProfile ? (
        <TouchableOpacity
          onPress={handleProfile}
          style={styles.iconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="person" size={28} color="#659ECF" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingTop: 55,
    paddingBottom: 17,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Android shadow
    elevation: 2,
  },
  iconButton: {
    padding: 4,
  },
  iconPlaceholder: {
    width: 32 + 8, // icon size + padding
    height: 32 + 8,
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
    color: '#659ECF',
    fontFamily: 'Pretendard-Medium',
    letterSpacing: 1,
    textShadowColor: '#B2D1D4',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
