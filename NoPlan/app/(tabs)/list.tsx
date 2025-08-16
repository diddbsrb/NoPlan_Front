import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
import { bookmarkService } from '../../service/bookmarkService';
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
  const {
    survey,
    setSurvey,
  } = useTravelSurvey();
  const { mapX, mapY, radius, adjectives } = survey;
  
  // 🆕 type 파라미터가 없으면 autoRecommendType 사용
  const finalType = type || survey.autoRecommendType || 'restaurants';

  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  // contentId → bookmarkId 매핑
  const [favorites, setFavorites] = useState<{ [contentId: number]: number }>({});
  const [fontsLoaded, setFontsLoaded] = useState(false);
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
      setFontsLoaded(true);
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

  // 화면이 포커스될 때마다 마지막 화면 정보 저장
  useFocusEffect(
    React.useCallback(() => {
      console.log('[List] 화면 포커스됨 - 마지막 화면 정보 저장');
      saveLastScreen('list', { type: finalType });
    }, [finalType])
  );

  // 🆕 화면이 포커스될 때마다 survey 상태 로깅 및 autoRecommendType 처리
  useFocusEffect(
    React.useCallback(() => {
      console.log('[list.tsx] 화면 포커스됨 - 현재 survey 상태:', {
        transportation: survey.transportation,
        companion: survey.companion,
        region: survey.region,
        mapX: survey.mapX,
        mapY: survey.mapY,
        radius: survey.radius,
        autoRecommendType: survey.autoRecommendType,
        finalType
      });
      
      // 🆕 autoRecommendType이 있으면 자동으로 API 호출
      if (survey.autoRecommendType && survey.mapX && survey.mapY && survey.radius) {
        console.log('[list.tsx] autoRecommendType 감지됨, 자동 API 호출 시작:', survey.autoRecommendType);
        console.log('[list.tsx] finalType:', finalType);
        // autoRecommendType이 있으면 useEffect에서 자동으로 API 호출됨
        // 여기서는 로깅만 하고 실제 처리는 useEffect에서 진행
      }
    }, [survey, finalType])
  );

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

  useEffect(() => {
    console.log('[list.tsx] useEffect triggered with:', {
      type,
      finalType,
      mapX,
      mapY,
      radius
    });
    
    if (!finalType || mapX == null || mapY == null || radius == null) {
      console.log('[list.tsx] Missing required params:', { finalType, mapX, mapY, radius });
      return;
    }
    
    console.log('[list.tsx] All required params present, proceeding with API call');

    let cancelled = false;

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);

      // Rate Limit 방지를 위한 지연 시간 추가
      await new Promise(resolve => setTimeout(resolve, 1000));

      const params = new URLSearchParams({
        mapX: mapX.toString(),
        mapY: mapY.toString(),
        radius: radius.toString(),
      });
      
             // adjectives가 존재하고 비어있지 않을 때만 추가
       if (adjectives && adjectives.trim() !== '') {
         params.append('adjectives', adjectives.trim());
         console.log('[list.tsx] adjectives 파라미터 추가됨:', adjectives.trim());
       }

      const apiUrl = `https://no-plan.cloud/api/v1/tours/${finalType}/?${params.toString()}`;
      console.log('[list.tsx] API URL:', apiUrl);
      
      try {
        const response = await fetch(apiUrl);
        
        // 응답 상태 확인
        console.log('[list.tsx] Response status:', response.status);
        console.log('[list.tsx] Response headers:', response.headers);
        
                 if (!response.ok) {
           // 에러 응답의 내용을 텍스트로 먼저 확인
           const errorText = await response.text();
           console.error('[list.tsx] API error response:', errorText);
           
           // Rate Limit 에러인지 확인
           if (errorText.includes('RateLimitError') || response.status === 429) {
             throw new Error('요청이 너무 빈번합니다. 잠시 후 다시 시도해주세요.');
           }
           
           throw new Error(`API Error: ${response.status} - ${errorText.substring(0, 200)}`);
         }
        
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const responseText = await response.text();
          console.error('[list.tsx] Non-JSON response:', responseText.substring(0, 500));
          throw new Error('API returned non-JSON response');
        }
        
        const data = await response.json();
        console.log('[list.tsx] API response:', data);
        
        if (!cancelled) {
          setPlaces(Array.isArray(data) ? data : []);
          setPageIndex(0);
          
          // 🆕 autoRecommendType이 있었으면 API 호출 완료 후 제거
          if (survey.autoRecommendType) {
            console.log('[list.tsx] autoRecommendType 제거 중:', survey.autoRecommendType);
            const { autoRecommendType, ...surveyWithoutAuto } = survey;
            setSurvey(surveyWithoutAuto);
            console.log('[list.tsx] autoRecommendType 제거 완료');
          }
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
  }, [finalType, mapX, mapY, radius]);

  // 🆕 autoRecommendType이 변경될 때만 API 호출
  useEffect(() => {
    if (survey.autoRecommendType && mapX && mapY && radius) {
      console.log('[list.tsx] autoRecommendType 변경 감지, 자동 API 호출:', survey.autoRecommendType);
      // autoRecommendType이 있으면 자동으로 API 호출
      // 기존 useEffect에서 처리되므로 여기서는 로깅만
    }
  }, [survey.autoRecommendType, mapX, mapY, radius]);

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
            <ActivityIndicator style={{ marginBottom: 16 }} size="large" color="#123A86" />
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
              이런 곳 <Text style={{ color: '#123A86' }}>어떠세요?</Text>
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
                          places: JSON.stringify(places),
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
                          <ActivityIndicator size="small" color="#123A86" />
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
                !loading && !error ? (
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
    color: '#123A86',
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
    backgroundColor: '#123A86',
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
    color: '#123A86',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});
