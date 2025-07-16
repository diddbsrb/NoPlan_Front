import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions, Animated, PanResponder, Modal } from 'react-native';

const PLACES = [
  {
    name: '경복궁',
    location: '서울 종로구 사직로 161 경복궁',
    image: require('../../assets/images/index_screen.png'),
    description: '경복궁은 한국의 역사와 전통을 생생히 느낄 수 있으며, 도심 속에서 고즈넉한 궁궐의 정취를 만끽할 수 있어 힐니스 여행을 추구하는 당신에게 추천합니다.',
    tags: ['#고즈넉함', '#고궁', '#산책하기좋은'],
    map: require('../../assets/images/partial-react-logo.png'), // 지도 이미지 대체
  },
  // ...다른 장소 추가 가능
];

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHEET_MIN = 120;
const SHEET_MAX = 420;

export default function Info() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sheetY] = useState(new Animated.Value(SHEET_MIN));
  const [modalVisible, setModalVisible] = useState(false);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        let newY = SHEET_MIN + gesture.dy;
        if (newY < SHEET_MIN) newY = SHEET_MIN;
        if (newY > SHEET_MAX) newY = SHEET_MAX;
        sheetY.setValue(newY);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -50) {
          Animated.spring(sheetY, { toValue: SHEET_MIN, useNativeDriver: false }).start();
        } else if (gesture.dy > 50) {
          Animated.spring(sheetY, { toValue: SHEET_MAX, useNativeDriver: false }).start();
        } else {
          Animated.spring(sheetY, { toValue: (sheetY as any).__getValue() < (SHEET_MIN + SHEET_MAX) / 2 ? SHEET_MIN : SHEET_MAX, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const place = PLACES[currentIdx];

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      {/* 상단 이미지 슬라이드 */}
      <FlatList
        data={PLACES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentIdx(idx);
        }}
        renderItem={({ item }) => (
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        )}
        style={{ flexGrow: 0 }}
      />
      {/* 인디케이터 */}
      <View style={styles.indicatorRow}>
        {PLACES.map((_, idx) => (
          <View key={idx} style={[styles.indicatorDot, currentIdx === idx && styles.indicatorDotActive]} />
        ))}
      </View>
      {/* 바텀시트 카드 */}
      <Animated.View
        style={[
          styles.sheet,
          {
            top: sheetY,
            height: SHEET_MAX,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sheetHandle} />
        {/* 축소 상태: 장소명/위치 */}
        <View style={styles.sheetHeader}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeLocation}>{place.location}</Text>
        </View>
        {/* 확장 상태: 상세정보 */}
        <View style={styles.sheetDetail}>
          <Text style={styles.placeDesc}>{place.description}</Text>
          <View style={styles.tagRow}>
            {place.tags.map(tag => (
              <Text key={tag} style={styles.tag}>{tag}</Text>
            ))}
          </View>
          <Image source={place.map} style={styles.mapImg} resizeMode="cover" />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>경로 탐색</Text></TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.actionBtnText}>방문했어요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      {/* 방문 완료 모달 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>방문 완료!</Text>
            <Text style={styles.modalDesc}>
              현재 추천된 관광지 이력은 저장되지 않습니다.\n정말 방문하셨나요?
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnGray} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnGrayText}>더 볼래요.</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnBlue} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnBlueText}>네 방문했어요.</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 뒤로가기(스택 pop) */}
      <TouchableOpacity style={styles.backBtn} onPress={() => { /* navigation.goBack() */ }}>
        <Text style={{ fontSize: 28, color: '#4AB7C8' }}>{'<'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH,
    height: 340,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
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
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E0E0E0',
    marginBottom: 12,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  placeLocation: {
    fontSize: 14,
    color: '#4AB7C8',
    marginBottom: 8,
  },
  sheetDetail: {
    marginTop: 8,
  },
  placeDesc: {
    fontSize: 15,
    color: '#444',
    marginBottom: 12,
  },
  tagRow: {
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
  mapImg: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#4AB7C8',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
  modalDesc: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtnGray: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingVertical: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  modalBtnGrayText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalBtnBlue: {
    flex: 1,
    backgroundColor: '#4AB7C8',
    borderRadius: 8,
    paddingVertical: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalBtnBlueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 