import React from 'react';
import { View, Text } from 'react-native';
import CustomTopBar from '../components/CustomTopBar';

export default function HomeTravel() {
  return (
    <View style={{ flex: 1 }}>
      <CustomTopBar />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Home Travel Page</Text>
      </View>
    </View>
  );
} 