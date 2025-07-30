// app/(tabs)/home_travel.tsx

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CustomTopBar from '../(components)/CustomTopBar';
import {
  travelService,
  Trip,
  VisitedContent,
} from '../../service/travelService';

interface TripWithDate extends Trip {
  created_at: string;
}
interface VisitedContentWithDate extends VisitedContent {
  created_at: string;
}

// 타임라인 아이템의 데이터 타입 정의
interface TripItem {
  time: string;
  place: string;
}
interface TripSection {
  date: string;
  data: TripItem[];
}

export default function HomeTravel() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // sections 상태 변화를 문자열화해서 로그
  useEffect(() => {
    console.log('[HomeTravel] sections updated:', JSON.stringify(sections, null, 2));
  }, [sections]);

  const fetchData = async () => {
    console.log('[HomeTravel] fetchData 시작');
    setLoading(true);
    setError(null);

    try {
      // 1) 트립 전체 조회
      const trips = (await travelService.getTripData()) as TripWithDate[];
      console.log('[HomeTravel] trips:', JSON.stringify(trips, null, 2));

      if (!trips.length) {
        console.warn('[HomeTravel] 트립이 없습니다');
        setError('최근 여정을 찾을 수 없습니다.');
        return;
      }

      // 2) 최신 트립 고르기
      const latest = trips
        .slice()
        .sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
      console.log('[HomeTravel] latest trip:', JSON.stringify(latest, null, 2));

      // 3) 전체 방문지 조회 → 클라이언트 필터
      const allVisited = (await travelService.getVisitedContents()) as VisitedContentWithDate[];
      console.log('[HomeTravel] allVisited raw:', JSON.stringify(allVisited, null, 2));

      const visited = allVisited.filter((c) => c.trip === latest.id);
      console.log(
        `[HomeTravel] filtered visited (trip === ${latest.id}):`,
        JSON.stringify(visited, null, 2)
      );

      if (!visited.length) {
        console.warn('[HomeTravel] 해당 trip의 방문지가 없습니다');
      }

      // 4) 시간순 정렬
      visited.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      console.log('[HomeTravel] sorted visited:', JSON.stringify(visited, null, 2));

      // 5) SectionList용 포맷 변환
      const grouped: TripSection[] = [
        {
          date: `${latest.region} (${latest.created_at.split('T')[0]})`,
          data: visited.map((c) => ({
            time: c.created_at.split('T')[1].slice(0, 5),
            place: c.title,
          })),
        },
      ];
      console.log('[HomeTravel] grouped sections:', JSON.stringify(grouped, null, 2));

      setSections(grouped);
    } catch (e) {
      console.error('[HomeTravel] fetchData 에러:', e);
      setError('여행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      console.log('[HomeTravel] fetchData 완료');
    }
  };

  // 화면 포커스될 때마다 호출
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <CustomTopBar />
      <View style={styles.content}>
        <Text style={styles.title}>사용자님!{"\n"}여행은 즐거우신가요?</Text>
        <Text style={styles.subtitle}>사용자님의 행복하고 감성적인 여행이에요.</Text>

        {loading && <Text style={styles.loading}>로딩 중...</Text>}
        {error && <Text style={styles.error}>{error}</Text>}

        <SectionList
          sections={sections}
          keyExtractor={(item, i) => item.place + i}
          renderSectionHeader={({ section: { date } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{date}</Text>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <View style={styles.timelineRow}>
              <View style={styles.timelineCol}>
                <View style={styles.timelineCircle} />
                {index < section.data.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <View style={styles.timelineBox}>
                  <Text style={styles.timelinePlace}>{item.place}</Text>
                </View>
              </View>
            </View>
          )}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* 하단 바 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtnGray} onPress={() => setShowModal(true)}>
          <Text style={styles.bottomBtnTextGray}>여행 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtnBlue}
          onPress={() => router.replace('/survey_destination')}
        >
          <Text style={styles.bottomBtnTextBlue}>다음 행선지</Text>
        </TouchableOpacity>
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
                onPress={() => {
                  setShowModal(false);
                  router.replace('/home');
                }}
              >
                <Text style={styles.modalBtnTextBlue}>여행 종료</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 12 },
  loading: { textAlign: 'center', margin: 16 },
  error: { color: 'red', textAlign: 'center', margin: 8 },
  list: { marginTop: 16 },

  sectionHeader: { marginTop: 18, marginBottom: 8, alignItems: 'flex-start' },
  sectionHeaderText: {
    backgroundColor: '#A3D8E3',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  timelineCol: { width: 24, alignItems: 'center' },
  timelineCircle: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#A3D8E3', marginTop: 4, marginBottom: 2 },
  timelineLine: { width: 2, height: 36, backgroundColor: '#E0E0E0' },
  timelineContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  timelineTime: { fontSize: 13, color: '#3CB4C7', width: 64, marginRight: 6 },
  timelineBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  timelinePlace: { fontSize: 15, color: '#222' },

  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40, // SafeArea 고려하여 조정
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bottomBtnGray: { backgroundColor: '#E0E0E0', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginRight: 8 },
  bottomBtnTextGray: { color: '#888', fontWeight: 'bold', fontSize: 16 },
  bottomBtnBlue: { backgroundColor: '#A3D8E3', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 24, marginLeft: 8 },
  bottomBtnTextBlue: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', width: 280, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: '#666', marginBottom: 18, textAlign: 'center' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalBtnGray: { backgroundColor: '#E0E0E0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  modalBtnTextGray: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  modalBtnBlue: { backgroundColor: '#A3D8E3', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginLeft: 8 },
  modalBtnTextBlue: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
