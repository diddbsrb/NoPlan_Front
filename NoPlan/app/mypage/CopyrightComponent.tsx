import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import * as Font from 'expo-font';

interface Props {
  onBack: () => void;
}

const CopyrightComponent: React.FC<Props> = ({ onBack }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        'Pretendard-Light': require('../../assets/fonts/Pretendard-Light.otf'),
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <ScrollView 
        style={{ backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' }}
        contentContainerStyle={{ paddingBottom: 0 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={{ fontSize: 12, color: '#333', lineHeight: 20 }}>
풍경 사진에 대한 권리자 : 노랑이 (instagram: norang2_pic_)
        </Text>
      </ScrollView>
    </View>
  );
};

export default CopyrightComponent;


