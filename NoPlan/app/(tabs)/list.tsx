import * as Font from 'expo-font';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';
import { bookmarkService } from '../../service/bookmarkService';
import { travelService } from '../../service/travelService';
import { saveLastScreen } from '../../utils/pushNotificationHelper';

const DEFAULT_IMAGES = {
  restaurants: require('../../assets/images/restaurants_icon.png'),
  cafes: require('../../assets/images/cafes_icon.png'),
  accommodations: require('../../assets/images/accommodations_icon.png'),
  attractions: require('../../assets/images/attractions_icon.png'),
};

export default function List() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  
  // 🆕 필요한 데이터를 하나의 상태로 통합 관리
  const [tripParams, setTripParams] = useState<{
    mapX: number | null;
    mapY: number | null;
    radius: number | null;
    adjectives: string;
    transportation: string;
  }>({
    mapX: null,
    mapY: null,
    radius: null,
    adjectives: '',
    transportation: ''
  });
  
  const finalType = type || 'restaurants';

  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // ✅ 화면 진입 시 로딩 화면 표시
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [favorites, setFavorites] = useState<{ [contentId: number]: number }>({});
  const [bookmarkLoading, setBookmarkLoading] = useState<{ [contentId: number]: boolean }>({});

  // 🆕 로딩 멘트 관련 상태
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];
  
  const loadingMessages = [
    "장소를 불러오는데 최대 약 30초의 시간이 소요됩니다.",
    "AI가 최적의 장소를 찾고 있습니다."
  ];

  // 🆕 로딩 멘트 애니메이션
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 3000); // 3초마다 메시지 변경

      return () => clearInterval(interval);
    }
  }, [loading, fadeAnim]);

  // 폰트 로드
  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
    }
    loadFonts();
  }, []);

  // **화면이 포커스될 때마다 북마크 상태 새로고침**
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        try {
          const existing = await bookmarkService.getBookmarks();
          const map: { [key: number]: number } = {};
          existing.forEach(b => {
            map[b.contentId] = b.id;
          });
          setFavorites(map);
        } catch (e) {
          console.error('Failed to load bookmarks on List:', e);
        }
      })();
    }, [])
  );

  // 🆕 화면이 포커스될 때마다 위치 정보와 여행 정보 가져오기
  useFocusEffect(
    React.useCallback(() => {
      console.log('[List] 화면 포커스됨 - 위치 정보 및 여행 정보 가져오기');
      saveLastScreen('list', { type: finalType });
      
      // 🆕 이미 데이터가 있고 로딩이 완료된 경우에만 API 호출 생략
      if (places.length > 0 && !loading && tripParams.mapX !== null) {
        console.log('[List] 이미 데이터가 있고 파라미터가 설정됨, API 호출 생략');
        return;
      }
      
      const loadLocationAndTripInfo = async () => {
        try {
          // 1. 위치 권한 요청 및 현재 위치 가져오기
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('위치 권한', '위치 권한이 필요합니다.');
            return;
          }
          
          const location = await Location.getCurrentPositionAsync({});
          console.log('[List] 위치 정보 확인:', location.coords.latitude, location.coords.longitude);
          
          // 2. 최신 여행 정보 가져오기 (이동수단, 형용사 등)
          const trips = await travelService.getTripData();
          if (trips && trips.length > 0) {
            const latest = trips.sort((a, b) => b.id - a.id)[0];
            
            // 이동수단에 따른 반경 설정
            const radiusMap: { [key: string]: number } = {
              '도보': 1000,
              '대중교통': 2000,
              '자가용': 3000,
            };
            const calculatedRadius = radiusMap[latest.transportation || '대중교통'] || 2000;
            
            // 🆕 모든 파라미터를 하나의 상태로 통합 저장
            const newParams = {
              mapX: location.coords.longitude,
              mapY: location.coords.latitude,
              radius: calculatedRadius,
              adjectives: latest.adjectives?.trim() || '',
              transportation: latest.transportation || ''
            };
            
            // 🆕 한 번에 모든 상태 업데이트
            setTripParams(newParams);
            
            console.log('[List] 모든 파라미터 설정 완료:', newParams);
          } else {
            // 🆕 여행 정보가 없는 경우에도 위치 정보는 설정
            const defaultParams = {
              mapX: location.coords.longitude,
              mapY: location.coords.latitude,
              radius: 2000,
              adjectives: '',
              transportation: '대중교통'
            };
            
            // 🆕 한 번에 모든 상태 업데이트
            setTripParams(defaultParams);
            
            console.log('[List] 여행 정보 없음, 기본값으로 설정:', defaultParams);
          }
        } catch (error) {
          console.error('[List] 위치 정보 또는 여행 정보 로드 실패:', error);
          Alert.alert('오류', '필요한 정보를 가져올 수 없습니다.');
        }
      };
      
      loadLocationAndTripInfo();
      
      // 뒤로가기 핸들러 설정
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('[List] 기기 뒤로가기 버튼 눌림 - home_travel로 이동');
        router.replace('/home_travel');
        return true;
      });
      
      return () => {
        backHandler.remove();
      };
    }, [finalType, router]) // 🆕 places.length, loading 제거로 불필요한 재실행 방지
  );

  // 🆕 API 호출 useEffect 수정 - 의존성 배열 최적화
  useEffect(() => {
    // 🆕 이미 데이터가 있고 로딩이 완료된 경우에만 API 호출 생략
    if (places.length > 0 && !loading && tripParams.mapX !== null) {
      console.log('[list.tsx] 이미 데이터가 있고 파라미터가 설정됨, API 호출 생략');
      return;
    }
    
    // 🆕 모든 파라미터가 설정되지 않을 경우에만 로그 출력
    if (!finalType || tripParams.mapX == null || tripParams.mapY == null || tripParams.radius == null) {
      console.log('[list.tsx] Missing required params:', { 
        finalType, 
        mapX: tripParams.mapX, 
        mapY: tripParams.mapY, 
        radius: tripParams.radius 
      });
      return;
    }
    
    console.log('[list.tsx] All required params present, proceeding with API call');

    let cancelled = false;

    const fetchPlaces = async () => {
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // 🆕 null 체크 후 안전하게 접근
      const params = new URLSearchParams({
        mapX: tripParams.mapX!.toString(),
        mapY: tripParams.mapY!.toString(),
        radius: tripParams.radius!.toString(),
        adjectives: tripParams.adjectives!.trim()
      });
      
      // // 🆕 adjectives가 있으면 항상 API 파라미터에 포함 (빈칸이 아닌 경우만)
      // if (tripParams.adjectives && tripParams.adjectives.trim() !== '') {
      //   params.append('adjectives', tripParams.adjectives.trim());
      //   console.log('[list.tsx] adjectives 파라미터 추가됨:', tripParams.adjectives.trim());
      // }

      const apiUrl = `https://no-plan.cloud/api/v1/tours/${finalType}/?${params.toString()}`;
      console.log('[list.tsx] API URL:', apiUrl);
      
      try {
        const response = await fetch(apiUrl);
        
        console.log('[list.tsx] Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[list.tsx] API error response:', errorText);
          
          if (errorText.includes('RateLimitError') || response.status === 429) {
            throw new Error('요청이 너무 빈번합니다. 잠시 후 다시 시도해주세요.');
          }
          
          throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 200)}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('[list.tsx] Non-JSON response:', responseText.substring(0, 500));
          throw new Error('API returned non-JSON response');
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          setPlaces(Array.isArray(data) ? data : []);
          setPageIndex(0);
        }
      } catch (e) {
        console.error('[list.tsx] API error:', e);
        if (!cancelled) {
          const errorMessage = e instanceof Error ? e.message : '목록을 불러오지 못했습니다.';
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlaces();
    return () => { cancelled = true; };
  }, [finalType, tripParams.mapX, tripParams.mapY, tripParams.radius, tripParams.adjectives]); // 🆕 필요한 파라미터만 의존성 배열에 포함

  const toggleFavorite = async (item: any) => {
    const contentId = item.contentid;
    
    // 이미 로딩 중이면 무시
    if (bookmarkLoading[contentId]) return;
    
    try {
      if (!favorites[contentId]) {
        // 로딩 상태 시작
        setBookmarkLoading(prev => ({ ...prev, [contentId]: true }));
        
        // 북마크 추가 시 상세 정보 먼저 가져오기
        let overview = '';
        try {
          // Rate Limit 방지를 위한 지연 시간 추가
          await new Promise(resolve => setTimeout(resolve, 500));
          const detailResponse = await fetch(`https://www.no-plan.cloud/api/v1/tours/detail/${contentId}/`);
          if (detailResponse.ok) {
            const detailData = await detailResponse.json();
            overview = detailData.overview || '';
            console.log('[list.tsx] 상세 정보 가져옴:', overview);
          }
        } catch (detailError) {
          console.log('[list.tsx] 상세 정보 가져오기 실패, 빈 문자열 사용:', detailError);
        }

        const res = await bookmarkService.addBookmark({
          contentId,
          title: item.title,
          firstImage: item.firstimage || '',
          addr1: item.addr1,
          overview: overview,
          hashtags: item.hashtags || '',
          recommendReason: item.recommend_reason || '',
          category: finalType as 'restaurants' | 'cafes' | 'attractions' | 'accommodations',
        });
        setFavorites(prev => ({ ...prev, [contentId]: res.id }));
        Alert.alert('북마크', '북마크에 추가되었습니다.');
      } else {
        await bookmarkService.deleteBookmark(favorites[contentId]);
        setFavorites(prev => {
          const next = { ...prev };
          delete next[contentId];
          return next;
        });
        Alert.alert('북마크', '북마크에서 제거되었습니다.');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      Alert.alert('오류', '북마크 처리 중 문제가 발생했습니다.');
    } finally {
      // 로딩 상태 종료
      setBookmarkLoading(prev => ({ ...prev, [contentId]: false }));
    }
  };

  // 페이징 로직
  const totalPages = Math.max(Math.ceil(places.length / 5), 1);
  const displayedPlaces = places.slice(pageIndex * 5, pageIndex * 5 + 5);

  const handleRetry = () => {
    // Rate Limit 방지를 위해 2초 대기 후 재시도
    setTimeout(() => {
      setPageIndex(prev => (prev + 1) % totalPages);
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar onBack={() => router.replace('/home_travel')} />
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {loading ? (
          // 🆕 로딩 중일 때는 로딩 화면만 표시
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingTitle}>잠시만 기다려주세요</Text>
            <ActivityIndicator style={{ marginBottom: 16 }} size="large" color="#659ECF" />
            <Animated.Text 
              style={[
                styles.loadingText,
                { opacity: fadeAnim }
              ]}
            >
              {loadingMessages[currentMessageIndex]}
            </Animated.Text>
          </View>
        ) : (
          // 🆕 로딩 완료 후 나머지 컴포넌트들 표시
          <>
            <Text style={styles.title}>
              이런 곳 <Text style={{ color: '#659ECF' }}>어떠세요?</Text>
            </Text>
            <Text style={styles.desc}>클릭 시 상세정보를 볼 수 있습니다</Text>

            {error && <Text style={{ color: 'red', textAlign: 'center', margin: 12 }}>{error}</Text>}

            <FlatList
              data={displayedPlaces}
              keyExtractor={(_, idx) => idx.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => {
                    try {
                      console.log('[list.tsx] Navigating to info with:', {
                        contentid: item.contentid,
                        placesLength: places.length,
                        item: item
                      });
                      router.push({
                        pathname: '/info',
                        params: { 
                          contentid: item.contentid, 
                          place: JSON.stringify(item), // 클릭한 장소만 전달
                          type: finalType
                        },
                      });
                    } catch (error) {
                      console.error('[list.tsx] Navigation error:', error);
                      Alert.alert('오류', '상세 페이지로 이동할 수 없습니다.');
                    }
                  }}
                >
                  <Image
                    source={
                      item.firstimage
                        ? { uri: item.firstimage }
                        : DEFAULT_IMAGES[finalType as keyof typeof DEFAULT_IMAGES]
                    }
                    style={[
                      styles.cardImage,
                      !item.firstimage && styles.defaultIconImage
                    ]}
                    resizeMode={item.firstimage ? "cover" : "center"}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <TouchableOpacity 
                        onPress={() => toggleFavorite(item)}
                        disabled={bookmarkLoading[item.contentid]}
                      >
                        {bookmarkLoading[item.contentid] ? (
                          <ActivityIndicator size="small" color="#659ECF" />
                        ) : (
                          <Text style={[styles.star, favorites[item.contentid] ? styles.filled : undefined]}>
                            {favorites[item.contentid] ? '★' : '☆'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cardLocationRow}>
                      <Text style={styles.cardLocationIcon}>📍</Text>
                      <Text style={styles.cardLocation}>{item.addr1}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                // 🆕 로딩 중이거나 에러가 있을 때는 빈 결과 메시지를 표시하지 않음
                !loading && !error && places.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
                    추천 결과가 없습니다.
                  </Text>
                ) : null
              }
              ListFooterComponent={
                <View style={styles.bottomArea}>
                  <Text style={styles.bottomDesc}>이 중에서 가고싶은 곳이 없다면?</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                    <Text style={styles.retryButtonText}>재추천 받기</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Medium',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  star: {
    fontSize: 24,
    color: '#ccc',
  },
  filled: {
    color: '#659ECF',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  defaultIconImage: {
    backgroundColor: '#f8f9fa',
    padding: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
    marginBottom: 8,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLocationIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  cardLocation: {
    fontSize: 14,
    color: '#888',
  },
  bottomArea: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 100,
  },
  bottomDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#659ECF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Pretendard-Medium',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Medium',
    color: '#659ECF',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
