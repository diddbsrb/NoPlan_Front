import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';
import CustomTopBar from '../components/CustomTopBar';

const PLACES = [
  {
    name: 'Phuket',
    location: 'Thailand, Bangkok',
    image: require('../../assets/images/index_screen.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
  {
    name: 'Disneyland',
    location: 'California, United States',
    image: require('../../assets/images/noplan_logo_white.png'),
  },
];

export default function List() {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <CustomTopBar />
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={styles.title}>
          이런 곳 <Text style={{ color: '#4AB7C8' }}>어떠세요?</Text>
        </Text>
        <Text style={styles.desc}>클릭 시 상세정보를 볼 수 있습니다</Text>
        <FlatList
          data={PLACES}
          keyExtractor={(_, idx) => idx.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.85}>
              <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.cardLocationRow}>
                  <Text style={styles.cardLocationIcon}>🟡</Text>
                  <Text style={styles.cardLocation}>{item.location}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <View style={styles.bottomArea}>
              <Text style={styles.bottomDesc}>이 중에서 가고싶은 곳이 없다면?</Text>
              <TouchableOpacity style={styles.retryButton}>
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
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 4,
    marginLeft: 4,
  },
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'left',
    marginBottom: 16,
    marginLeft: 4,
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
    fontSize: 14,
    marginRight: 4,
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