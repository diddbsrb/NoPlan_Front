// app/(tabs)/list.tsx
import * as Font from 'expo-font';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { ImageAssets } from '../../assets/images/ImageAssets';
import { apiClient } from '../../service/apiClient'; // ⭐️ [수정 1/3] apiClient import 추가

const DEFAULT_IMAGES = {
  restaurants: ImageAssets.default_restaurants,
  cafes: ImageAssets.default_cafes,
  accommodations: ImageAssets.default_accommodations,
  attractions: ImageAssets.default_attractions,
};

export default function List() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [favorites, setFavorites] = useState<{ [contentId: number]: number }>({});
  const [bookmarkLoading, setBookmarkLoading] = useState<{ [contentId: number]: boolean }>({});
  const [retryLoading, setRetryLoading] = useState(false);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];
  const flatListRef = useRef<FlatList>(null);
  
  const loadingMessages = [
    "장소를 불러오는데 최대 약 30초의 시간이 소요됩니다.",
    "AI가 최적의 장소를 찾고 있습니다."
  ];

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
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [loading, fadeAnim]);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
    }
    loadFonts();
  }, []);

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

  useFocusEffect(
    React.useCallback(() => {
      console.log('[List] 화면 포커스됨 - 위치 정보 및 여행 정보 가져오기');
      saveLastScreen('list', { type: finalType });
      
      if (places.length > 0 && !loading && tripParams.mapX !== null) {
        console.log('[List] 이미 데이터가 있고 파라미터가 설정됨, API 호출 생략');
        return;
      }
      
      const loadLocationAndTripInfo = async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('위치 권한', '위치 권한이 필요합니다.');
            return;
          }
          
          const location = await Location.getCurrentPositionAsync({});
          console.log('[List] 위치 정보 확인:', location.coords.latitude, location.coords.longitude);
          
          const trips = await travelService.getTripData();
          if (trips && trips.length > 0) {
            const latest = trips.sort((a, b) => b.id - a.id)[0];
            
            const radiusMap: { [key: string]: number } = {
              '도보': 1000,
              '대중교통': 2000,
              '자가용': 3000,
            };
            const calculatedRadius = radiusMap[latest.transportation || '대중교통'] || 2000;
            
            const newParams = {
              mapX: location.coords.longitude,
              mapY: location.coords.latitude,
              radius: calculatedRadius,
              adjectives: latest.adjectives?.trim() || '',
              transportation: latest.transportation || ''
            };
            
            setTripParams(newParams);
            
            console.log('[List] 모든 파라미터 설정 완료:', newParams);
          } else {
            const defaultParams = {
              mapX: location.coords.longitude,
              mapY: location.coords.latitude,
              radius: 2000,
              adjectives: '',
              transportation: '대중교통'
            };
            
            setTripParams(defaultParams);
            
            console.log('[List] 여행 정보 없음, 기본값으로 설정:', defaultParams);
          }
        } catch (error) {
          console.error('[List] 위치 정보 또는 여행 정보 로드 실패:', error);
          Alert.alert('오류', '필요한 정보를 가져올 수 없습니다.');
        }
      };
      
      loadLocationAndTripInfo();
      
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('[List] 기기 뒤로가기 버튼 눌림 - home_travel로 이동');
        router.replace('/home_travel');
        return true;
      });
      
      return () => {
        backHandler.remove();
      };
    }, [finalType, router])
  );

  useEffect(() => {
    if (places.length > 0 && !loading && tripParams.mapX !== null) {
      console.log('[list.tsx] 이미 데이터가 있고 파라미터가 설정됨, API 호출 생략');
      return;
    }
    
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

    // ⭐️ [수정 2/3] fetchPlaces 함수를 apiClient를 사용하도록 전체 수정
    const fetchPlaces = async () => {
      setError(null);
      setLoading(true);

      const params = {
        mapX: tripParams.mapX!.toString(),
        mapY: tripParams.mapY!.toString(),
        radius: tripParams.radius!.toString(),
        adjectives: tripParams.adjectives!.trim()
      };
      
      const apiUrl = `/tours/${finalType}/`;
      console.log('[list.tsx] API URL:', apiUrl, 'Params:', params);
      
      try {
        const response = await apiClient.get(apiUrl, { params });
        
        console.log('[list.tsx] Response status:', response.status);

        const data = response.data;
        
        if (!cancelled) {
          setPlaces(Array.isArray(data) ? data : []);
          setPageIndex(0);
        }
      } catch (e: any) {
        console.error('[list.tsx] API error:', e.response ? e.response.data : e.message);
        if (!cancelled) {
          const errorMessage = e.response?.data?.detail || e.message || '목록을 불러오지 못했습니다.';
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlaces();
    return () => { cancelled = true; };
  }, [finalType, tripParams.mapX, tripParams.mapY, tripParams.radius, tripParams.adjectives]);

  // ⭐️ [수정 3/3] toggleFavorite 함수의 fetch도 apiClient.get으로 변경
  const toggleFavorite = async (item: any) => {
    const contentId = item.contentid;
    
    if (bookmarkLoading[contentId]) return;
    
    try {
      if (!favorites[contentId]) {
        setBookmarkLoading(prev => ({ ...prev, [contentId]: true }));
        
        let overview = '';
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          // fetch를 apiClient.get으로 변경
          const detailResponse = await apiClient.get(`/tours/detail/${contentId}/`);
          overview = detailResponse.data?.overview || '';
          console.log('[list.tsx] 상세 정보 가져옴:', overview);
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
      setBookmarkLoading(prev => ({ ...prev, [contentId]: false }));
    }
  };

  const totalPages = Math.max(Math.ceil(places.length / 5), 1);
  const displayedPlaces = places.slice(pageIndex * 5, pageIndex * 5 + 5);

  const handleRetry = () => {
    setRetryLoading(true);
    setTimeout(() => {
      const newPageIndex = (pageIndex + 1) % totalPages;
      setPageIndex(newPageIndex);
      setRetryLoading(false);
      
      // 모든 추천 결과를 다 본 후 처음으로 돌아온 경우 알림
      if (newPageIndex === 0 && pageIndex === totalPages - 1) {
        Alert.alert(
          '모든 추천 결과를 확인했습니다.',
          '모든 추천 결과를 다 보셨습니다. 처음 추천 결과로 돌아갑니다.',
          [{ text: '확인', style: 'default' }]
        );
      }
      
      // 스크롤을 최상단으로 이동
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar onBack={() => router.replace('/home_travel')} />
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {loading ? (
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
          <>
            <Text style={styles.title}>
              이런 곳 <Text style={{ color: '#659ECF' }}>어떠세요?</Text>
            </Text>
            <Text style={styles.desc}>클릭 시 상세정보를 볼 수 있습니다</Text>

            {error && <Text style={{ color: 'red', textAlign: 'center', margin: 12 }}>{error}</Text>}

            <FlatList
              ref={flatListRef}
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
                          place: JSON.stringify(item),
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
                !loading && !error && places.length === 0 ? (
                  <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>
                    추천 결과가 없습니다.
                  </Text>
                ) : null
              }
              ListFooterComponent={
                <View style={styles.bottomArea}>
                  <Text style={styles.bottomDesc}>이 중에서 가고싶은 곳이 없다면?</Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={handleRetry}
                    disabled={retryLoading}
                  >
                    <Text style={styles.retryButtonText}>재추천 받기</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </>
        )}
      </View>
      
      {/* 재추천 로딩 모달 */}
      {retryLoading && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ActivityIndicator size="large" color="#659ECF" />
            <Text style={styles.modalText}>재추천 중입니다...</Text>
          </View>
        </View>
      )}
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
    marginBottom: 20,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'Pretendard-Medium',
    color: '#888',
    marginTop: 16,
    textAlign: 'center',
    alignSelf: 'center',
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