// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 탭 내비: 헤더 숨김 */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        {/* 설문 화면: 기본 헤더 숨김 */}
        <Stack.Screen
          name="survey_travel"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="survey_destination"
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="mypage"
          options={{ headerShown: false }}
        />

        {/* Not Found */}
        <Stack.Screen
          name="+not-found"
          options={{ title: 'Not Found' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
