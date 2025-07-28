// app/list.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';

const DEFAULT_IMAGES = {
  restaurants: require('../../assets/images/식당.jpg'),
  cafes: require('../../assets/images/카페.jpg'),
  accommodations: require('../../assets/images/숙소.jpg'),
  attractions: require('../../assets/images/관광지.jpg'),
};

export default function List() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!type) return;
    setLoading(true);
    setError(null);
    // 임시 좌표: 서울시청 (126.9778, 37.5665), 반경 10000m
    const mapX = 126.9778;
    const mapY = 37.5665;
    const radius = 10000;
    fetch(`https://no-plan.cloud/api/v1/tours/${type}/?mapX=${mapX}&mapY=${mapY}&radius=${radius}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlaces(data.slice(0, 5));
        } else {
          setPlaces([]);
        }
      })
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [type]);

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
            <TouchableOpacity style={styles.card} activeOpacity={0.85}>
              <Image
                source={item.firstimage ? { uri: item.firstimage } : DEFAULT_IMAGES[type as keyof typeof DEFAULT_IMAGES]}
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
          ListEmptyComponent={
            !loading && !error ? (
              <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>추천 결과가 없습니다.</Text>
            ) : null
          }
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
