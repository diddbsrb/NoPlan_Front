import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SectionList,
  ActivityIndicator, // 로딩 인디케이터 import
} from 'react-native';
import { useRouter } from 'expo-router';
import CustomTopBar from '../(components)/CustomTopBar';
import { travelService } from '../../service/travelService';

// 타임라인 아이템의 데이터 타입 정의
interface TripItem {
  time: string;
  place: string;
}

// SectionList에 사용될 섹션의 데이터 타입 정의
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

  useEffect(() => {
    // 비동기 즉시 실행 함수로 데이터 로딩
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 가장 최근의 여정 조회
        // 서비스 함수가 실제 데이터 배열을 직접 반환하므로 .data 없이 사용합니다.
        const trips = await travelService.getTripData();

        if (!trips || trips.length === 0) {
          setError('진행 중인 여행을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        // created_at을 기준으로 내림차순 정렬하여 가장 최근 여행을 찾습니다.
        const latestTrip = trips.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (!latestTrip) {
          setError('최근 여정을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        // 2. 해당 여정의 방문지 조회
        // tripId로 방문지를 조회하는 수정된 함수(getVisitedContentsByTrip)를 호출합니다.
        const visitedContents = await travelService.getVisitedContentsByTrip(latestTrip.id);

        // 3. 데이터를 SectionList 형식에 맞게 가공합니다.
        const grouped = [{
          date: `${latestTrip.region} (${latestTrip.created_at.split('T')[0]})`,
          data: visitedContents
            // 타임라인이 시간 순서대로 보이도록 오름차순 정렬
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((content) => ({
              // 'HH:mm' 형식으로 시간만 추출
              time: content.created_at ? content.created_at.split('T')[1]?.slice(0, 5) : '',
              place: content.title,
            })),
        }];

        setSections(grouped);

      } catch (e: any) {
        console.error("여행 정보 로딩 실패:", e.message);
        setError('여행 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    })();
  }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행

  // 로딩 및 에러 상태에 따른 UI 렌더링
  const renderBody = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#A3D8E3" style={{ marginTop: 40 }} />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (sections.length === 0 || sections[0].data.length === 0) {
      return <Text style={styles.placeholderText}>현재 여행 기록이 없습니다.</Text>;
    }
    return (
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
              {/* 마지막 아이템이 아닐 경우에만 라인을 그립니다. */}
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
    );
  };

  return (
    <View style={styles.container}>
      <CustomTopBar />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>사용자님!{"\n"}여행은 즐거우신가요?</Text>
        <Text style={styles.subtitle}>사용자님의 행복하고 감성적인 여행이에요.</Text>
        {renderBody()}
      </View>

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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 15,
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
    paddingVertical: 6,
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
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#EAEAEA',
    marginTop: 4,
    minHeight: 40,
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
    fontWeight: '600',
  },
  timelineBox: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 10,
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
    paddingBottom: 40, // SafeArea 고려하여 조정
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bottomBtnGray: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  bottomBtnTextGray: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomBtnBlue: {
    flex: 1,
    backgroundColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  bottomBtnTextBlue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 320,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
  },
  modalBtnGray: {
    flex: 1,
    backgroundColor: '#E9E9E9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 6,
  },
  modalBtnTextGray: {
    color: '#555',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalBtnBlue: {
    flex: 1,
    backgroundColor: '#A3D8E3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 6,
  },
  modalBtnTextBlue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});