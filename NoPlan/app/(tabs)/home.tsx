import React from 'react';
import { View, Text } from 'react-native';
import CustomTopBar from '../components/CustomTopBar';

export default function Home() {
  return (
    <View style={{ flex: 1 }}>
      <CustomTopBar />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Home Page</Text>
      </View>
    </View>
  );
} 