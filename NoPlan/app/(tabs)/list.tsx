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
} from 'react-native';
import CustomTopBar from '../(components)/CustomTopBar';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';
import { bookmarkService } from '../../service/bookmarkService';

const DEFAULT_IMAGES = {
  restaurants: require('../../assets/images/식당.jpg'),
  cafes: require('../../assets/images/카페.jpg'),
  accommodations: require('../../assets/images/숙소.jpg'),
  attractions: require('../../assets/images/관광지.jpg'),
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
    try {
      if (!favorites[contentId]) {
        const res = await bookmarkService.addBookmark({
          contentId,
          title: item.title,
          firstImage: item.firstimage || '',
          addr1: item.addr1,
          overview: item.recommend_reason || '',
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
        if (!cancelled) setError('목록을 불러오지 못했습니다.');
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
    setPageIndex(prev => (prev + 1) % totalPages);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar onBack={() => router.replace('/home_travel')} />
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={styles.title}>
          이런 곳 <Text style={{ color: '#4AB7C8' }}>어떠세요?</Text>
        </Text>
        <Text style={styles.desc}>클릭 시 상세정보를 볼 수 있습니다</Text>

        {loading && <ActivityIndicator style={{ margin: 24 }} size="large" color="#A3D8E3" />}
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
                 style={styles.cardImage}
                 resizeMode="cover"
               />
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <TouchableOpacity onPress={() => toggleFavorite(item)}>
                    <Text style={[styles.star, favorites[item.contentid] ? styles.filled : undefined]}>
                      {favorites[item.contentid] ? '★' : '☆'}
                    </Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontFamily: 'Pretendard-Light',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  star: {
    fontSize: 24,
    color: '#ccc',
  },
  filled: {
    color: '#4AB7C8',
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
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Pretendard-Light',
    fontWeight: 'bold',
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
    backgroundColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  retryButtonText: {
    color: '#fff',
    fontFamily: 'Pretendard-Light',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
