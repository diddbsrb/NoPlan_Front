// Info.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  PanResponder,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { bookmarkService } from '../service/bookmarkService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

// 리스트 API에서 내려주는 객체 타입 (필요한 필드만)
interface ListPlace {
  contentid: string;
  title: string;
  addr1: string;
  mapx: string;
  mapy: string;
  firstimage?: string;
  firstimage2?: string;
  recommend_reason: string;
  hashtags: string;
}

interface TourDetail {
  mapx: string;
  mapy: string;
  firstimage?: string;
  firstimage2?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_EXPANDED = 100;
const SHEET_COLLAPSED = SCREEN_HEIGHT - 180;
const MAX_OVERSHOOT = 100;

export default function Info() {
  const router = useRouter();
  const { contentid, places: placesParam } = useLocalSearchParams<{
    contentid: string;
    places: string;
  }>();

  const sheetY = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState<TourDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ latitude: number; longitude: number } | null>(null);

  // 북마크 상태
  const [favorite, setFavorite] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<number | null>(null);

  // 1) 리스트에서 전달받은 placesParam을 파싱
  const listPlaces: ListPlace[] = useMemo(() => {
    if (!placesParam) return [];
    try {
      const decoded = decodeURIComponent(placesParam);
      return JSON.parse(decoded) as ListPlace[];
    } catch {
      return [];
    }
  }, [placesParam]);

  // 2) listPlaces 중 현재 contentid와 일치하는 아이템 찾기
  const current = listPlaces.find(p => p.contentid === contentid);

  // 3) 상세 API 호출
  useEffect(() => {
    if (!contentid) return;
    fetch(`https://www.no-plan.cloud/api/v1/tours/detail/${contentid}/`)
      .then(res => res.json())
      .then((data: TourDetail) => setDetail(data))
      .catch(() => setError('상세 정보를 불러오지 못했습니다.'));
  }, [contentid]);

