import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';
import { useTravelSurvey } from '../(components)/TravelSurveyContext';

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
    survey: { mapX, mapY, radius, adjectives },
  } = useTravelSurvey();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 필수 파라미터 체크 (context에서 숫자로 전달됨)
    if (!type || mapX == null || mapY == null || radius == null) {
      console.warn('⚠️ 필수 파라미터 누락 — fetch 건너뜀', { type, mapX, mapY, radius });
      return;
    }

    let cancelled = false;

    const fetchPlaces = async () => {
      setLoading(true);
      setError(null);

      // adjectives가 문자열로 전달됨
      const adjectiveParam = adjectives || '';

      // URLSearchParams로 안전하게 쿼리 생성
      const params = new URLSearchParams({
        mapX: mapX.toString(),
        mapY: mapY.toString(),
        radius: radius.toString(),
      });
      if (adjectiveParam) params.append('adjectives', adjectiveParam);

      const apiUrl = `https://no-plan.cloud/api/v1/tours/${type}/?${params.toString()}`;
      console.log('🧩 Context survey:', { mapX, mapY, radius, adjectives: adjectiveParam });
      console.log('🔍 Fetching URL:', apiUrl);

      try {
        const response = await fetch(apiUrl);
        console.log('✅ HTTP status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (!cancelled) {
          setPlaces(Array.isArray(data) ? data.slice(0, 5) : []);
        }
      } catch (err) {
        console.error('❌ Fetch error:', err);
        if (!cancelled) setError('목록을 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlaces();
    return () => {
      cancelled = true;
    };
  }, [type, mapX, mapY, radius, adjectives]);

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
          data={places}
          keyExtractor={(_, idx) => idx.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/info',
                  params: { contentid: item.contentid, places: JSON.stringify(places) },
                })
              }
            >
              <Image
                source={
                  item.firstimage
                    ? { uri: item.firstimage }
                    : DEFAULT_IMAGES[type as keyof typeof DEFAULT_IMAGES]
                }
                style={styles.cardImage}
                resizeMode="cover"
              />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardLocationRow}>
                  <Text style={styles.cardLocationIcon}>📍</Text>
                  <Text style={styles.cardLocation}>{item.addr1}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={!loading && !error ? <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>추천 결과가 없습니다.</Text> : null}
          ListFooterComponent={
            <View style={styles.bottomArea}>
              <Text style={styles.bottomDesc}>이 중에서 가고싶은 곳이 없다면?</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => router.replace({ pathname: '/list', params: { type } })}>
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
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 12,
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
    fontWeight: 'bold',
    fontSize: 16,
  },
});
