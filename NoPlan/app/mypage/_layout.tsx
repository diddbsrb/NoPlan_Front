// app/mypage/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';
import CustomTopBar from '../(components)/CustomTopBar';

export default function MyPageStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,   // CustomTopBar를 직접 쓰실 거면 false
      }}
    >
      {/* /mypage 로 진입할 때만 이 스크린이 스택에 쌓였다가 빠집니다 */}
      <Stack.Screen
        name="index"
        options={{
            headerShown: false,   // CustomTopBar를 직접 쓰실 거면 false
          }}
      />
    </Stack>
  );
}