  // 4) 사용자 위치 권한/좌표
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('위치 권한이 필요합니다.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    })();
  }, []);

  // 5) 초기 북마크 상태 로드
  useEffect(() => {
    (async () => {
      try {
        const existing = await bookmarkService.getBookmarks();
        const found = existing.find(b => b.contentId === Number(contentid));
        if (found) {
          setFavorite(true);
          setBookmarkId(found.id);
        } else {
          setFavorite(false);
          setBookmarkId(null);
        }
      } catch (e) {
        console.error('Failed to load bookmarks on Info:', e);
      }
    })();
  }, [contentid]);

  // 6) 바텀 시트 PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderMove: (_, g) => {
        let newY = SHEET_COLLAPSED + g.dy;
        newY = Math.max(SHEET_EXPANDED, Math.min(newY, SHEET_COLLAPSED + MAX_OVERSHOOT));
        sheetY.setValue(newY);
      },
      onPanResponderRelease: (_, g) => {
        const toValue = g.dy < -50 ? SHEET_EXPANDED : SHEET_COLLAPSED;
        Animated.spring(sheetY, { toValue, bounciness: 6, useNativeDriver: false }).start(() => {
          setIsExpanded(toValue === SHEET_EXPANDED);
        });
      },
    })
  ).current;

  // 북마크 토글
  const toggleFavorite = async () => {
    // 화면에 사용할 데이터
    const imageUri =
      current?.firstimage ||
      current?.firstimage2 ||
      detail?.firstimage ||
      detail?.firstimage2 ||
      '';
    const title = current?.title || '제목 없음';
    const addr1 = current?.addr1 || '';
    const overview = current?.recommend_reason || '';

    try {
      if (!favorite) {
        const res = await bookmarkService.addBookmark({
          contentId: Number(contentid),
          title,
          firstImage: imageUri,
          addr1,
          overview,
        });
        setBookmarkId(res.id);
        setFavorite(true);
        Alert.alert('북마크', '북마크에 추가되었습니다.');
      } else if (bookmarkId) {
        await bookmarkService.deleteBookmark(bookmarkId);
        setBookmarkId(null);
        setFavorite(false);
        Alert.alert('북마크', '북마크에서 제거되었습니다.');
      }
    } catch (err) {
      console.error('Bookmark error:', err);
      Alert.alert('오류', '북마크 처리 중 문제가 발생했습니다.');
    }
  };

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if ((!detail && !current) || !userLoc) {
    return <ActivityIndicator style={styles.loader} size="large" color="#4AB7C8" />;
  }

  // 화면에 사용할 데이터 결정
  const imageUri =
    current?.firstimage ||
    current?.firstimage2 ||
    detail?.firstimage ||
    detail?.firstimage2 ||
    '';
  const title = current?.title || '제목 없음';
  const addr1 = current?.addr1 || '';
  const recommendReason = current?.recommend_reason || '';
  const rawHashtags = current?.hashtags || '';
  const hashtags = rawHashtags
    .split('#')
    .map(t => t.trim())
    .filter(t => t.length > 0);
  const latitude = parseFloat(current?.mapy ?? detail!.mapy);
  const longitude = parseFloat(current?.mapx ?? detail!.mapx);

  return (
    <View style={styles.container}>
      {/* 배경 이미지 */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      </View>

      {/* 요약 카드 */}
      {!isExpanded && (
        <TouchableOpacity style={styles.card} activeOpacity={0.8}>
          <View style={styles.cardContent}>
            <View>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardSubtitle}>{addr1}</Text>
            </View>
            <TouchableOpacity onPress={toggleFavorite}>
              <Text style={[styles.star, favorite && styles.filled]}>
                {favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* 바텀 시트 */}
      <Animated.View style={[styles.sheet, { top: sheetY }]}>
        <View style={styles.handleArea} {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetSubtitle}>{addr1}</Text>
            </View>
            <TouchableOpacity onPress={toggleFavorite}>
              <Text style={[styles.star, favorite && styles.filled]}>
                {favorite ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.sheetContent}>
          {/* 추천 이유 */}
          <Text style={styles.overview}>{recommendReason}</Text>

          {/* 해시태그 */}
          <View style={styles.tagsRow}>
            {hashtags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* 지도 */}
          <View style={styles.mapPreview}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude,
                longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              <Marker coordinate={{ latitude, longitude }} title={title} />
            </MapView>
          </View>

          {/* 버튼 */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                Linking.openURL(`https://map.kakao.com/link/to/${title},${latitude},${longitude}`)
              }
            >
              <Text style={styles.primaryButtonText}>경로 탐색</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => console.log('방문 체크')}>
              <Text style={styles.secondaryButtonText}>방문했어요</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      {/* 뒤로가기 */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },

  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.7,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },

  card: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 5,
  },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  cardSubtitle: { fontSize: 14, color: '#4AB7C8', marginTop: 4, textAlign: 'center' },

  star: { fontSize: 24, color: '#ccc' },
  filled: { color: '#4AB7C8' },

  sheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 10,
  },
  handleArea: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 6, borderRadius: 3, backgroundColor: '#ccc', marginBottom: 6 },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sheetHeaderText: { flex: 1 },

  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'left' },
  sheetSubtitle: { fontSize: 14, color: '#4AB7C8', marginTop: 2, textAlign: 'left' },

  sheetContent: { paddingHorizontal: 16 },
  overview: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 12, marginTop: 8 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  tag: { backgroundColor: '#e0f7fa', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 4 },
  tagText: { fontSize: 12, color: '#00796b' },

  mapPreview: { width: '100%', height: 400, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },

  buttonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4AB7C8',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  primaryButtonText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    borderColor: '#4AB7C8',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  secondaryButtonText: { fontSize: 16, color: '#4AB7C8', fontWeight: '600' },

  backBtn: {
    position: 'absolute',
    top: 40,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 6,
  },
  backText: { fontSize: 24, color: '#4AB7C8' },

  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red' },
});
