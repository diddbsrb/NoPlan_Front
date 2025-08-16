import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as Font from 'expo-font';

interface Props {
    onBack: () => void;
}

const TermsComponent: React.FC<Props> = ({ onBack }) => {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    // 폰트 로드
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
            <ScrollView style={{ backgroundColor: '#fff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee' }}>
                <Text style={{ fontSize: 12, color: '#333', lineHeight: 20 }}>
                    [No Plan](이하 "회사")는 이용자의 개인정보를 매우 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수하여 다음과 같이 개인정보를 수집·이용하고 보호합니다.
                    1. 수집하는 개인정보 항목
                    회사는 회원가입, 서비스 이용 시 다음과 같은 개인정보를 수집합니다.
                    필수 항목: 이메일 주소, 닉네임, 휴대폰 번호
                    선택 항목: 성별, 생년월일, 관심 여행지역, 최근 방문지 등
                    자동 수집 항목: 기기 정보(기종, OS), IP 주소, 위치 정보(동의 시), 쿠키
                    2. 개인정보의 수집 및 이용 목적
                    회사는 수집한 개인정보를 다음 목적을 위해 이용합니다.
                    회원관리: 본인 확인, 중복 가입 확인, 서비스 이용 안내
                    맞춤형 여행 정보 제공: 사용자 위치 기반 추천, 관심사 기반 콘텐츠 제공
                    서비스 개선 및 통계 분석
                    법적 의무 이행 및 민원 처리
                    3. 개인정보의 보유 및 이용 기간
                    회원 탈퇴 시 즉시 파기
                    관련 법령에 따라 일정 기간 보존할 수 있음 (전자상거래법 등)
                    항목보유 기간계약 또는 청약 철회 기록5년 (전자상거래법)소비자 불만 및 분쟁 처리3년 (전자상거래법)접속 로그, 위치 정보 등1년 (통신비밀보호법 등)
                    4. 개인정보의 제3자 제공
                    회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않으며, 아래의 경우에 한해 예외적으로 제공할 수 있습니다.
                    이용자가 사전 동의한 경우
                    법령에 의거하거나 수사기관의 요청이 있는 경우
                    5. 개인정보의 위탁
                    서비스 운영을 위해 다음과 같은 외부 업체에 일부 개인정보 처리를 위탁할 수 있습니다.
                    수탁 업체위탁 내용AWS / Naver Cloud 등데이터 보관 및 서버 운영문자 발송 업체본인 인증 및 알림 메시지 발송
                    6. 이용자의 권리
                    이용자는 언제든지 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다. 관련 요청은 앱 내 고객센터 또는 [이메일주소]를 통해 접수 가능합니다.
                    7. 개인정보 보호책임자
                    이름: [홍길동]
                    이메일: [privacy@noplan.app]
                    담당부서: 고객지원팀
                    ※ 본 방침은 [2025년 7월 6일]부터 적용됩니다. 변경사항이 있을 경우 앱 내 공지사항 또는 이메일을 통해 고지합니다.
                </Text>
            </ScrollView>
        </View>
    );
};

export default TermsComponent;
