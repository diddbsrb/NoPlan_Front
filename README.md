# NoPlan Frontend

> **AI 기반 개인 맞춤 여행지 추천 모바일 앱**  
> "계획 없이 떠나는 여행"을 위한 React Native 앱

[![React Native](https://img.shields.io/badge/React_Native-0.74.5-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~51.0.14-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.3.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📱 프로젝트 소개

**NoPlan**은 사용자의 실시간 위치와 추상적인 취향(분위기, 테마 등)을 바탕으로 주변 장소를 추천하고, 여행 일정을 관리할 수 있도록 돕는 AI 기반 모바일 애플리케이션입니다.

### 🌟 주요 기능

- **🤖 AI 기반 맞춤 추천**: 형용사로 표현한 취향을 바탕으로 AI가 적합한 장소 추천
- **📍 실시간 위치 기반 검색**: 현재 위치를 기반으로 주변 식당, 카페, 관광지, 숙소 조회
- **📝 여행 일정 관리**: 방문한 장소 기록 및 북마크 기능
- **📊 AI 여행 요약**: 여행 기록을 바탕으로 AI가 종합적인 여행 후기 생성
- **🔐 소셜 로그인**: 카카오 로그인 지원
- **🔔 푸시 알림**: Firebase를 통한 알림 서비스

---

## 🛠 기술 스택

### Core Framework
- **React Native** 0.74.5
- **Expo** ~51.0.14
- **TypeScript** ~5.3.3

### 주요 라이브러리
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Authentication**: 
  - 카카오 로그인 (`@react-native-seoul/kakao-login`)
  - JWT 토큰 기반 인증
- **Storage**: 
  - AsyncStorage (로컬 저장소)
  - Expo SecureStore (보안 저장소)
- **Maps**: React Native Maps
- **Notifications**: 
  - Expo Notifications
  - Firebase Cloud Messaging
- **Location**: Expo Location

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18.x 이상
- **npm** 또는 **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (Android 개발용)
- **Xcode** (iOS 개발용, macOS만)

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/[your-username]/NoPlan_Front.git
   cd NoPlan_Front/NoPlan
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   # .env 파일 생성 (필요시)
   cp .env.example .env
   ```

4. **개발 서버 실행**
   ```bash
   # Expo 개발 서버 시작
   npm start
   
   # Android 앱 실행
   npm run android
   
   # iOS 앱 실행
   npm run ios
   
   # 웹 버전 실행
   npm run web
   ```

### 빌드

```bash
# Android APK 빌드
npm run android

# iOS 빌드
npm run ios

# 린트 검사
npm run lint
```

---

## 📁 프로젝트 구조

```
NoPlan/
├── app/                          # 앱 메인 화면 및 라우팅
│   ├── (tabs)/                   # 탭 네비게이션 화면들
│   │   ├── home.tsx             # 홈 화면
│   │   ├── list.tsx             # 장소 목록 화면
│   │   └── mypage/              # 마이페이지 관련
│   ├── (components)/            # 공통 컴포넌트
│   ├── (contexts)/              # React Context
│   └── survey_*.tsx             # 설문 관련 화면
├── components/                   # 재사용 가능한 UI 컴포넌트
├── service/                      # API 서비스 레이어
│   ├── apiClient.ts             # API 클라이언트 설정
│   ├── authService.ts           # 인증 관련 API
│   ├── travelService.ts         # 여행 관련 API
│   └── userService.ts           # 사용자 관련 API
├── assets/                       # 정적 자원
│   ├── images/                  # 이미지 파일들
│   └── fonts/                   # 폰트 파일들
├── hooks/                        # 커스텀 훅
├── utils/                        # 유틸리티 함수
└── constants/                    # 상수 정의
```

---

## 🔗 백엔드 API

이 프론트엔드는 [NoPlan Backend API](https://github.com/hjk2132/NO_PLAN)와 연동됩니다.

### 주요 API 엔드포인트

- **인증**: `/api/v1/users/`
- **여행 관리**: `/api/v1/users/trips/`
- **장소 추천**: `/api/v1/tours/`
- **북마크**: `/api/v1/users/bookmarks/`
- **방문 기록**: `/api/v1/users/visited-contents/`

자세한 API 문서는 [백엔드 레포지토리](https://github.com/hjk2132/NO_PLAN)를 참조하세요.

---

## 📱 주요 화면

### 1. 홈 화면
- 현재 위치 기반 장소 추천
- AI 기반 맞춤형 추천 결과

### 2. 여행 설문
- 여행 목적지, 동반자, 교통수단 선택
- 원하는 분위기를 형용사로 표현

### 3. 장소 목록
- 카테고리별 장소 조회 (식당, 카페, 관광지, 숙소)
- 거리순/추천순 정렬

### 4. 마이페이지
- 사용자 정보 관리
- 여행 기록 및 북마크
- 계정 설정

---

## 🎨 디자인 시스템

- **폰트**: Pretendard (Light, Medium)
- **아이콘**: Expo Vector Icons
- **색상**: 시스템 테마 지원 (다크/라이트 모드)
- **UI/UX**: 네이티브 모바일 디자인 가이드라인 준수

---

## 🔧 개발 도구

- **Metro Bundler**: React Native 번들러
- **ESLint**: 코드 품질 관리
- **TypeScript**: 타입 안전성
- **Expo Dev Tools**: 개발 및 디버깅
- **Flipper**: 네이티브 디버깅 (선택사항)

---

## 📦 배포

### Android
- **EAS Build**를 통한 APK/AAB 빌드
- Google Play Store 배포 준비 완료

### iOS
- **EAS Build**를 통한 IPA 빌드
- App Store Connect 배포 준비 완료

---

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

<div align="center">

**Made with ❤️ by NoPlan Team**

[Backend Repository](https://github.com/hjk2132/NO_PLAN) • [Frontend Repository](https://github.com/[your-username]/NoPlan_Front)

</div>