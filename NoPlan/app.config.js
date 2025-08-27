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

      let networkSecurityConfigContent;

      // [수정된 부분] EAS 빌드 프로필에 따라 다른 네트워크 보안 설정을 적용합니다.
      // 'development' 프로필로 빌드할 때는 모든 http(암호화되지 않은) 통신을 허용하여 로컬 개발 서버에 접속할 수 있도록 합니다.
      if (process.env.EAS_BUILD_PROFILE === 'development') {
        networkSecurityConfigContent = `
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
        `;
      } else {
        // 'production' 이나 'preview' 등 다른 프로필의 경우, 특정 도메인(tong.visitkorea.or.kr)을 제외한 http 통신을 차단합니다.
        networkSecurityConfigContent = `
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
      }

      // 파일을 씁니다.
      fs.writeFileSync(networkSecurityConfigFile, networkSecurityConfigContent.trim());

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
      withNetworkSecurityConfig, // 수정된 플러그인이 여기에서 사용됩니다.
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