import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';

// 분리된 컴포넌트 import
import TermsComponent from './mypage/TermsComponent';
import InfoEditComponent from './mypage/InfoEditComponent';
import PasswordChangeComponent from './mypage/PasswordChangeComponent';
import AccountDeleteComponent from './mypage/AccountDeleteComponent';

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
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
];

const MyPage = () => {
  const [activeTab, setActiveTab] = useState('visited');
  const [activePersonalScreen, setActivePersonalScreen] = useState('terms'); // 'terms', 'edit', 'password', 'delete'

  const memories = [
    { id: 1, title: '여유로웠던 제주' },
    { id: 2, title: '도전적이었던 부산' },
    { id: 3, title: '고즈넉했던 대전' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <CustomTopBar />

      {/* 타이틀 */}
      <View style={styles.titleWrapper}>
        <Text style={styles.title}>가경님의 기억</Text>
      </View>

      {/* 탭 메뉴 */}
      <View style={styles.tabWrapper}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'visited' && styles.tabButtonActive]}
          onPress={() => setActiveTab('visited')}
        >
          <Text style={[styles.tabText, activeTab === 'visited' && styles.tabTextActive]}>
            방문한 곳
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'wishlist' && styles.tabButtonActive]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.tabTextActive]}>
            가경님의 위시리스트
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'personal' && styles.tabButtonActive]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.tabTextActive]}>
            개인정보 관리
          </Text>
        </TouchableOpacity>
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
                  <Text style={{ color: '#888', marginBottom: 8 }}>{place.location}</Text>
                  <View style={styles.imageBox}>
                    <Image
                      source={place.image}
                      style={{ width: '100%', height: '100%', borderRadius: 12 }}
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
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
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
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  personalTabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  personalTabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  personalTabButtonActive: {
    backgroundColor: '#d6ebf8',
  },
  personalTabText: {
    fontSize: 13,
    color: '#555',
  },
  personalTabTextActive: {
    color: '#0077b6',
    fontWeight: '600',
  },
});

export default MyPage;
