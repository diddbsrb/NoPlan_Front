import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';

// --- 서비스 및 타입 import ---
import { BookmarkResponse, bookmarkService } from '../../service/bookmarkService';
import { travelService, Trip, VisitedContent } from '../../service/travelService';
import { userService } from '../../service/userService';
// ★★★ 핵심 1: AuthContext import 추가 ★★★

// --- 분리된 컴포넌트 import ---
import AccountDeleteComponent from './AccountDeleteComponent';
import InfoEditComponent from './InfoEditComponent';
import NotificationSettingsComponent from './NotificationSettingsComponent';
import PasswordChangeComponent from './PasswordChangeComponent';
import TermsComponent from './TermsComponent';

type VisitedTrips = {
  [key: string]: {
    contents: VisitedContent[];
    tripInfo?: Trip;
  };
};

// 카테고리별 기본 아이콘
const DEFAULT_ICONS = {
  restaurants: require('../../assets/images/restaurants_icon.png'),
  cafes: require('../../assets/images/cafes_icon.png'),
  accommodations: require('../../assets/images/accommodations_icon.png'),
  attractions: require('../../assets/images/attractions_icon.png'),
};

const PLACEHOLDER_IMAGE_URL = 'https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyMzA3MzBfOTAg%2FMDAxNjkwNjkyMTAzNTk0.fDiLNQxsSwWoqhWaPPENCgnOfw7rBkyA-u8IBq_bqwMg.V7vOgU00XrpbXakUxyF2OLBpxt56NpcmVdNulowZaUIg.JPEG.10sunmusa%2F100a10000000oik97DA2B_C_760_506_Q70.jpg&type=a340';

