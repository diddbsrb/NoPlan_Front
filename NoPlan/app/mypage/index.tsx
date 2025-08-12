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
  Modal,
  Alert,
} from 'react-native';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';

// --- 서비스 및 타입 import ---
import { userService } from '../../service/userService';
import { travelService, VisitedContent, Trip } from '../../service/travelService';
import { bookmarkService, BookmarkResponse } from '../../service/bookmarkService';

// --- 분리된 컴포넌트 import ---
import TermsComponent from './TermsComponent';
import InfoEditComponent from './InfoEditComponent';
import PasswordChangeComponent from './PasswordChangeComponent';
import AccountDeleteComponent from './AccountDeleteComponent';

// trip_id를 키로 가지는 그룹화된 데이터 타입 정의
type VisitedTrips = {
  [key: string]: {
    contents: VisitedContent[];
    tripInfo?: Trip;
  };
};

// ★★★ 비어있는 이미지를 대체할 이미지 URL 상수 ★★★
const PLACEHOLDER_IMAGE_URL = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzA3MzBfOTAg%2FMDAxNjkwNjkyMTAzNTk0.fDiLNQxsSwWoqhWaPPENCgnOfw7rBkyA-u8IBq_bqwMg.V7vOgU00XrpbXakUxyF2OLBpxt56NpcmVdNulowZaUIg.JPEG.10sunmusa%2F100a10000000oik97DA2B_C_760_506_Q70.jpg&type=a340';

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'visited' | 'wishlist' | 'personal'>('visited');
  const [activePersonalScreen, setActivePersonalScreen] = useState<'terms' | 'edit' | 'password' | 'delete'>('terms');
  
  // --- 상태 관리 ---
  const [userName, setUserName] = useState('회원');
  const [visitedTrips, setVisitedTrips] = useState<VisitedTrips>({});
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // 팝업(Modal) 관리를 위한 상태
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<{
    contents: VisitedContent[];
    tripInfo?: Trip;
  } | null>(null);

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
          const [visitedData, tripsData] = await Promise.all([
            travelService.getVisitedContents(),
            travelService.getTripData()
          ]);
          
          // ★★★ 핵심 수정 1: 실제 데이터 필드명인 'trip'으로 그룹화합니다 ★★★
          const groupedData = visitedData.reduce((acc, content) => {
            const key = content.trip; // 'trip_id'가 아닌 'trip'
            if (!acc[key]) {
              acc[key] = { contents: [], tripInfo: undefined };
            }
            acc[key].contents.push(content);
            return acc;
          }, {} as VisitedTrips);

          // trip 정보 추가
          tripsData.forEach(trip => {
            if (groupedData[trip.id]) {
              groupedData[trip.id].tripInfo = trip;
            }
          });
          
          setVisitedTrips(groupedData);

        } else if (activeTab === 'wishlist') {
          const data = await bookmarkService.getBookmarks();
          setBookmarks(data);
        }
      } catch (error) {
        console.error(`${activeTab} 데이터 불러오기 실패:`, error);
        if (activeTab === 'visited') setVisitedTrips({});
        if (activeTab === 'wishlist') setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataForTab();
  }, [activeTab]);

  // 여행 카드 클릭 시 팝업을 여는 함수
  const handleTripPress = (tripId: string) => {
    setSelectedTrip(visitedTrips[tripId]);
    setIsModalVisible(true);
  };

  // ★★★ 핵심 1: 북마크 삭제를 처리하는 함수 추가 ★★★
  const handleDeleteBookmark = async (bookmarkId: number) => {
    // 사용자에게 정말 삭제할 것인지 확인을 받습니다.
    Alert.alert(
      "위시리스트 삭제",
      "이 항목을 위시리스트에서 삭제하시겠습니까?",
      [
        // '아니오' 버튼
        {
          text: "아니오",
          style: "cancel"
        },
        // '예' 버튼
        { 
          text: "예", 
          onPress: async () => {
            setIsLoading(true);
            try {
              // bookmarkService를 호출하여 API 요청을 보냅니다.
              await bookmarkService.deleteBookmark(bookmarkId);
              
              // API 요청 성공 시, 화면의 목록(상태)에서도 해당 항목을 제거합니다.
              setBookmarks(currentBookmarks => 
                currentBookmarks.filter(bookmark => bookmark.id !== bookmarkId)
              );
              Alert.alert("성공", "위시리스트에서 삭제되었습니다.");

            } catch (error) {
              console.error("북마크 삭제 실패:", error);
              Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive" // '예' 버튼을 빨간색으로 표시 (iOS)
        }
      ]
    );
  };

  // 콘텐츠 렌더링 함수
  const renderContent = () => {
    if (isLoading && activeTab !== 'personal') {
      return <ActivityIndicator size="large" color="#123A86" style={{ marginTop: 40 }} />;
    }

      // --- 방문한 곳 탭 ---
      if (activeTab === 'visited') {
        const tripIds = Object.keys(visitedTrips);
        if (tripIds.length === 0) {
          return <Text style={styles.placeholderText}>아직 방문 기록이 없어요.</Text>;
        }
        
        return tripIds.map((tripId) => {
          const tripData = visitedTrips[tripId];
          const tripContents = tripData.contents;
          const firstContent = tripContents[0];
          const imageUrl = firstContent.first_image ? firstContent.first_image : PLACEHOLDER_IMAGE_URL;
  
           // ★★★ 핵심 1: 날짜를 이용한 새로운 제목 생성 ★★★
        // created_at 문자열로 Date 객체를 만듭니다.
        const tripDate = new Date(firstContent.created_at);
        // "YYYY년 M월 D일" 형식으로 날짜를 보기 좋게 포맷합니다.
        const formattedDate = `${tripDate.getFullYear()}년 ${tripDate.getMonth() + 1}월 ${tripDate.getDate()}일`;
        // 새로운 제목을 설정합니다.
        const newTitle = `${formattedDate}의 여행`;

        return (
          <TouchableOpacity key={tripId} style={styles.card} onPress={() => handleTripPress(tripId)}>
            {/* ★★★ 핵심 2: 새로 만든 제목과 부제목을 적용합니다 ★★★ */}
            <Text style={styles.cardTitle}>{newTitle}</Text>
            <Text style={styles.locationText}>{`${firstContent.title} 등 ${tripContents.length}곳`}</Text>
            
            <View style={styles.imageBox}>
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>
        );
      });
    }
  
      // --- 위시리스트 탭 ---
      if (activeTab === 'wishlist') {
        if (bookmarks.length === 0) {
          return <Text style={styles.placeholderText}>위시리스트(북마크)가 비어있어요.</Text>;
        }
        return bookmarks.map((bookmark) => {
          const imageUrl = bookmark.firstImage ? bookmark.firstImage : PLACEHOLDER_IMAGE_URL;
          return (
            // ★★★ View에 card 스타일 적용 ★★★
            <View key={bookmark.id} style={styles.card}>
              <Text style={styles.cardTitle}>{bookmark.title}</Text>
              <Text style={styles.locationText}>{bookmark.addr1}</Text>
              {/* ★★★ wishlistImageBox 스타일 적용 ★★★ */}
              <View style={styles.wishlistImageBox}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteBookmark(bookmark.id)}
              >
                <Text style={styles.deleteButtonText}>위시리스트에서 삭제</Text>
              </TouchableOpacity>
            </View>
          );
        });
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

      {/* --- 방문 기록 상세 팝업 (Modal) --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>여행 기록 상세보기</Text>
            <ScrollView>
              {/* 여행 요약 섹션 */}
              {selectedTrip?.tripInfo?.summary && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>여행 요약</Text>
                  <Text style={styles.summaryText}>{selectedTrip.tripInfo.summary}</Text>
                </View>
              )}
              
              {/* 방문한 장소들 */}
              <Text style={styles.visitedPlacesTitle}>방문한 장소들</Text>
              {selectedTrip?.contents.map((content) => {
                // ★★★ 핵심 수정 3: 팝업 내부의 이미지도 안전하게 처리합니다 ★★★
                const imageUrl = content.first_image ? content.first_image : PLACEHOLDER_IMAGE_URL;
                return (
                  <View key={content.content_id} style={styles.modalCard}>
                    <Text style={styles.cardTitle}>{content.title}</Text>
                    <Text style={styles.locationText}>{content.addr1}</Text>
                    <View style={styles.imageBox}>
                      <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;

// ★★★ 이 부분을 전체 교체하세요 ★★★
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
    fontFamily: 'Pretendard-Medium',
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
    color: '#123A86',
    fontFamily: 'Pretendard-Medium',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // --- 핵심 수정: 카드 스타일 ---
  card: {
    marginBottom: 20,
    backgroundColor: '#fff', // 카드에 배경색을 주어 독립된 요소로 만듭니다.
    borderRadius: 16,
    // 그림자 효과를 추가하여 입체감을 줍니다.
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    // 카드 내부의 일관된 여백을 위해 제목에 padding을 추가합니다.
    padding: 15, 
  },
  locationText: {
    fontSize: 13,
    color: '#888',
    // 제목과의 간격을 위해 padding top을 제거하고 bottom만 남깁니다.
    paddingBottom: 15,
    textAlign: 'center',
  },
  imageBox: {
    width: '100%', // 카드 너비에 꽉 채웁니다.
    height: 180,
    // 이미지 박스 자체에 둥근 모서리를 적용합니다 (위쪽만).
    // 이렇게 하면 제목 부분과 부드럽게 이어집니다.
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden', // 이미지가 둥근 모서리를 넘지 않도록 합니다.
  },
  // 위시리스트 카드 내부의 이미지 박스는 제목/주소 아래에 위치하므로 둥글 필요가 없습니다.
  // 이 스타일을 위시리스트의 imageBox에 적용합니다.
  wishlistImageBox: {
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    marginTop: 15,
    marginBottom: 10, // 카드 하단 여백 추가
    alignSelf: 'center', // 버튼을 중앙에 위치시킴
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#ff4d4d',
    borderRadius: 20,
  },
  deleteButtonText: {
    color: 'white',
    fontFamily: 'Pretendard-Medium',
    fontSize: 10,
  },

  // --- 나머지 스타일 (기존과 동일) ---
  placeholderText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: screenWidth * 0.9,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 15,
  },
  modalCard: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#123A86',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  summarySection: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    textAlign: 'justify',
  },
  visitedPlacesTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
  },
});