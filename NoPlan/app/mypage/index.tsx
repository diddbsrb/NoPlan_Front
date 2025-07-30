// app/mypage/index.tsx
import React, { useState, useEffect } from 'react'; // *** useEffect 추가 ***
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
import CustomTopBar from '../(components)/CustomTopBar';

// *** 사용자 정보 서비스를 import 합니다 ***
import { userService } from '../../service/userService'; 

// 분리된 컴포넌트 import
import TermsComponent from './TermsComponent';
import InfoEditComponent from './InfoEditComponent';
import PasswordChangeComponent from './PasswordChangeComponent';
import AccountDeleteComponent from './AccountDeleteComponent';



export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'visited' | 'wishlist' | 'personal'>('visited');
  const [activePersonalScreen, setActivePersonalScreen] = useState<
    'terms' | 'edit' | 'password' | 'delete'
  >('terms');
  
  // *** 사용자 이름을 저장할 상태 추가 ***
  const [userName, setUserName] = useState('회원'); 

  const memories = [
    { id: 1, title: '여유로웠던 제주' },
    { id: 2, title: '도전적이었던 부산' },
    { id: 3, title: '고즈넉했던 대전' },
  ];

  // *** 컴포넌트가 로드될 때 사용자 정보를 불러오는 useEffect 추가 ***
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const userInfo = await userService.getUserInfo();
        // 이름이 null이나 undefined일 경우를 대비하여 기본값('회원')을 설정합니다.
        setUserName(userInfo.name ?? '회원');
      } catch (error) {
        console.error("사용자 이름 불러오기 실패:", error);
        // 에러 발생 시 기본 이름으로 유지됩니다.
      }
    };

    fetchUserName();
  }, []); // 빈 배열을 전달하여 컴포넌트가 처음 렌더링될 때 한 번만 실행되도록 합니다.

  return (
    <View style={styles.container}>
      <CustomTopBar
        title="내 정보"
        onBack={() => router.back()}
        showProfile={false}
      />

      {/* 타이틀: 상태에 저장된 사용자 이름을 사용하도록 변경 */}
      <View style={styles.titleWrapper}>
        {/* *** 이 부분이 '가경'에서 동적 이름으로 변경됩니다 *** */}
        <Text style={styles.title}>{userName}님의 기억</Text>
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