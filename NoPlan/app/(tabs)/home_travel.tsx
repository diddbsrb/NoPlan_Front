// app/(tabs)/home_travel.tsx

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Font from 'expo-font';
import { useRouter } from 'expo-router';
import { memo, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
import {
  travelService,
  Trip,
  VisitedContent,
} from '../../service/travelService';
import { UserInfo, userService } from '../../service/userService';
import { saveLastScreen } from '../../utils/pushNotificationHelper';
import * as SecureStore from 'expo-secure-store';
import apiClient from '../../service/apiClient';

interface TripWithDate extends Trip {
  created_at: string;
}
interface VisitedContentWithDate extends VisitedContent {
  created_at: string;
}

interface TripItem {
  time: string;
  place: string;
  category?: string;
  image?: string;
  // 추가 속성들도 포함
  address?: string;
  overview?: string;
  hashtags?: string;
  recommendReason?: string;
  coordinates?: { x: string; y: string };
  id?: number; // visited-content 고유 id 추가
}
interface TripSection {
  date: string;
  data: TripItem[];
}

type RecommendationType = 'restaurants' | 'cafes' | 'attractions' | 'accommodations';

interface RecommendationContext {
  currentTime: Date;
  lastVisitedType: string | null;
  recommendationType: RecommendationType;
  message: string;
  buttonText: string;
}

export default function HomeTravel() {
  const router = useRouter();
  const { setIsTraveling, isTraveling } = useTravelSurvey();
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationContext, setRecommendationContext] = useState<RecommendationContext | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TripItem | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TripItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // 🆕 최신 여행 정보를 저장할 상태 추가
  const [latestTripInfo, setLatestTripInfo] = useState<{
    region?: string;
    transportation?: string;
    companion?: string;
    adjectives?: string;
  }>({});
  
  // 🆕 최신 여행 데이터만 저장할 상태 추가
  const [latestTrip, setLatestTrip] = useState<TripWithDate | null>(null);

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
          'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('폰트 로드 실패:', error);
        setFontsLoaded(true); // 폰트 로드 실패해도 계속 진행
      }
    }
    loadFonts();
  }, []);

  // sections 상태 변화를 문자열화해서 로그
  useEffect(() => {
    console.log('[HomeTravel] sections updated:', JSON.stringify(sections, null, 2));
  }, [sections]);

  // 화면이 포커스될 때마다 마지막 화면 정보 저장
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeTravel] 화면 포커스됨 - 마지막 화면 정보 저장');
      saveLastScreen('home_travel');
    }, [])
  );

  // 추천 컨텍스트 생성 함수
  const getRecommendationContext = (visitedContents: VisitedContentWithDate[]): RecommendationContext => {
    const now = new Date();
    const hour = now.getHours();
    
    // 저녁 시간대 (18:00 이후) → 숙소 추천
    if (hour >= 18) {
      return {
        currentTime: now,
        lastVisitedType: null,
        recommendationType: 'accommodations',
        message: '하루가 가고 있어요! 숙소는 정하셨나요?',
        buttonText: '숙소 추천받기'
      };
    }
    
    // 방문 이력이 없음 → 식당 추천
    if (!visitedContents.length) {
      return {
        currentTime: now,
        lastVisitedType: null,
        recommendationType: 'restaurants',
        message: '여행을 시작했어요! 우선 식사부터 하시는 건 어떨까요?',
        buttonText: '식당 추천받기'
      };
    }
    
    // 마지막 방문지의 카테고리 기반 추천
    const lastVisited = visitedContents[visitedContents.length - 1];
    const lastCategory = lastVisited.category || 'attractions';
    
    console.log(`[HomeTravel] 마지막 방문지 카테고리: ${lastCategory} (${lastVisited.title})`);
    
    switch (lastCategory) {
      case 'restaurants':
        return {
          currentTime: now,
          lastVisitedType: 'restaurants',
          recommendationType: 'cafes',
          message: '식사를 마쳤어요! 시원한 커피 한 잔 어떠세요?',
          buttonText: '카페 추천받기'
        };
      case 'cafes':
        return {
          currentTime: now,
          lastVisitedType: 'cafes',
          recommendationType: 'attractions',
          message: '다음엔 관광지를 방문해보아요!',
          buttonText: '관광지 추천받기'
        };
      case 'attractions':
        return {
          currentTime: now,
          lastVisitedType: 'attractions',
          recommendationType: 'restaurants',
          message: '관광을 마쳤어요! 맛있는 식사 어떠세요?',
          buttonText: '식당 추천받기'
        };
      case 'accommodations':
        return {
          currentTime: now,
          lastVisitedType: 'accommodations',
          recommendationType: 'attractions',
          message: '숙소에 도착했어요! 주변 관광지도 둘러보세요!',
          buttonText: '관광지 추천받기'
        };
      default:
        return {
          currentTime: now,
          lastVisitedType: null,
          recommendationType: 'restaurants',
          message: '다음 행선지를 찾아보세요!',
          buttonText: '식당 추천받기'
        };
    }
  };

  // 🆕 자동 추천 처리 함수 수정 - 위치 정보 없이 바로 list로 이동
  const handleAutoRecommendation = async (type: RecommendationType) => {
    try {
      // 🆕 위치 정보 확인 없이 바로 list로 이동
      console.log(`[HomeTravel] 🎯 자동 추천 처리: ${type} -> list로 이동`);
      
      // 🆕 list 페이지에서 위치 정보를 확인하도록 수정
      router.replace({ 
        pathname: '/list', 
        params: { type } 
      });
    } catch (e) {
      console.error('자동 추천 처리 실패:', e);
      Alert.alert('오류', '추천을 처리할 수 없습니다.');
    }
  };

  const fetchData = async () => {
    console.log('[HomeTravel] fetchData 시작');
    setLoading(true);
    setError(null);

    try {
      if (!isTraveling) {
        console.log('[home_travel] 여행 상태가 false입니다. true로 설정합니다.');
        await setIsTraveling(true);
      }
      
      const trips = (await travelService.getTripData()) as TripWithDate[];

      if (!trips.length) {
        console.log('[HomeTravel] 트립이 없습니다');
        setError('최근 여정을 찾을 수 없습니다.');
        return;
      }

      const latest = trips
        .slice()
        .sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      // 🆕 최신 여행 정보를 상태에 저장 (survey context 사용 안함)
      if (latest) {
        setLatestTripInfo({
          region: latest.region,
          transportation: latest.transportation,
          companion: latest.companion,
          adjectives: latest.adjectives,
        });
        setLatestTrip(latest); // 최신 여행 데이터만 저장
      }

      const allVisited = (await travelService.getVisitedContents()) as VisitedContentWithDate[];
      const visited = allVisited.filter((c) => c.trip === latest.id);

      if (!visited.length) {
        console.log('[HomeTravel] 최근 여행에 방문지가 없습니다');
      }

      visited.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const recommendationContext = getRecommendationContext(visited);
      setRecommendationContext(recommendationContext);

      const grouped: TripSection[] = [
        {
          date: `${latest.region} (${latest.created_at.split('T')[0]})`,
          data: visited.map((c) => ({
            time: c.created_at.split('T')[1].slice(0, 5),
            place: c.title,
            category: c.category,
            image: c.first_image || undefined,
            address: c.addr1,
            overview: c.overview,
            hashtags: c.hashtags,
            recommendReason: c.recommend_reason,
            coordinates: { x: c.mapx, y: c.mapy },
            id: c.id, // visited-content 고유 id 추가
          })),
        },
      ];

      setSections(grouped);
    } catch (e) {
      console.error('[HomeTravel] fetchData 에러:', e);
      setError('여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      console.log('[HomeTravel] fetchData 완료');
    }
  };

  // 사용자 정보 가져오기
  const fetchUserInfo = async () => {
    try {
      const userData = await userService.getUserInfo();
      setUserInfo(userData);
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
    }
  };

  // 방문지 삭제 함수
  const deleteVisitedContent = async (itemId: number) => {
    try {
      setDeleting(true);
      console.log(`[HomeTravel] 방문지 삭제 시작: ID ${itemId}`);
      
      const response = await apiClient.delete(`/users/visited-contents/${itemId}/`);
      console.log('[HomeTravel] 삭제 응답:', response.status);

      // 삭제 성공 시 UI 업데이트
      setSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          data: section.data.filter(item => item.id !== itemId)
        }))
      );

      // 삭제 모달과 상세정보 모달 모두 닫기
      setDeleteModalVisible(false);
      setItemToDelete(null);
      setSelectedItem(null); // 상세정보 모달도 닫기
      
      console.log('[HomeTravel] 방문지 삭제 완료');
      Alert.alert('삭제 완료', '방문지가 삭제되었습니다.');
    } catch (error: any) {
      console.error('[HomeTravel] 방문지 삭제 실패:', error);
      console.error('[HomeTravel] 에러 응답:', error.response?.data);
      console.error('[HomeTravel] 에러 상태:', error.response?.status);
      
      let errorMessage = '방문지 삭제에 실패했습니다. 다시 시도해주세요.';
      if (error.response?.status === 401) {
        errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
      } else if (error.response?.status === 404) {
        errorMessage = '삭제할 방문지를 찾을 수 없습니다.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      Alert.alert('삭제 실패', errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  // 삭제 확인 함수
  const handleDeletePress = (item: TripItem) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };

  // 컴포넌트 마운트 시에만 실행
  useEffect(() => {
    fetchData();
    fetchUserInfo();
  }, []);

  // 카테고리별 기본 이미지 설정 (CardItem과 공유)
  const getDefaultImage = (category?: string) => {
    const DEFAULT_IMAGES = {
      restaurants: require('../../assets/images/restaurants_icon.png'),
      cafes: require('../../assets/images/cafes_icon.png'),
      accommodations: require('../../assets/images/accommodations_icon.png'),
      attractions: require('../../assets/images/attractions_icon.png'),
    };

    if (!category) return DEFAULT_IMAGES.attractions;
    
    switch (category) {
      case 'restaurants':
        return DEFAULT_IMAGES.restaurants;
      case 'cafes':
        return DEFAULT_IMAGES.cafes;
      case 'accommodations':
        return DEFAULT_IMAGES.accommodations;
      case 'attractions':
      default:
        return DEFAULT_IMAGES.attractions;
    }
  };

  // 카테고리를 한글로 매핑 (CardItem과 공유)
  const getCategoryDisplayName = (category?: string) => {
    if (!category) return '방문지';
    
    switch (category) {
      case 'restaurants':
        return '식당';
      case 'cafes':
        return '카페';
      case 'accommodations':
        return '숙소';
      case 'attractions':
        return '관광지';
      default:
        return '방문지';
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* 배경 이미지 */}
      <Image
        source={require('../../assets/images/home/bg2.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.replace({
            pathname: '/app_guide',
            params: { from: 'home_travel' }
          })}
        >
          <View style={styles.helpIconContainer}>
            <Text style={styles.helpIcon}>?</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Image
            source={require('../../assets/images/noplan_logo_blue.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
          <Text style={styles.topBarTitle}>NO PLAN</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/mypage')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="person" size={28} color="#659ECF" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* 상단 히어로 영역 */}
        <View style={styles.hero}>
                     {/* 중앙 타이틀 */}
                       <View style={styles.heroTextWrap}>
              <Text style={styles.title} numberOfLines={0}>
                오늘의 여정은 <Text style={styles.highlight}>{(() => {
                  // 🆕 latestTripInfo에서 형용사 가져오기
                  const adjectives = latestTripInfo.adjectives?.split(',').map(adj => adj.trim()).filter(adj => adj) || ['스껄한'];
                  return adjectives[Math.floor(Math.random() * adjectives.length)];
                })()}</Text> 여행이에요 ✨{'\n'}
                <Text style={styles.highlight}>{userInfo?.name || '000'}</Text>님, 즐거운 순간을 함께 만들어가요!
              </Text>
            </View>
         </View>

        {/* 중앙 아바타와 말풍선 */}
        <View style={styles.avatarWrap}>
          <Image
            source={require('../../assets/images/robot.png')}
            style={styles.avatar}
          />
          <View style={styles.speechBubbleContainer}>
            <View style={styles.speechBubbleTriangle} />
            <View style={styles.speechBubble}>
              <Text style={styles.avatarCaption} numberOfLines={0}>
                {recommendationContext ? recommendationContext.message : '새로운 여행을 시작해보세요'}
              </Text>
              
              {/* 추천 버튼을 말풍선 안으로 이동 */}
              {recommendationContext && !loading && !error && (
                <TouchableOpacity
                  style={[
                    styles.recommendationButton,
                    recommendationLoading && styles.recommendationButtonDisabled
                  ]}
                  onPress={() => handleAutoRecommendation(recommendationContext.recommendationType)}
                  disabled={recommendationLoading || loading}
                >
                  <Text style={[
                    styles.recommendationButtonText,
                    recommendationLoading && styles.recommendationButtonTextDisabled
                  ]}>
                    {recommendationLoading ? '위치 확인 중...' : recommendationContext.buttonText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

          {/* 카드 리스트 - 방문한 장소들 */}
          <View style={styles.scrollContainer}>
            <ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              automaticallyAdjustContentInsets={false}
              contentInsetAdjustmentBehavior="never"
              bounces={false}>
             {loading && <Text style={styles.loadingText}>로딩 중...</Text>}
             {error && <Text style={styles.errorText}>{error}</Text>}
             
                        {!loading && !error && sections.length > 0 && sections[0].data.map((item, index) => (
                <View key={index} style={styles.timelineContainer}>
                  {/* 타임라인 점과 선 */}
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineDot} />
                    <Text style={styles.timelineTime}>{item.time}</Text>
                    {index < sections[0].data.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  
                  {/* 카드 아이템 */}
                  <CardItem 
                    item={item} 
                    onPress={() => setSelectedItem(item)}
                    getDefaultImage={getDefaultImage}
                    getCategoryDisplayName={getCategoryDisplayName}
                  />
                </View>
              ))}
             
             {!loading && !error && sections.length === 0 && (
               <Text style={styles.emptyText}>아직 방문한 장소가 없습니다.</Text>
             )}
           </ScrollView>
          </View>

        {/* 하단 내비게이션 바 - 여행 종료, 다음 행선지 */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.tabItem}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.tabIconText}>여행 종료</Text>
          </TouchableOpacity>
          
          {/* 가운데 세로선 */}
          <View style={styles.tabBarDivider} />
          
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.tabItem}
            onPress={() => router.push('/survey_destination')}
          >
            <Text style={styles.tabIconText}>다음 행선지</Text>
          </TouchableOpacity>
        </View>
      </View>

             {/* 종료 모달 */}
       <Modal
         visible={showModal}
         transparent
         animationType="fade"
         onRequestClose={() => setShowModal(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.modalBox}>
             <Text style={styles.modalTitle}>여행을 종료하시겠어요?</Text>
             <Text style={styles.modalDesc}>여행 이력은 마이페이지에 저장됩니다.</Text>
             <View style={styles.modalBtnRow}>
               <TouchableOpacity style={styles.modalBtnGray} onPress={() => setShowModal(false)}>
                 <Text style={styles.modalBtnTextGray}>취소</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={styles.modalBtnBlue}
                 onPress={async () => {
                   setShowModal(false);
                   try {
                     // 🆕 여행 요약 생성 없이 바로 summary 페이지로 이동
                     if (!latestTrip) {
                       throw new Error('여행 정보를 찾을 수 없습니다.');
                     }
                     
                     // 🆕 summary 페이지에서 여행 요약을 생성하도록 수정
                     router.replace({
                       pathname: '/summary',
                       params: { 
                         tripId: latestTrip.id.toString(),
                         region: latestTrip.region
                       }
                     });
                   } catch (e) {
                     console.error('여행 종료 처리 실패:', e);
                     await setIsTraveling(false);
                     router.replace('/home');
                   }
                 }}
               >
                 <Text style={styles.modalBtnTextBlue}>여행 종료</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* 삭제 확인 모달 */}
       <Modal
         visible={deleteModalVisible}
         transparent
         animationType="fade"
         onRequestClose={() => setDeleteModalVisible(false)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.modalBox}>
             <Text style={styles.modalTitle}>방문지를 삭제하시겠어요?</Text>
             <Text style={styles.modalDesc}>
               "{itemToDelete?.place}" 방문지를 삭제합니다.{'\n'}
               삭제된 방문지는 다시 되돌릴 수 없습니다.
             </Text>
             <View style={styles.modalBtnRow}>
               <TouchableOpacity 
                 style={styles.modalBtnGray} 
                 onPress={() => {
                   setDeleteModalVisible(false);
                   setItemToDelete(null);
                 }}
               >
                 <Text style={styles.modalBtnTextGray}>취소</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 style={[styles.modalBtnRed, deleting && styles.modalBtnDisabled]}
                 onPress={() => {
                   if (itemToDelete?.id) {
                     deleteVisitedContent(itemToDelete.id);
                   }
                 }}
                 disabled={deleting}
               >
                 <Text style={[styles.modalBtnTextRed, deleting && styles.modalBtnTextDisabled]}>
                   {deleting ? '삭제 중...' : '삭제'}
                 </Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* 장소 상세 정보 모달 */}
       <Modal
         visible={!!selectedItem}
         transparent
         animationType="fade"
         onRequestClose={() => setSelectedItem(null)}
       >
         <View style={styles.modalOverlay}>
           <View style={styles.placeDetailModal}>
             {/* 상단 이미지 영역 */}
             <View style={styles.placeImageContainer}>
               <Image 
                 source={selectedItem?.image ? { uri: selectedItem.image } : getDefaultImage(selectedItem?.category)} 
                 style={styles.placeImage}
                 resizeMode="cover"
               />
               <TouchableOpacity 
                 style={styles.closeButton} 
                 onPress={() => setSelectedItem(null)}
               >
                 <Text style={styles.closeButtonText}>×</Text>
               </TouchableOpacity>
             </View>

             {/* 상세 정보 영역 */}
             <ScrollView style={styles.placeDetailContent}>
               <View style={styles.placeHeader}>
                 <Text style={styles.placeTitle}>{selectedItem?.place}</Text>
                 <Text style={styles.placeCategory}>
                   {getCategoryDisplayName(selectedItem?.category)}
                 </Text>
               </View>

               {/* 방문 시간 */}
               <View style={styles.placeInfoRow}>
                 <Text style={styles.placeInfoLabel}>방문 시간</Text>
                 <Text style={styles.placeInfoValue}>{selectedItem?.time}</Text>
               </View>

               {/* 주소 */}
               {selectedItem?.address && (
                 <View style={styles.placeInfoRow}>
                   <Text style={styles.placeInfoLabel}>주소</Text>
                   <Text style={styles.placeInfoValue}>{selectedItem.address}</Text>
                 </View>
               )}

               {/* 추천 이유 */}
               {selectedItem?.recommendReason && (
                 <View style={styles.placeInfoRow}>
                   <Text style={styles.placeInfoLabel}>추천 이유</Text>
                   <Text style={styles.placeInfoValue}>{selectedItem.recommendReason}</Text>
                 </View>
               )}

               {/* 해시태그 */}
               {selectedItem?.hashtags && (
                 <View style={styles.placeInfoRow}>
                   <Text style={styles.placeInfoLabel}>해시태그</Text>
                   <View style={styles.hashtagsContainer}>
                     {selectedItem.hashtags.split('#').filter(tag => tag.trim()).map((tag, index) => (
                       <View key={index} style={styles.hashtag}>
                         <Text style={styles.hashtagText}>#{tag.trim()}</Text>
                       </View>
                     ))}
                   </View>
                 </View>
               )}

               {/* 설명 */}
               {selectedItem?.overview && (
                 <View style={styles.placeInfoRow}>
                   <Text style={styles.placeInfoLabel}>설명</Text>
                   <Text style={styles.placeInfoValue}>{selectedItem.overview}</Text>
                 </View>
               )}

               {/* 방문하지 않았어요 버튼 */}
               <View style={styles.deleteButtonContainer}>
                 <TouchableOpacity
                   style={[styles.deleteButtonInModal, deleting && styles.deleteButtonDisabled]}
                   onPress={() => {
                     if (selectedItem?.id) {
                       handleDeletePress(selectedItem);
                     }
                   }}
                   disabled={deleting}
                 >
                   <Text style={[styles.deleteButtonText, deleting && styles.deleteButtonTextDisabled]}>
                     {deleting ? '삭제 중...' : '방문하지 않았어요'}
                   </Text>
                 </TouchableOpacity>
               </View>
             </ScrollView>
           </View>
         </View>
       </Modal>
    </SafeAreaView>
  );
}


const CardItem = memo(({ 
  item, 
  onPress, 
  getDefaultImage, 
  getCategoryDisplayName 
}: { 
  item: TripItem; 
  onPress: () => void;
  getDefaultImage: (category?: string) => any;
  getCategoryDisplayName: (category?: string) => string;
}) => {

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <Image 
          source={item.image ? { uri: item.image } : getDefaultImage(item.category)} 
          style={styles.cardThumb} 
        />
      </View>
      <View style={styles.cardMid}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.place}</Text>
          <Text style={styles.cardCategory}>{getCategoryDisplayName(item.category)}</Text>
        </View>
        {item.hashtags && (
          <View style={styles.cardHashtags}>
            {item.hashtags.split('#').filter(tag => tag.trim()).slice(0, 3).map((tag, index) => {
              const trimmedTag = tag.trim();
              return (
                <Text key={index} style={styles.cardHashtag} numberOfLines={1} ellipsizeMode="tail">
                  #{trimmedTag}
                </Text>
              );
            })}
          </View>
        )}
      </View>
      <View style={styles.cardRight}>
        <View style={styles.chevWrap}>
          <Text style={styles.chevText}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const R = 40;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EEF1F5' },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.4, // 배경 이미지에 낮은 투명도 적용
  },
  container: { flex: 1 },
  loadingContainer: { 
    flex: 1, 
    backgroundColor: '#EEF1F5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center' 
  },
  errorText: { 
    fontSize: 16, 
    color: '#ff4444', 
    textAlign: 'center',
    marginVertical: 20
  },
  emptyText: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center',
    marginVertical: 20
  },

  hero: {
    height: 140,
    borderBottomLeftRadius: R,
    borderBottomRightRadius: R,
    overflow: 'hidden',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 투명도 살짝 올림
  },
  heroTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30, // 글씨를 위로 올리기 위해 음수 마진 추가
    gap: 10,
  },
  title: {
     textAlign: 'center',
     color: '#000000', // 검정색으로 변경
     fontSize: 20,
     lineHeight: 28,
     fontFamily: 'Pretendard-Medium',
     marginBottom: 15, // 아바타와의 간격을 늘려서 글씨가 가려지지 않도록 함
   },
  highlight: {
     color: '#659ECF', // 파란색으로 변경
     fontFamily: 'Pretendard-Medium',
   },
  recommendationMessageWrap: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  recommendationMessage: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 20,
  },


  avatarWrap: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatar: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  speechBubbleContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  speechBubbleTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.85)',
    marginBottom: -1,
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    minWidth: 200,
  },
  avatarCaption: {
    fontFamily: 'Pretendard-Medium',
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },

  recommendationSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  recommendationButton: {
    backgroundColor: '#659ECF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 4,
  },
  recommendationButtonText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
    fontSize: 12,
  },
  recommendationButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  recommendationButtonTextDisabled: {
    color: '#888',
  },

  scrollContainer: {
    flex: 1,
    marginTop: 10, // 말풍선과 방문한 장소 사이 간격 추가
    marginBottom: 95, // 하단 고정 탭바 높이(55) + 여유 공간으로 경계선 상향
  },
  listContent: {
    paddingHorizontal: 20, // 30에서 20으로 줄임
    paddingTop: 12,
    paddingBottom: 20, // 스크롤 컨테이너 하단 여백
    gap: 3, // 6에서 3으로 더 줄임
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 10, // 14에서 10으로 더 줄임
    alignItems: 'flex-start', // center에서 flex-start로 변경하여 상단 정렬
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    flex: 1, // 우측 공간을 줄이기 위해 flex: 1 추가
    minHeight: 60, // 70에서 60으로 더 줄임
  },
  cardLeft: { marginRight: 12 },
  cardThumb: { width: 48, height: 48, borderRadius: 12 },
  cardMid: { 
    flex: 1, 
    maxWidth: '70%', // 최대 너비 제한으로 우측 영역 보호
    marginRight: 8, // 우측 여백 추가
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  cardTitle: { fontFamily: 'Pretendard-Medium', color: '#333', fontSize: 14, flex: 1 },
  cardCategory: { 
    color: '#8A9BB6', 
    fontSize: 12,
    marginLeft: 0,
  },
  cardHashtags: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
    flexWrap: 'wrap', // 줄바꿈 허용
    maxWidth: '100%', // 최대 너비 제한
  },
  cardHashtag: {
    fontSize: 12,
    color: '#7A8AA8',
    backgroundColor: '#F1F4F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: '100%', // 최대 너비 제한
    flexShrink: 1, // 필요시 축소 허용
  },
  cardRight: { 
    paddingLeft: 8, // 우측 여백 줄임
    alignItems: 'center',
    gap: 8, // 화살표와 휴지통 버튼 사이 간격
  },
  chevWrap: {
    width: 28, height: 28, borderRadius: 14, // 크기 줄임
    backgroundColor: '#F1F4F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevText: { color: '#1C2E4A', fontSize: 16, fontFamily: 'Pretendard-Medium' }, // 폰트 크기 줄임
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },

  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 26,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // space-around에서 space-between으로 변경
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  tabItem: { 
    alignItems: 'center', 
    justifyContent: 'center',
    flex: 1, // 전체 너비를 균등하게 분할
    paddingVertical: 15, // 세로 터치 영역 확장
    paddingHorizontal: 20, // 가로 터치 영역 확장
  },
  tabIconText: { color: '#333', fontFamily: 'Pretendard-Medium', fontSize: 15 },
  tabBarDivider: {
    width: 2,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },

  // 모달 스타일
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 28, 
    alignItems: 'center', 
    width: 350, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    elevation: 5 
  },
  modalTitle: { 
    fontSize: 18, 
    fontFamily: 'Pretendard-Medium', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  modalDesc: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 18, 
    textAlign: 'center' 
  },
  modalBtnRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%' 
  },
  modalBtnGray: { 
    backgroundColor: '#E0E0E0', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    marginRight: 4,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTextGray: { 
    color: '#888', 
    fontFamily: 'Pretendard-Medium', 
    fontSize: 15 
  },
  modalBtnBlue: { 
    backgroundColor: '#659ECF', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    marginLeft: 4,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTextBlue: { 
    color: '#fff', 
    fontFamily: 'Pretendard-Medium', 
    fontSize: 15 
  },
  modalBtnRed: { 
    backgroundColor: '#ff4444', 
    borderRadius: 8, 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    marginLeft: 4,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnTextRed: { 
    color: '#fff', 
    fontFamily: 'Pretendard-Medium', 
    fontSize: 15 
  },
  modalBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  modalBtnTextDisabled: {
    color: '#888',
  },

  // 장소 상세 정보 모달 스타일
  placeDetailModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  placeImageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
  },
  placeDetailContent: {
    padding: 20,
  },
  placeHeader: {
    marginBottom: 20,
  },
  placeTitle: {
    fontSize: 24,
    fontFamily: 'Pretendard-Medium',
    color: '#D9BCE',
    marginBottom: 8,
  },
  placeCategory: {
    fontSize: 16,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  placeInfoRow: {
    marginBottom: 16,
  },
  placeInfoLabel: {
    fontSize: 14,
    fontFamily: 'Pretendard-Medium',
    color: '#333',
    marginBottom: 6,
  },
  placeInfoValue: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  hashtagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 30, // 해시태그 아래 여백 추가
  },
  hashtag: {
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  hashtagText: {
    fontSize: 14,
    color: '#00796b',
  },

  // 방문하지 않았어요 버튼 스타일
  deleteButtonContainer: {
    marginTop: 0,
    marginBottom: 30,
    alignItems: 'center',
  },
  deleteButtonInModal: {
    backgroundColor: '#ffcccc',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  deleteButtonText: {
    color: '#cc0000',
    fontFamily: 'Pretendard-Medium',
    fontSize: 16,
  },
  deleteButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  deleteButtonTextDisabled: {
    color: '#888',
  },

  // 커스텀 상단바 스타일
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // 흰색에 투명도 0.85
    paddingTop: 55,
    paddingBottom: 17,
    paddingHorizontal: 16,
    zIndex: 10, // 히어로 위에 표시되도록 zIndex 추가
  },
  helpButton: {
    padding: 4,
  },
  helpIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#659ECF',
  },
  helpIcon: {
    color: '#659ECF',
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBarLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  topBarTitle: {
    fontSize: 22,
    color: '#659ECF',
    fontFamily: 'Pretendard-Medium',
    letterSpacing: 1,
  },
  profileButton: {
    padding: 4,
  },

  // 타임라인 스타일 추가
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    width: 40, // 50에서 40으로 줄임
    alignItems: 'center',
    marginRight: 8, // 12에서 8로 줄임
    marginTop: 24, // 카드의 중간에 위치하도록 14에서 24로 조정
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#659ECF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: '#333',
    marginTop: 6,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
  },
  timelineLine: {
    width: 2,
    height: 40, // 카드 높이 + gap에 맞춰 60에서 40으로 줄임
    backgroundColor: '#E0E7F0',
    marginTop: 8,
  },
});
