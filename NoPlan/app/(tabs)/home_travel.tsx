// app/(tabs)/home_travel.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SectionList } from 'react-native';
import { useRouter } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';
import { travelService } from '../../service/travelService';

interface TripItem {
  time: string;
  place: string;
}

interface TripSection {
  date: string;
  data: TripItem[];
}

const TRIP_SECTIONS: TripSection[] = [
  {
    date: '2025.07.04 금요일',
    data: [
      { time: '오후 12:10', place: '여행 시작' },
      { time: '오후 2:14', place: '경복궁' },
      { time: '오후 4:15', place: '스킬 카페' },
    ],
  },
  {
    date: '2025.07.05 토요일',
    data: [
      { time: '오후 12:10', place: '여행 시작' },
      { time: '오후 2:14', place: '경복궁' },
      { time: '오후 4:15', place: '스킬 카페' },
    ],
  },
];

export default function HomeTravel() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [sections, setSections] = useState<TripSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 가장 최근의 여정 조회
        const tripRes = await travelService.getTripData();
        const trips = Array.isArray(tripRes?.data) ? tripRes.data : [];
        const latestTrip = trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (!latestTrip) {
          setError('최근 여정을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        // 해당 여정의 방문지 조회
        const visitedRes = await travelService.getVisitedContentData(latestTrip.id);
        const visitedContents = Array.isArray(visitedRes?.data) ? visitedRes.data : [];

        const grouped = [{
          date: latestTrip.region + (latestTrip.created_at ? ` (${latestTrip.created_at.split('T')[0]})` : ''),
          data: visitedContents.map((content) => ({
            time: content.created_at ? content.created_at.split('T')[1]?.slice(0, 5) : '',
            place: content.title,
          })),
        }];

        setSections(grouped);
      } catch (e) {
        setError('여행 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar />
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={styles.title}>사용자님!{"\n"}여행은 즐거우신가요?</Text>
        <Text style={styles.subtitle}>사용자님의 행복하고 감성적인 여행이에요.</Text>
        {loading && <Text style={{textAlign:'center',margin:16}}>로딩 중...</Text>}
        {error && <Text style={{color:'red',textAlign:'center',margin:8}}>{error}</Text>}
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item.place + index}
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
          style={{ marginTop: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtnGray} onPress={() => setShowModal(true)}>
          <Text style={styles.bottomBtnTextGray}>여행 종료</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomBtnBlue}
          onPress={() => router.replace('/survey_destination')}
        >
          {/* survey_destination에서 useTravelSurvey()로 설문 데이터 접근 가능 */}
          <Text style={styles.bottomBtnTextBlue}>다음 행선지</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>여행을 종료하시겠어요?</Text>
            <Text style={styles.modalDesc}>여행이 종료됩니다.</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalBtnGray} onPress={() => setShowModal(false)}>
                <Text style={styles.modalBtnTextGray}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnBlue} onPress={() => setShowModal(false)}>
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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
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
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A3D8E3',
    marginTop: 4,
    marginBottom: 2,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: '#E0E0E0',
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  timelineTime: {
    fontSize: 13,
    color: '#3CB4C7',
    width: 64,
    marginRight: 6,
  },
  timelineBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  timelinePlace: {
    fontSize: 15,
    color: '#222',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 100,
    paddingTop: 8,
    backgroundColor: '#fff',
  },
  bottomBtnGray: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginRight: 8,
  },
  bottomBtnTextGray: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomBtnBlue: {
    backgroundColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginLeft: 8,
  },
  bottomBtnTextBlue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtnGray: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  modalBtnTextGray: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalBtnBlue: {
    backgroundColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  modalBtnTextBlue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