export default function MyPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'visited' | 'wishlist' | 'personal'>('visited');
  const [activePersonalScreen, setActivePersonalScreen] = useState<'terms' | 'edit' | 'password' | 'delete' | 'notifications'>('edit');
  
  const [userName, setUserName] = useState('회원');
  const [visitedTrips, setVisitedTrips] = useState<VisitedTrips>({});
  const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
        'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<{
    contents: VisitedContent[];
    tripInfo?: Trip;
  } | null>(null);
  
  const [isBookmarkModalVisible, setIsBookmarkModalVisible] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<BookmarkResponse | null>(null);
  
  // 약관 모달 상태 추가
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

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
          
          const groupedData = visitedData.reduce((acc, content) => {
            const key = content.trip; 
            if (!acc[key]) {
              acc[key] = { contents: [], tripInfo: undefined };
            }
            acc[key].contents.push(content);
            return acc;
          }, {} as VisitedTrips);

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

  const handleTripPress = (tripId: string) => {
    setSelectedTrip(visitedTrips[tripId]);
    setIsModalVisible(true);
  };

  const handleBookmarkPress = (bookmark: BookmarkResponse) => {
    setSelectedBookmark(bookmark);
    setIsBookmarkModalVisible(true);
  };

  const handleNavigation = () => {
    if (!selectedBookmark) return;
    const placeName = selectedBookmark.title;
    const encodedPlaceName = encodeURIComponent(placeName);
    const kakaoMapUrl = `https://map.kakao.com/link/search/${encodedPlaceName}`;
    Linking.openURL(kakaoMapUrl);
  };




  const handleDeleteTrip = async (tripId: string) => {
    Alert.alert(
      "여행 기록 삭제",
      "이 여행에 대한 모든 기록이 삭제됩니다. 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          onPress: async () => {
            setIsLoading(true);
            try {
              await travelService.deleteTrip(Number(tripId));
              setVisitedTrips(currentTrips => {
                const newTrips = { ...currentTrips };
                delete newTrips[tripId];
                return newTrips;
              });
              Alert.alert("성공", "여행 기록이 삭제되었습니다.");
            } catch (error) {
              console.error("여행 기록 삭제 실패:", error);
              Alert.alert("오류", "삭제 중 문제가 발생했습니다.");
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    Alert.alert(
      "북마크 취소",
      "북마크를 취소하시겠습니까?",
      [
        { text: "아니오", style: "cancel" },
        { 
          text: "예", 
          onPress: async () => {
            setIsLoading(true);
            try {
              await bookmarkService.deleteBookmark(bookmarkId);
              setBookmarks(currentBookmarks => 
                currentBookmarks.filter(bookmark => bookmark.id !== bookmarkId)
              );
              Alert.alert("성공", "북마크가 취소되었습니다.");
            } catch (error) {
              console.error("북마크 삭제 실패:", error);
              Alert.alert("오류", "취소 중 문제가 발생했습니다.");
            } finally {
              setIsLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const renderContent = () => {
    if (isLoading && activeTab !== 'personal') {
      return <ActivityIndicator size="large" color="#123A86" style={{ marginTop: 40 }} />;
    }

      if (activeTab === 'visited') {
        const tripIds = Object.keys(visitedTrips);
        if (tripIds.length === 0) {
          return <Text style={styles.placeholderText}>아직 여행 기록이 없어요.</Text>;
        }
        
        // 여행 기록을 최신 순으로 정렬 (여행 자체의 순서)
        const sortedTripIds = tripIds.sort((a, b) => {
          const tripA = visitedTrips[a];
          const tripB = visitedTrips[b];
          
          // 각 여행의 모든 콘텐츠 중 가장 최근 날짜를 찾기
          const getLatestDate = (contents: VisitedContent[]) => {
            if (contents.length === 0) return 0;
            return Math.max(...contents.map(content => new Date(content.created_at).getTime()));
          };
          
          const latestDateA = getLatestDate(tripA.contents);
          const latestDateB = getLatestDate(tripB.contents);
          
          // 최신 여행이 위에 오도록 내림차순 정렬
          return latestDateB - latestDateA;
        });
        
        return sortedTripIds.map((tripId) => {
          const tripData = visitedTrips[tripId];
          const tripContents = tripData.contents;
          const firstContent = tripContents[0];
          // 이미지 소스 결정: 실제 이미지가 있으면 사용, 없으면 카테고리별 아이콘 사용
          let imageSource;
          if (firstContent.first_image) {
            imageSource = { uri: firstContent.first_image };
          } else if (firstContent.category && DEFAULT_ICONS[firstContent.category as keyof typeof DEFAULT_ICONS]) {
            imageSource = DEFAULT_ICONS[firstContent.category as keyof typeof DEFAULT_ICONS];
          } else {
            imageSource = DEFAULT_ICONS.attractions; // 기본값
          }
  
          const tripDate = new Date(firstContent.created_at);
          const formattedDate = `${tripDate.getFullYear()}년 ${tripDate.getMonth() + 1}월 ${tripDate.getDate()}일`;
          const newTitle = `${formattedDate}의 여행`;

          return (
            <TouchableOpacity key={tripId} style={styles.card} onPress={() => handleTripPress(tripId)}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{newTitle}</Text>
                  <Text style={styles.locationText}>{`${firstContent.title} 등 ${tripContents.length}곳`}</Text>
                </View>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteTrip(tripId);
                  }}
                  style={styles.deleteTripButton}
                >
                  <Text style={styles.deleteTripButtonText}>삭제</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.wishlistImageBox}>
                <Image 
                  source={imageSource} 
                  style={[
                    styles.image,
                    !firstContent.first_image && styles.defaultIconImage
                  ]} 
                  resizeMode={firstContent.first_image ? "cover" : "center"} 
                />
              </View>
            </TouchableOpacity>
          );
        });
      }
  
      if (activeTab === 'wishlist') {
        if (bookmarks.length === 0) {
          return <Text style={styles.placeholderText}>북마크가 비어있어요.</Text>;
        }
        return bookmarks.map((bookmark) => {
          // 이미지 소스 결정: 실제 이미지가 있으면 사용, 없으면 카테고리별 아이콘 사용
          let imageSource;
          if (bookmark.firstImage) {
            imageSource = { uri: bookmark.firstImage };
          } else if (bookmark.category && DEFAULT_ICONS[bookmark.category as keyof typeof DEFAULT_ICONS]) {
            imageSource = DEFAULT_ICONS[bookmark.category as keyof typeof DEFAULT_ICONS];
          } else {
            imageSource = DEFAULT_ICONS.attractions; // 기본값
          }
          
          return (
            <TouchableOpacity key={bookmark.id} style={styles.card} onPress={() => handleBookmarkPress(bookmark)} activeOpacity={0.8}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>{bookmark.title}</Text>
                  <Text style={styles.locationText}>{bookmark.addr1}</Text>
                </View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleDeleteBookmark(bookmark.id); }} style={styles.starButton}>
                  <Text style={styles.star}>★</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.wishlistImageBox}>
                <Image 
                  source={imageSource} 
                  style={[
                    styles.image,
                    !bookmark.firstImage && styles.defaultIconImage
                  ]} 
                  resizeMode={bookmark.firstImage ? "cover" : "center"} 
                />
              </View>
            </TouchableOpacity>
          );
        });
      }
  
    if (activeTab === 'personal') {
      return (
        <>
          {activePersonalScreen === 'edit' && <InfoEditComponent onBack={() => setActiveTab('visited')} onPassword={() => setActivePersonalScreen('password')} onDelete={() => setActivePersonalScreen('delete')} onTerms={() => setIsTermsModalVisible(true)} onNotifications={() => setActivePersonalScreen('notifications')} />}
          {activePersonalScreen === 'password' && <PasswordChangeComponent onBack={() => setActivePersonalScreen('edit')} />}
          {activePersonalScreen === 'delete' && <AccountDeleteComponent onBack={() => setActivePersonalScreen('edit')} />}
          {activePersonalScreen === 'notifications' && <NotificationSettingsComponent onBack={() => setActivePersonalScreen('edit')} />}
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
              {{ visited: '나의 여행', wishlist: '북마크', personal: '개인정보 관리' }[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {renderContent()}
        </ScrollView>
      </View>

      {/* --- Modals --- */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>여행 기록 상세보기</Text>
            <ScrollView>
              {selectedTrip?.tripInfo?.summary && (
                <View style={styles.summarySection}>
                  <Text style={styles.summaryTitle}>여행 요약</Text>
                  <Text style={styles.summaryText}>{selectedTrip.tripInfo.summary}</Text>
                </View>
              )}
              <Text style={styles.visitedPlacesTitle}>방문한 장소들</Text>
              {selectedTrip?.contents.map((content) => {
                // 이미지 소스 결정: 실제 이미지가 있으면 사용, 없으면 카테고리별 아이콘 사용
                let imageSource;
                if (content.first_image) {
                  imageSource = { uri: content.first_image };
                } else if (content.category && DEFAULT_ICONS[content.category as keyof typeof DEFAULT_ICONS]) {
                  imageSource = DEFAULT_ICONS[content.category as keyof typeof DEFAULT_ICONS];
                } else {
                  imageSource = DEFAULT_ICONS.attractions; // 기본값
                }
                
                return (
                  <View key={content.content_id} style={styles.modalCard}>
                    <Text style={styles.cardTitle}>{content.title}</Text>
                    <Text style={styles.locationText}>{content.addr1}</Text>
                    <View style={styles.imageBox}>
                      <Image 
                        source={imageSource} 
                        style={[
                          styles.image,
                          !content.first_image && styles.defaultIconImage
                        ]} 
                        resizeMode={content.first_image ? "cover" : "center"} 
                      />
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

      <Modal animationType="slide" transparent={true} visible={isBookmarkModalVisible} onRequestClose={() => setIsBookmarkModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedBookmark?.title}</Text>
              <TouchableOpacity style={styles.closeXButton} onPress={() => setIsBookmarkModalVisible(false)}>
                <Text style={styles.closeXText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.bookmarkModalScroll}>
              {/* 북마크 이미지 추가 */}
              {selectedBookmark && (
                <View style={styles.bookmarkImageContainer}>
                  {(() => {
                    let imageSource;
                    if (selectedBookmark.firstImage) {
                      imageSource = { uri: selectedBookmark.firstImage };
                    } else if (selectedBookmark.category && DEFAULT_ICONS[selectedBookmark.category as keyof typeof DEFAULT_ICONS]) {
                      imageSource = DEFAULT_ICONS[selectedBookmark.category as keyof typeof DEFAULT_ICONS];
                    } else {
                      imageSource = DEFAULT_ICONS.attractions; // 기본값
                    }
                    return (
                      <Image 
                        source={imageSource} 
                        style={[
                          styles.bookmarkModalImage,
                          !selectedBookmark.firstImage && styles.defaultIconImage
                        ]} 
                        resizeMode={selectedBookmark.firstImage ? "cover" : "center"} 
                      />
                    );
                  })()}
                </View>
              )}
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>주소</Text>
                <Text style={styles.infoText}>{selectedBookmark?.addr1}</Text>
              </View>
              {selectedBookmark?.hashtags && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>해시태그</Text>
                  <View style={styles.tagsRow}>
                    {selectedBookmark.hashtags.split('#').map((tag, index) => {
                      const trimmedTag = tag.trim();
                      if (trimmedTag.length > 0) {
                        return (
                          <View key={index} style={styles.tag}>
                            <Text style={styles.tagText}>#{trimmedTag}</Text>
                          </View>
                        );
                      }
                      return null;
                    })}
                  </View>
                </View>
              )}
              {selectedBookmark?.recommendReason && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoLabel}>추천 이유</Text>
                  <Text style={styles.infoText}>{selectedBookmark.recommendReason}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.navigationButton} onPress={handleNavigation}>
                <Text style={styles.navigationButtonText}>길찾기</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isTermsModalVisible} onRequestClose={() => setIsTermsModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>개인정보 처리방침</Text>
              <TouchableOpacity style={styles.closeXButton} onPress={() => setIsTermsModalVisible(false)}>
                <Text style={styles.closeXText}>✕</Text>
              </TouchableOpacity>
            </View>
            <TermsComponent onBack={() => setIsTermsModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  titleWrapper: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#F8F9FA'
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
    backgroundColor: '#F8F9FA'
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
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
  card: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'left',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'left',
  },
  wishlistImageBox: {
    width: '100%',
    height: 140,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  defaultIconImage: {
    backgroundColor: '#f8f9fa',
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 24,
    color: '#123A86',
  },
  deleteTripButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FEEBEB',
    borderRadius: 15,
  },
  deleteTripButtonText: {
    color: '#E53E3E',
    fontSize: 12,
    fontFamily: 'Pretendard-Medium',
  },
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
    width: screenWidth * 0.90,
    height: '85%',
    maxHeight: '98%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Medium',
    flex: 1,
    textAlign: 'left',
  },
  imageBox: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
  },
  modalCard: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'flex-start',
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
    alignSelf: 'flex-start'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  closeXButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeXText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'Pretendard-Medium',
  },
  bookmarkModalScroll: {
    maxHeight: 400,
    width: '100%',
  },
  infoSection: {
    marginBottom: 20,
    width: '100%',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e0f7fa',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#00796b',
  },
  navigationButton: {
    backgroundColor: '#123A86',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  navigationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
  },
  bookmarkImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bookmarkModalImage: {
    width: '100%',
    height: '100%',
  },

});