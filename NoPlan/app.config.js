// app.config.js

// [수정] withDangerousMod를 추가로 import 합니다.
const { withProjectBuildGradle, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
// [추가] 파일 시스템과 경로 모듈을 가져옵니다.
const fs = require('fs');
const path = require('path');

/**
 * 코틀린 버전 강제 설정을 위한 커스텀 플러그인
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

/**
 * 안드로이드 네트워크 보안 설정을 위한 커스텀 플러그인 (가장 안정적인 방식)
 * @param {import('@expo/config-types').ExpoConfig} config
 */
const withNetworkSecurityConfig = (config) => {
  // 1. AndroidManifest.xml에 networkSecurityConfig 속성을 추가합니다.
  const configWithAndroidManifest = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = manifest.application[0];
    if (!application.$) {
      application.$ = {};
    }
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    return config;
  });

  // 2. withDangerousMod를 사용하여 res/xml/network_security_config.xml 파일을 직접 생성합니다.
  // 이 방식은 Expo 버전에 상관없이 가장 확실하게 동작합니다.
  return withDangerousMod(configWithAndroidManifest, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'xml');
      const networkSecurityConfigFile = path.join(xmlDir, 'network_security_config.xml');

      // res/xml 폴더가 없으면 생성합니다.
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // 네트워크 보안 설정 XML 내용을 정의합니다.
      const networkSecurityConfig = `
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">tong.visitkorea.or.kr</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
      `;

      // 파일을 씁니다.
      fs.writeFileSync(networkSecurityConfigFile, networkSecurityConfig.trim());

      return config;
    },
  ]);
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
    icon: './assets/images/noplan_logo_blue.png',
    scheme: 'noplan',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/noplan_logo_blue.png',
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
        foregroundImage: './assets/images/noplan_logo_blue.png',
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
      favicon: './assets/images/noplan_logo_blue.png',
    },
    plugins: [
      withForcedKotlinVersion,
      withNetworkSecurityConfig,
      'expo-router',
      'expo-secure-store',
      '@react-native-firebase/app',
      '@react-native-firebase/messaging',
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