// app.config.js

const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * 코틀린 버전 강제 설정을 위한 커스텀 플러그인 (기존 설정 유지)
 * @param {import('@expo/config-types').ExpoConfig} config
 */
const withForcedKotlinVersion = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;

    const allProjectsRegex = /allprojects\s*{/;
    if (!allProjectsRegex.test(contents)) {
      contents += `
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`;
    }
    
    const extBlock = `
    ext {
        kotlinVersion = "1.8.22"
    }
`;
    contents = contents.replace(
      /allprojects\s*{/,
      `allprojects {${extBlock}`
    );

    config.modResults.contents = contents;
    return config;
  });
};

// 메인 설정을 내보냅니다.
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
      // ▼▼▼ [수정됨] iOS용 Google Maps API 키 설정 추가 ▼▼▼
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY, // 여기에 발급받은 API 키를 붙여넣으세요.
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.donggguk.noplan',
      googleServicesFile: './google-services.json',
      // ▼▼▼ [수정됨] Android용 Google Maps API 키 설정 추가 ▼▼▼
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY // 여기에 발급받은 API 키를 붙여넣으세요.
        }
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      // 기존 플러그인 설정은 모두 그대로 유지합니다.
      withForcedKotlinVersion,
      'expo-router',
      'expo-secure-store',
      [
        '@react-native-seoul/kakao-login',
        {
          kakaoAppKey: '8aef54490fca5199b3701d81e9cd1eb0',
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            repositories: [
              { url: 'https://devrepo.kakao.com/nexus/content/groups/public/' },
            ],
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '7fb126e9-50a3-4269-9fcf-a94c9280eafb',
      },
    },
  };

  return expoConfig;
};