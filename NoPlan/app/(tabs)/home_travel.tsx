// app/(tabs)/test.tsx

import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { memo, useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { TravelSurveyData, useTravelSurvey } from '../(components)/TravelSurveyContext';
import {
  travelService,
  Trip,
  VisitedContent,
} from '../../service/travelService';
import { requestUserPermission, saveLastScreen } from '../../utils/pushNotificationHelper';

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
  const { survey, setSurvey, setIsTraveling, isTraveling } = useTravelSurvey();
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationContext, setRecommendationContext] = useState<RecommendationContext | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TripItem | null>(null);

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
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

  // 자동 추천 처리 함수
  const handleAutoRecommendation = async (type: RecommendationType) => {
    setRecommendationLoading(true);
    try {
      // 현재 위치 가져오기
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한', '위치 권한이 필요합니다.');
        return;
      }
      
      // 위치 권한이 허용되면 알림 권한도 함께 요청
      try {
        await requestUserPermission();
        console.log('[home_travel] 알림 권한 요청 완료');
      } catch (error) {
        console.log('[home_travel] 알림 권한 요청 실패:', error);
        // 알림 권한 실패해도 위치 기반 서비스는 계속 진행
      }
      
      const location = await Location.getCurrentPositionAsync({});
      
      // 이동수단에 따른 반경 설정
      const radiusMap: { [key: string]: number } = {
        '도보': 1000,
        '대중교통': 2000,
        '자가용': 3000,
      };
      const radius = radiusMap[survey.transportation || '대중교통'] || 500;
      
      // survey context 업데이트 (자동 추천 타입 포함)
      const newSurvey: TravelSurveyData = {
        ...survey,
        mapX: location.coords.longitude,
        mapY: location.coords.latitude,
        radius,
        adjectives: survey.adjectives || '',
        autoRecommendType: type,
      };
      
      console.log(`[HomeTravel] 🎯 자동 추천 처리: ${type} -> autoRecommendType으로 설정`);
      setSurvey(newSurvey);
      
      // survey_destination.tsx를 거치지 않고 바로 list.tsx로 이동
      router.replace({ pathname: '/list', params: { type } });
    } catch (e) {
      console.error('자동 추천 처리 실패:', e);
      Alert.alert('오류', '위치 정보를 가져올 수 없습니다.');
    } finally {
      setRecommendationLoading(false);
    }
  };

  const fetchData = async () => {
    console.log('[HomeTravel] fetchData 시작');
    setLoading(true);
    setError(null);

    try {
      // 여행 상태 확인 및 설정
      if (!isTraveling) {
        console.log('[home_travel] 여행 상태가 false입니다. true로 설정합니다.');
        await setIsTraveling(true);
      }
      
      // 1) 트립 전체 조회
      const trips = (await travelService.getTripData()) as TripWithDate[];

      if (!trips.length) {
        console.log('[HomeTravel] 트립이 없습니다');
        setError('최근 여정을 찾을 수 없습니다.');
        return;
      }

      // 2) 최신 트립 고르기
      const latest = trips
        .slice()
        .sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

      // 최신 여행 정보로 survey 상태 업데이트
      if (latest) {
        const updatedSurvey = {
          ...survey,
          region: latest.region,
          transportation: latest.transportation || survey.transportation,
          companion: latest.companion || survey.companion,
          adjectives: latest.adjectives || survey.adjectives,
        };
        setSurvey(updatedSurvey);
      }

      // 3) 전체 방문지 조회 → 클라이언트 필터
      const allVisited = (await travelService.getVisitedContents()) as VisitedContentWithDate[];
      const visited = allVisited.filter((c) => c.trip === latest.id);

      if (!visited.length) {
        console.log('[HomeTravel] 최근 여행에 방문지가 없습니다');
      }

      // 4) 시간순 정렬
      visited.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // 추천 컨텍스트 생성
      const recommendationContext = getRecommendationContext(visited);
      setRecommendationContext(recommendationContext);

      // 5) SectionList용 포맷 변환
      const grouped: TripSection[] = [
        {
          date: `${latest.region} (${latest.created_at.split('T')[0]})`,
          data: visited.map((c) => ({
            time: c.created_at.split('T')[1].slice(0, 5),
            place: c.title,
            category: c.category,
            image: c.first_image || undefined, // 빈 문자열이면 undefined로 설정하여 기본 이미지 사용
            // 추가 속성들도 포함
            address: c.addr1,
            overview: c.overview,
            hashtags: c.hashtags,
            recommendReason: c.recommend_reason,
            coordinates: { x: c.mapx, y: c.mapy },
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

  // 컴포넌트 마운트 시에만 실행
  useEffect(() => {
    fetchData();
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
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => router.push({
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
          <Ionicons name="person-circle-outline" size={32} color="#263453" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        {/* 상단 히어로 영역 */}
        <View style={styles.hero}>
                     {/* 중앙 타이틀 */}
                       <View style={styles.heroTextWrap}>
              <Text style={styles.title} numberOfLines={0}>
                안녕하세요.{'\n'}NOPLAN입니다
              </Text>
            </View>
         </View>

         {/* 중앙 아바타 - 히어로 하단에 겹치도록 */}
         <View style={styles.avatarWrap}>
                       <View style={styles.avatarRing}>
              <Image
                source={require('../../assets/images/noplan_logo_blue.png')}
                style={styles.avatar}
              />
            </View>
           <Text style={styles.avatarCaption} numberOfLines={0}>
             {recommendationContext ? recommendationContext.message : '새로운 여행을 시작해보세요'}
           </Text>
         </View>

        {/* 추천 버튼 */}
        {recommendationContext && !loading && !error && (
          <View style={styles.recommendationSection}>
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
          </View>
        )}

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
            <View style={styles.tabIcon}>
              <Text style={styles.tabIconText}>종료</Text>
            </View>
            <Text style={styles.tabLabel}>여행 종료</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={styles.tabItem}
            onPress={() => router.push('/survey_destination')}
          >
            <View style={styles.tabIcon}>
              <Text style={styles.tabIconText}>다음</Text>
            </View>
            <Text style={styles.tabLabel}>다음 행선지</Text>
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
                     // 최신 trip 가져오기
                     const trips = await travelService.getTripData();
                     const latest = trips.sort((a, b) => b.id - a.id)[0];
                     
                     // 여행 요약 생성
                     const summaryData = await travelService.summarizeTrip(latest.id);
                     
                     // summary.tsx로 이동하면서 요약 데이터 전달
                     router.replace({
                       pathname: '/summary',
                       params: { 
                         tripId: latest.id.toString(),
                         summary: summaryData.summary,
                         region: latest.region
                       }
                     });
                   } catch (e) {
                     console.error('여행 요약 생성 실패:', e);
                     // 요약 생성 실패 시에도 여행 상태를 false로 설정
                     await setIsTraveling(false);
                     // 요약 생성 실패 시 바로 홈으로 이동
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
             </ScrollView>
           </View>
         </View>
       </Modal>
    </SafeAreaView>
  );
}

const TabItem = memo(({ label, active = false }: { label: string; active?: boolean }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.tabItem}>
      <View style={styles.tabIcon}>
        <Text style={styles.tabIconText}>
          {label.slice(0, 1)}
        </Text>
      </View>
      <Text style={styles.tabLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

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
            {item.hashtags.split('#').filter(tag => tag.trim()).slice(0, 3).map((tag, index) => (
              <Text key={index} style={styles.cardHashtag}>#{tag.trim()}</Text>
            ))}
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
    height: 200,
    borderBottomLeftRadius: R,
    borderBottomRightRadius: R,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#263453',
  },
  heroTextWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
     title: {
     textAlign: 'center',
     color: '#F4F7FB',
     fontSize: 20,
     lineHeight: 28,
     fontWeight: '800',
     marginBottom: 30, // 아바타와의 간격을 늘려서 글씨가 가려지지 않도록 함
   },
  subtitle: {
    textAlign: 'center',
    color: '#AFC2E2',
    fontSize: 12,
    letterSpacing: 0.2,
  },

  glowWrap: {
    position: 'absolute',
    left: 0, right: 0, bottom: -60,
    alignItems: 'center',
  },
  glowDisc: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F7D4A3',
    opacity: 0.35,
  },

  avatarWrap: {
    alignItems: 'center',
    marginTop: -70,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarCaption: {
    marginTop: 10,
    fontWeight: '700',
    color: '#263453',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  avatarSubCaption: {
    marginTop: 4,
    color: '#7A8AA8',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  recommendationSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  recommendationButton: {
    backgroundColor: '#263453',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
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
         marginBottom: 100, // 하단 버튼과의 간격
       },
       listContent: {
         paddingHorizontal: 20, // 30에서 20으로 줄임
         paddingTop: 12,
         paddingBottom: 20, // 스크롤 컨테이너 하단 여백
         gap: 6, // 12에서 6으로 줄임
       },

  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18, // 14에서 18로 늘림
    alignItems: 'flex-start', // center에서 flex-start로 변경하여 상단 정렬
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    flex: 1, // 우측 공간을 줄이기 위해 flex: 1 추가
    minHeight: 80, // 최소 높이 추가
  },
  cardLeft: { marginRight: 12 },
  cardThumb: { width: 48, height: 48, borderRadius: 12 },
  cardMid: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
  },
  cardTitle: { fontWeight: '800', color: '#263453', fontSize: 14, flex: 1 },
  cardCategory: { 
    color: '#8A9BB6', 
    fontSize: 12,
    marginLeft: 0,
  },
  cardHashtags: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 6,
  },
  cardHashtag: {
    fontSize: 10,
    color: '#7A8AA8',
    backgroundColor: '#F1F4F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardRight: { paddingLeft: 8 }, // 우측 여백 줄임
  chevWrap: {
    width: 28, height: 28, borderRadius: 14, // 크기 줄임
    backgroundColor: '#F1F4F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevText: { color: '#1C2E4A', fontSize: 16, fontWeight: '800' }, // 폰트 크기 줄임

  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 24,
    backgroundColor: '#263453',
    borderRadius: 26,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: { color: '#C4D2EA', fontFamily: 'Pretendard-Medium', fontSize: 14, fontWeight: '700' },
  tabLabel: { color: '#AFC2E2', fontSize: 11, fontWeight: '700' },

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
    width: 280, 
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
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    marginRight: 8 
  },
  modalBtnTextGray: { 
    color: '#888', 
    fontFamily: 'Pretendard-Medium', 
    fontSize: 15 
  },
  modalBtnBlue: { 
    backgroundColor: '#263453', 
    borderRadius: 8, 
    paddingVertical: 10, 
    paddingHorizontal: 18, 
    marginLeft: 8 
  },
  modalBtnTextBlue: { 
    color: '#fff', 
    fontFamily: 'Pretendard-Medium', 
    fontSize: 15 
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
    fontWeight: 'bold',
  },
  placeDetailContent: {
    padding: 20,
  },
  placeHeader: {
    marginBottom: 20,
  },
  placeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263453',
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
    fontWeight: '600',
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

  // 커스텀 상단바 스타일
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingTop: 55,
    paddingBottom: 17,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  helpButton: {
    padding: 4,
  },
  helpIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#F1F4F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#263453',
  },
  helpIcon: {
    color: '#263453',
    fontSize: 20,
    fontWeight: 'bold',
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
    color: '#263453',
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
    backgroundColor: '#263453',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineTime: {
    fontSize: 11,
    color: '#8A9BB6',
    marginTop: 6,
    fontWeight: '600',
    textAlign: 'center',
  },
  timelineLine: {
    width: 2,
    height: 40, // 카드 높이 + gap에 맞춰 60에서 40으로 줄임
    backgroundColor: '#E0E7F0',
    marginTop: 8,
  },
});
