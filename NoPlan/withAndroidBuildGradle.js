const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidBuildGradle(config) {
  return withProjectBuildGradle(config, (config) => {
    // Groovy 스크립트가 아닌 경우 원본 설정을 반환 (안전장치)
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    let contents = config.modResults.contents;

    // --- 1. 코틀린 버전 설정 (소셜 로그인 호환성을 위해 1.8.22로 고정) ---
    // buildscript { ext { kotlinVersion = '...' } } 부분을 찾습니다.
    const kotlinVersionRegex = /kotlinVersion\s*=\s*['"](.*)['"]/;
    if (contents.match(kotlinVersionRegex)) {
      // 이미 kotlinVersion이 정의되어 있다면, 버전을 '1.8.22'로 강제 교체합니다.
      contents = contents.replace(kotlinVersionRegex, `kotlinVersion = '1.8.22'`);
    } else {
      // 정의되어 있지 않다면, buildscript.ext 블록에 새로 추가합니다.
      contents = contents.replace(
        /buildscript\s*\{\s*ext\s*\{/,
        `buildscript {\n    ext {\n        kotlinVersion = '1.8.22'`
      );
    }


    // --- 2. Notifee 저장소 설정 (기존 로직 유지) ---
    // Notifee의 네이티브 라이브러리가 있는 maven 저장소 경로입니다.
    const notifeeMavenRepo = 'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';
    
    // `allprojects { repositories {` 라는 패턴을 찾습니다.
    const allProjectsBlock = /allprojects\s*\{\s*repositories\s*\{/;

    if (allProjectsBlock.test(contents)) {
      // `allprojects` 블록이 이미 존재하는 경우,
      // Notifee 저장소 경로가 없다면 `repositories` 블록의 가장 앞부분에 추가합니다.
      if (!contents.includes(notifeeMavenRepo)) {
        contents = contents.replace(
          allProjectsBlock,
          `allprojects { repositories { ${notifeeMavenRepo}`
        );
      }
    } else {
      // `allprojects` 블록 자체가 없는 경우, 파일의 맨 아래에 새로 추가합니다.
      contents += `
allprojects {
    repositories {
        ${notifeeMavenRepo}
        google()
        mavenCentral()
    }
}
`;
    }

    // 수정된 내용을 반환합니다.
    config.modResults.contents = contents;
    return config;
  });
};