// app/mypage/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';  // 경로가 프로젝트에 맞게 되어 있는지 확인

// 분리된 컴포넌트 import
import TermsComponent from './TermsComponent';
import InfoEditComponent from './InfoEditComponent';
import PasswordChangeComponent from './PasswordChangeComponent';
import AccountDeleteComponent from './AccountDeleteComponent';

const PLACES = [
  {
    name: 'Phuket',
    location: 'Thailand, Bangkok',
    image: require('../../assets/images/index_screen.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Bali',
    location: 'Indonesia, Bali',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Santorini',
    location: 'Greece, Cyclades',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Kyoto',
    location: 'Japan, Kyoto',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
];

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'visited' | 'wishlist' | 'personal'>('visited');
  const [activePersonalScreen, setActivePersonalScreen] = useState<
    'terms' | 'edit' | 'password' | 'delete'
  >('terms');

  const memories = [
    { id: 1, title: '여유로웠던 제주' },
    { id: 2, title: '도전적이었던 부산' },
    { id: 3, title: '고즈넉했던 대전' },
  ];

  return (
    <View style={styles.container}>
      {/* 상단 바: 뒤로가기 버튼만, 프로필(마이페이지) 아이콘은 숨깁니다 */}
      <CustomTopBar
        title="내 정보"
        onBack={() => router.back()}
        showProfile={false}
      />

      {/* 타이틀 */}
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>가경님의 기억</Text>
      </View>

      {/* 탭 메뉴 */}
      <View style={styles.tabWrapper}>
        {(['visited', 'wishlist', 'personal'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {{
                visited: '방문한 곳',
                wishlist: '위시리스트',
                personal: '개인정보 관리',
              }[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 콘텐츠 */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {activeTab === 'visited' &&
          memories.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.imageBox} />
            </View>
          ))}

        {activeTab === 'wishlist' && (
          <>
            {PLACES.length === 0 ? (
              <Text style={styles.placeholderText}>위시리스트가 비어 있습니다.</Text>
            ) : (
              PLACES.map((place, idx) => (
                <View key={idx} style={styles.card}>
                  <Text style={styles.cardTitle}>{place.name}</Text>
                  <Text style={styles.locationText}>{place.location}</Text>
                  <View style={styles.imageBox}>
                    <Image
                      source={place.image}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'personal' && (
          <>
            {activePersonalScreen === 'terms' && (
              <TermsComponent onEdit={() => setActivePersonalScreen('edit')} />
            )}
            {activePersonalScreen === 'edit' && (
              <InfoEditComponent
                onBack={() => setActivePersonalScreen('terms')}
                onPassword={() => setActivePersonalScreen('password')}
                onDelete={() => setActivePersonalScreen('delete')}
              />
            )}
            {activePersonalScreen === 'password' && (
              <PasswordChangeComponent onBack={() => setActivePersonalScreen('edit')} />
            )}
            {activePersonalScreen === 'delete' && (
              <AccountDeleteComponent onBack={() => setActivePersonalScreen('edit')} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  tabButtonActive: {
    backgroundColor: '#d6ebf8',
  },
  tabText: {
    fontSize: 13,
    color: '#555',
  },
  tabTextActive: {
    color: '#0077b6',
    fontWeight: '600',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  card: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    marginBottom: 15,
    fontSize: 15,
  },
  imageBox: {
    width: screenWidth - 40,
    height: 120,
    backgroundColor: '#eef5ff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  locationText: {
    color: '#888',
    marginBottom: 8,
  },
});
