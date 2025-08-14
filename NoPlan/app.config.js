module.exports = ({ config }) => {
  const expoConfig = {
    ...config,
    owner: 'xiest',
    name: 'NoPlan',
    slug: 'NoPlan',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'noplan',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.donggguk.noplan',
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.donggguk.noplan',
      googleServicesFile: './google-services.json',
      config: {
        googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
      [
        '@react-native-seoul/kakao-login',
        { kakaoAppKey: '8aef54490fca5199b3701d81e9cd1eb0' },
      ],
      [
        'expo-build-properties',
        {
          android: {
            // Kakao 저장소 유지
            repositories: [{ url: 'https://devrepo.kakao.com/nexus/content/groups/public/' }],
            // ✅ Kotlin/SDK 강제 상향
            kotlinVersion: '1.9.24',
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 23,
          },
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/Pretendard-Light.otf',
            './assets/fonts/Pretendard-Medium.otf',
            './assets/fonts/SpaceMono-Regular.ttf',
          ],
        },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      router: { origin: false },
      eas: { projectId: '7fb126e9-50a3-4269-9fcf-a94c9280eafb' },
    },
  };

  return expoConfig;
};
