// app/kakao.tsx

import React, { useRef } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// 백엔드(BE)와 약속된 값들을 정의합니다.
// 이 값들은 실제 운영 시에는 환경 변수로 관리하는 것이 좋습니다.
const KAKAO_REST_API_KEY = 'c7bae595a41d669362115e5d78b4aad4'; // 본인의 카카오 REST API 키
const BACKEND_REDIRECT_URI = 'https://www.no-plan.cloud/api/v1/users/kakao/'; // BE가 알려준 Redirect URI

export default function KakaoLoginScreen() {
  const router = useRouter();
  const webviewRef = useRef<WebView>(null);
  const isRedirectHandled = useRef(false); // 중복 실행을 막기 위한 플래그

  // 백엔드가 JWT 토큰을 담은 JSON을 응답할 때, 그 내용을 추출하기 위한 JavaScript 코드
  // 웹뷰 페이지의 <body> 내용을 문자열로 가져옵니다.
  const INJECTED_JAVASCRIPT = `
    window.ReactNativeWebView.postMessage(document.body.innerText);
  `;

  // 웹뷰로부터 메시지(JWT 토큰이 담긴 JSON 문자열)를 수신했을 때 실행될 함수
  const handleMessage = async (event: any) => {
    // 중복 실행 방지
    const messageData = event.nativeEvent.data;
    if (isRedirectHandled.current) {
      return;
    }
    // ★★★ 백엔드에서 보낸 응답을 그대로 콘솔에 출력합니다. ★★★
    console.log("========================================");
    console.log("백엔드 서버의 실제 응답:", messageData);
    console.log("========================================");
/*
    try {
      const messageData = event.nativeEvent.data;
      console.log('WebView로부터 받은 메시지:', messageData);

      

      // 백엔드가 보낸 JSON 문자열을 객체로 파싱
      const data = JSON.parse(messageData);

      // 백엔드가 보내준 데이터 구조에서 access 토큰을 추출
      // 예: { "access": "ey...", "refresh": "ey..." }
      if (data && data.access) {
        isRedirectHandled.current = true; // 처리 완료 플래그 설정
        console.log('백엔드로부터 JWT 토큰 수신 성공');

        // 받아온 토큰을 안전하게 저장
        await SecureStore.setItemAsync('accessToken', data.access);
        
        // 로그인 성공 후 홈으로 이동 (스택을 초기화하며 이동)
        // '/(tabs)/home'는 앱의 홈 경로에 맞게 수정해야 할 수 있습니다.
        router.replace('/(tabs)/home');

      } else {
         // 데이터는 받았지만, access 토큰이 없는 경우
         console.warn('메시지를 받았으나 access 토큰이 없습니다.');
      }
    } catch (error) {
      console.error('JWT 토큰 처리 중 에러 발생:', error);
    }*/
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        style={styles.container}
        // 카카오 인가 요청 URL
        source={{
          uri: `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${KAKAO_REST_API_KEY}&redirect_uri=${BACKEND_REDIRECT_URI}`,
        }}
        // 웹뷰의 URL이 변경될 때마다 실행
        onNavigationStateChange={(navState) => {
          // URL이 백엔드의 Redirect URI로 변경되었는지 확인
          if (navState.url.startsWith(BACKEND_REDIRECT_URI) && !isRedirectHandled.current) {
            // 이 페이지에 우리가 원하는 JWT 토큰이 들어있으므로, JavaScript를 주입하여 내용을 가져옵니다.
            webviewRef.current?.injectJavaScript(INJECTED_JAVASCRIPT);
          }
        }}
        // 주입된 JavaScript에서 postMessage로 보낸 데이터를 수신
        onMessage={handleMessage}
        // 로딩 중 사용자에게 피드백을 주기 위함 (선택 사항)
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#000000" />
          </View>
        )}
        startInLoadingState={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    // 로딩 인디케이터를 화면 중앙에 위치시키기 위한 스타일
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});