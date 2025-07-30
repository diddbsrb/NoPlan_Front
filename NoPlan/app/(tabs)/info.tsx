// Info.tsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  PanResponder,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const PLACES = [
  {
    name: '경복궁',
    location: '서울 종로구 사직로 161 경복궁',
    image: require('../../assets/images/index_screen.png'),
    description:
      '경복궁은 한국의 역사와 전통을 생생히 느낄 수 있으며, 도심 속에서 고즈넉한 궁궐의 정취를 만끽할 수 있어 힐니스 여행을 추구하는 당신에게 추천합니다.',
    tags: ['#고즈넉함', '#고궁', '#산책하기좋은'],
    map: require('../../assets/images/partial-react-logo.png'),
  },
  // … 추가 장소 …
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// 완전히 펼쳐졌을 때
const SHEET_EXPANDED = 150;
// 접힌(헤더만 보이는) 기본 위치
const SHEET_COLLAPSED = SCREEN_HEIGHT - 200;
// 접힌 상태에서 추가로 당길 수 있는 최대 오버슛
const MAX_OVERSHOOT = 100;

export default function Info() {
  const router = useRouter();
  const { contentid, places } = useLocalSearchParams();
  const parsedPlaces = Array.isArray(places) ? places : JSON.parse(places || '[]');

  const [currentIdx, setCurrentIdx] = useState(0);
  const sheetY = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detail, setDetail] = useState<{ latitude: number; longitude: number; title: string; addr1: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (!contentid) return;

    fetch(`https://www.no-plan.cloud/api/v1/tours/detail/${contentid}/`)
      .then(res => res.json())
      .then(data => setDetail(data))
      .catch(() => setError('상세 정보를 불러오지 못했습니다.'));
  }, [contentid]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('위치 권한이 필요합니다.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,

      onPanResponderMove: (_, g) => {
        // 기본 접힌 위치에서 gesture.dy 만큼
        let newY = SHEET_COLLAPSED + g.dy;
        // 위쪽 한계
        if (newY < SHEET_EXPANDED) newY = SHEET_EXPANDED;
        // 아래쪽 오버슛 한계
        if (newY > SHEET_COLLAPSED + MAX_OVERSHOOT)
          newY = SHEET_COLLAPSED + MAX_OVERSHOOT;

        sheetY.setValue(newY);

        // 중간값 이하로 올라가면 detail 열기
        const mid = (SHEET_EXPANDED + SHEET_COLLAPSED) / 2;
        setIsSheetExpanded(newY <= mid);
      },

      onPanResponderRelease: (_, g) => {
        let toValue: number;

        if (g.dy < -50) {
          // 충분히 위로 스와이프 → 펼침
          toValue = SHEET_EXPANDED;
        } else {
          // 조금이라도 아래로 당기면 → 기본 접힌 위치로 복귀
          toValue = SHEET_COLLAPSED;
        }

        Animated.spring(sheetY, {
          toValue,
          useNativeDriver: false,
          bounciness: 6,
        }).start(() => {
          setIsSheetExpanded(toValue === SHEET_EXPANDED);
        });
      },
    })
  ).current;

  const place = PLACES[currentIdx];

  if (error) {
    return <Text style={{ color: 'red' }}>{error}</Text>;
  }

  if (!userLocation || !detail) {
    return <ActivityIndicator size="large" color="#A3D8E3" />;
  }

  return (
    <View style={styles.container}>
      {/* 이미지 슬라이드 */}
      <FlatList
        data={parsedPlaces}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e =>
          setCurrentIdx(
            Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
          )
        }
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View>
            <Image
              source={item.image}
              style={styles.image}
              resizeMode="cover"
            />
            <Text>{item.title}</Text>
            <Text>{item.addr1}</Text>
            {/* Add more fields as needed */}
          </View>
        )}
      />

      {/* 인디케이터 */}
      <View style={styles.indicatorRow}>
        {PLACES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicatorDot,
              currentIdx === i && styles.indicatorDotActive,
            ]}
          />
        ))}
      </View>

      {/* 바텀 시트 */}
      <Animated.View
        style={[
          styles.sheet,
          {
            top: sheetY,
            height: SCREEN_HEIGHT,    // bottom 대신 height 고정
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sheetHandle} />

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeLocation}>{place.location}</Text>
        </View>

        {/* 상세 */}
        {isSheetExpanded && (
          <ScrollView
            contentContainerStyle={styles.detail}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.desc}>{place.description}</Text>
            <View style={styles.tags}>
              {place.tags.map(tag => (
                <Text key={tag} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>
            <Image
              source={place.map}
              style={styles.map}
              resizeMode="cover"
            />
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>경로 탐색</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.buttonText}>방문했어요</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* 방문완료 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>방문 완료!</Text>
            <Text style={styles.modalText}>
              현재 추천된 관광지 이력은 저장되지 않습니다.{'\n'}
              정말 방문하셨나요?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnGray]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnGrayText}>더 볼래요.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnBlue]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnBlueText}>네 방문했어요.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 지도 */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (userLocation.latitude + detail.latitude) / 2,
          longitude: (userLocation.longitude + detail.longitude) / 2,
          latitudeDelta: Math.abs(userLocation.latitude - detail.latitude) * 2,
          longitudeDelta: Math.abs(userLocation.longitude - detail.longitude) / 2,
        }}
      >
        <Marker
          coordinate={userLocation}
          title="현재 위치"
          description="사용자의 현재 위치"
        />
        <Marker
          coordinate={{ latitude: detail.latitude, longitude: detail.longitude }}
          title={detail.title}
          description={detail.addr1}
        />
      </MapView>

      {/* 뒤로가기 */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7', position: 'relative' },
  image: {
    width: SCREEN_WIDTH,
    height: 600,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  indicatorRow: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#4AB7C8',
  },
  sheet: {
    position: 'absolute',
    left: '7.5%',
    width: '85%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  header: { alignItems: 'center', marginBottom: 8 },
  placeName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  placeLocation: { fontSize: 15, color: '#4AB7C8' },
  detail: { paddingBottom: 24 },
  desc: { fontSize: 15, color: '#444', marginBottom: 12 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F2FAFC',
    color: '#4AB7C8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
    fontSize: 13,
  },
  map: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#4AB7C8',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalBtns: { flexDirection: 'row', width: '100%' },
  modalBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnGray: { backgroundColor: '#F2F2F2', marginRight: 8 },
  modalBtnGrayText: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  modalBtnBlue: { backgroundColor: '#4AB7C8', marginLeft: 8 },
  modalBtnBlueText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  backBtn: {
    position: 'absolute',
    top: 36,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 28, color: '#4AB7C8' },
});
