import axios from 'axios';
import * as SecureStore from 'expo-secure-store';


export const apiClient = axios.create({
  baseURL: 'https://www.no-plan.cloud/api/v1',
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    // 헤더 객체가 없을 경우를 대비해 초기화합니다.
    if (!config.headers) {
      config.headers = axios.AxiosHeaders.from();
    }

    // 로그인/회원가입과 같은 특정 URL은 토큰 추가 로직을 건너뜁니다.
    const publicUrls = ['/users/login/', '/users/signup/'];
    if (publicUrls.includes(config.url || '')) {
      return config; // 토큰 없이 즉시 반환
    }
    
    // 1. SecureStore에서 토큰을 가져옵니다.
    const accessToken = await SecureStore.getItemAsync('accessToken');

    // 2. 헤더 객체가 없을 경우를 대비해, 빈 객체로 확실히 만들어줍니다. (매우 중요!)
    //    이것이 타입스크립트 오류를 해결하는 핵심 중 하나입니다.
    if (!config.headers) {
      config.headers = axios.AxiosHeaders.from();
    }

    // 3. 토큰이 존재하면, 안전하게 헤더에 추가합니다.
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 4. 모든 처리가 끝난 config를 반환합니다.
    return config;
  },
  (error) => {
    // 요청 단계에서 에러가 발생했을 때 처리합니다.
    return Promise.reject(error);
  }
);


// ✅ 2. 응답 인터셉터: 401 에러(토큰 만료) 발생 시 자동으로 토큰을 재발급하고, 실패했던 요청을 재시도합니다.
apiClient.interceptors.response.use(
  // 정상 응답은 그대로 반환합니다.
  (response) => {
    return response;
  },
  // 에러 발생 시 처리합니다.
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, 재시도한 요청이 아닐 경우에만 실행합니다. (무한 재시도 방지)
    if (error.response?.status === 401 && originalRequest.url !== '/users/login/' && !originalRequest._retry) {
      originalRequest._retry = true; // 재시도 플래그를 true로 설정합니다.

      try {
        // SecureStore에서 Refresh Token을 가져옵니다.
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) {
            console.error("리프레시 토큰이 없습니다. 재로그인이 필요합니다.");
            // 여기서 로그아웃 처리를 할 수 있지만, 일단은 에러를 반환합니다.
            return Promise.reject(error);
        }

        // 토큰 재발급 API를 호출합니다.
        // **주의**: 이 호출은 인터셉터를 타지 않도록 별도의 axios 인스턴스를 사용하거나, baseURL을 포함한 전체 URL을 사용해야 합니다.
        const response = await axios.post('https://no-plan.cloud/api/v1/users/token/refresh/', {
          refresh: refreshToken,
        });

        // 새로 발급받은 Access Token을 가져옵니다.
        const newAccessToken = response.data.access;

        // 새로운 Access Token을 SecureStore에 저장합니다.
        await SecureStore.setItemAsync('accessToken', newAccessToken);

        // 실패했던 원래 요청의 헤더에 새로운 Access Token을 설정합니다.
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        console.log("토큰 재발급 성공! 원래 요청을 재시도합니다.");
        // 원래 요청을 다시 보냅니다.
        return apiClient(originalRequest);

      } catch (refreshError) {
        // 리프레시 토큰마저 만료되거나, 재발급 과정에서 에러가 발생한 경우
        console.error("토큰 재발급에 실패했습니다.", refreshError);
        // 지금은 로그아웃 기능이 제외되었으므로, 에러를 그대로 반환하여 호출한 쪽에서 처리하도록 합니다.
        return Promise.reject(refreshError);
      }
    }

    // 401 에러가 아니거나, 이미 재시도한 요청이라면 에러를 그대로 반환합니다.
    return Promise.reject(error);
  }
);

export default apiClient;