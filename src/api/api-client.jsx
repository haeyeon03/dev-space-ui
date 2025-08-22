// api-client.js
import axios from "axios";
import { store, setUser, clearUser } from "../store/user-slice";
/**
 * 인증이 필요 없는 API URL
 */
const BASE_URL = "http://localhost:8080/api";
const AUTH_FREE = ["/auth/login", "/auth/signup", "/auth/reissue"];
const isAuthFree = (url = "") => AUTH_FREE.some((p) => url.startsWith(p));

export class APIClient {
  constructor(baseURL = BASE_URL) {
    this.instance = axios.create({
      baseURL,
      timeout: 15000,
      withCredentials: true, // httpOnly refresh 쿠키 전송
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 리프레시 동시호출 방지 상태
    this.isRefreshing = false;
    this.queue = [];

    // ===== 요청 인터셉터 =====
    this.instance.interceptors.request.use((config) => {
      const url = config.url || "";
      const token = store.getState().user.token;
      // 인증 불필요 경로는 스킵
      if (isAuthFree(url)) return config;

      // 토큰 있으면 Authorization 주입
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // ===== 응답 인터셉터 =====
    this.instance.interceptors.response.use(
      (res) => {
        return res;
      }, //정상이면 그냥 res 온거 그대로 return
      async (error) => {
        const original = error.config || {};
        const status = error.response?.status ?? 0;
        const url = (original.url || "").toLowerCase();

        // 리프레시 자신이거나 인증 불필요 경로면 재시도 금지
        const isReissueCall = url.includes("/auth/reissue");
        if (
          status === 401 &&
          !original._retry &&
          !isAuthFree(url) &&
          !isReissueCall
        ) {
          original._retry = true;
          try {
            await this.enqueueRefresh();
            return this.instance(original); // 원 요청 재시도
          } catch {
            this.post("/auth/logout", {});
            store.dispatch(clearUser());
            alert("토큰이 만료되었습니다. 로그인 후 이용해 주세요.");
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /*
    동시 요청 환경에서 토큰 만료(예: 401 또는 서버 정의 에러 코드)가 여러 요청에서 동시에 발생할 수 있다.
    이때 각 요청이 모두 reissue API를 호출하면 새 토큰이 중복 발급된다.

    해결 전략:
    1) 최초로 감지한 토큰 만료 시점에만 reissue API를 호출한다(락).
    2) reissue 응답을 기다리는 동안 도착하는 추가 만료 응답은 큐에 대기시킨다(중복 호출 방지).
    3) reissue 성공 시 새 토큰을 큐의 대기자들에게 전달하고,
       각 요청은 자신이 보유한 원래 Axios config(메서드/URL/파라미터/바디/헤더 포함)로 재시도한다.
    4) reissue 실패(401/403/만료/네트워크 오류 등) 시 큐의 대기자들에게 실패를 알리고,
       클라이언트 토큰을 정리한 뒤 상위에서 로그인 화면 이동 등 후처리한다.
  */
  async enqueueRefresh() {
    if (this.isRefreshing) {
      return new Promise((resolve) => this.queue.push(resolve));
    }

    this.isRefreshing = true;
    try {
      const res = await this.instance.post("/auth/reissue", {}); // RT는 httpOnly 쿠키
      const accessToken = res.data?.data;
      if (!accessToken) throw new Error("No accessToken in reissue response");

      store.dispatch(setUser({ token: accessToken }));

      const waiters = this.queue.slice();
      this.queue.length = 0;
      for (const resolve of waiters) resolve(accessToken);
      return accessToken;
    } catch (e) {
      const waiters = this.queue.slice();
      this.queue.length = 0;
      for (const resolve of waiters) resolve(null);
      throw e;
    } finally {
      this.isRefreshing = false;
    }
  }

  // ===== 단순 래퍼 (url, data/params만 넘기면 됨) =====
  async get(url, params) {
    return (await this.instance.get(url, { params })).data;
  }
  async post(url, data) {
    return (await this.instance.post(url, data)).data;
  }
  async put(url, data) {
    return (await this.instance.put(url, data)).data;
  }
  async delete(url, data) {
    return (await this.instance.delete(url, { data })).data;
  }
  // 파일(ex. 이미지 등) 업로드
  async postForm(url, formData) {
    return (await this.instance.post(url, formData)).data;
  }
  // 파일(ex. 이미지 등) 업로드
  async putForm(url, formData) {
    return (await this.instance.put(url, formData)).data;
  }
}

export const api = new APIClient();
