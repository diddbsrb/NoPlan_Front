// app/mypage/index.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';

// --- 서비스 및 타입 import ---
import { userService } from '../../service/userService';
import { travelService, VisitedContent } from '../../service/travelService';
// *** 핵심: bookmarkService와 해당 응답 타입을 import 합니다. ***
import { bookmarkService, BookmarkResponse } from '../../service/bookmarkService';

// --- 분리된 컴포넌트 import ---
import TermsComponent from './TermsComponent';
import InfoEditComponent from './InfoEditComponent';
import PasswordChangeComponent from './PasswordChangeComponent';
import AccountDeleteComponent from './AccountDeleteComponent';

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'visited' | 'wishlist' | 'personal'>('visited');
  const [activePersonalScreen, setActivePersonalScreen] = useState<'terms' | 'edit' | 'password' | 'delete'>('terms');
  
  // --- 상태 관리 ---
  const [userName, setUserName] = useState('회원');
  const [visitedContents, setVisitedContents] = useState<VisitedContent[]>([]);
  // *** 위시리스트 상태를 BookmarkResponse[] 타입으로 변경합니다. ***
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 사용자 이름 불러오기
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userInfo = await userService.getUserInfo();
        setUserName(userInfo.name ?? '회원');
      } catch (error) {
        console.error("사용자 이름 불러오기 실패:", error);
      }
    };
    fetchUserName();
  }, []);

  // 탭 변경 시 데이터 동적 로딩
  useEffect(() => {
    const fetchDataForTab = async () => {
      if (activeTab !== 'personal') {
        setIsLoading(true);
      }
      
      try {
        if (activeTab === 'visited') {
          const data = await travelService.getVisitedContents();
          setVisitedContents(data);
        } else if (activeTab === 'wishlist') {
          // *** 핵심 변경: bookmarkService.getBookmarks() 호출 ***
          const data = await bookmarkService.getBookmarks();
          setBookmarks(data);
        }
      } catch (error) {
        console.error(`${activeTab} 데이터 불러오기 실패:`, error);
        if (activeTab === 'visited') setVisitedContents([]);
        if (activeTab === 'wishlist') setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataForTab();
  }, [activeTab]);

  // 콘텐츠 렌더링 함수
  const renderContent = () => {
    if (isLoading && activeTab !== 'personal') {
      return <ActivityIndicator size="large" color="#0077b6" style={{ marginTop: 40 }} />;
    }

    // --- 방문한 곳 탭 ---
    if (activeTab === 'visited') {
      if (visitedContents.length === 0) {
        return <Text style={styles.placeholderText}>아직 방문 기록이 없어요.</Text>;
      }
      return visitedContents.map((content) => (
        <View key={content.content_id} style={styles.card}>
          <Text style={styles.cardTitle}>{content.title}</Text>
          <Text style={styles.locationText}>{content.addr1}</Text>
          <View style={styles.imageBox}>
            <Image
              source={{ uri: content.first_image }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </View>
      ));
    }

    // --- 위시리스트 탭 ---
    if (activeTab === 'wishlist') {
      if (bookmarks.length === 0) {
        return <Text style={styles.placeholderText}>위시리스트(북마크)가 비어있어요.</Text>;
      }
      // *** bookmark 데이터를 사용하여 카드를 렌더링합니다. ***
      return bookmarks.map((bookmark) => (
        <View key={bookmark.id} style={styles.card}>
          <Text style={styles.cardTitle}>{bookmark.title}</Text>
          <Text style={styles.locationText}>{bookmark.addr1}</Text>
          <View style={styles.imageBox}>
            <Image
              source={{ uri: bookmark.firstImage }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        </View>
      ));
    }

    // --- 개인정보 관리 탭 ---
    if (activeTab === 'personal') {
      return (
        <>
          {activePersonalScreen === 'terms' && <TermsComponent onEdit={() => setActivePersonalScreen('edit')} />}
          {activePersonalScreen === 'edit' && <InfoEditComponent onBack={() => setActivePersonalScreen('terms')} onPassword={() => setActivePersonalScreen('password')} onDelete={() => setActivePersonalScreen('delete')} />}
          {activePersonalScreen === 'password' && <PasswordChangeComponent onBack={() => setActivePersonalScreen('edit')} />}
          {activePersonalScreen === 'delete' && <AccountDeleteComponent onBack={() => setActivePersonalScreen('edit')} />}
        </>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <CustomTopBar title="내 정보" onBack={() => router.back()} showProfile={false} />

      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{userName}님의 기억</Text>
      </View>

      <View style={styles.tabWrapper}>
        {(['visited', 'wishlist', 'personal'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {{ visited: '방문한 곳', wishlist: '위시리스트', personal: '개인정보 관리' }[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {renderContent()}
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  imageBox: {
    width: screenWidth - 40,
    height: 180,
    backgroundColor: '#eef5ff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
});