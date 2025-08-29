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
        const url = (original.url || "").toLowerCase();

        // 리프레시 자신이거나 인증 불필요 경로면 재시도 금지
        const isReissueCall = url.includes("/auth/reissue");
        if (
          error.response.data.code === "JWT002" &&
          !isAuthFree(url) &&
          !isReissueCall
        ) {
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
    AccessToken 만료 시, 동시에 여러 API 요청이 실패(401 등)할 수 있다.
    → 각 요청이 동시에 /auth/reissue 호출하면 토큰이 중복 발급되는 문제가 발생한다.

    해결 전략 (동기화 큐 방식):
    1) 최초로 만료를 감지한 요청만 /auth/reissue 호출 (isRefreshing 플래그).
    2) 이후 들어온 만료 요청은 queue에 쌓아두고 대기 (중복 호출 방지).
    3) reissue 성공 시 새 토큰을 queue의 대기자들에게 전달 → 각 요청은 재시도 가능.
    4) reissue 실패 시 대기자들에게 실패(null) 알림 → 클라이언트는 로그아웃/재로그인 처리.
  */
  async enqueueRefresh() {
    // 이미 토큰 갱신 중이라면, 새 Promise(Pending)를 반환하고 queue에 resolve 저장 → 이후 깨워줌
    if (this.isRefreshing) {
      return new Promise((resolve) => this.queue.push(resolve));
    }

    // 갱신 시작
    this.isRefreshing = true;
    try {
      //서버에 reissue 요청
      const res = await this.instance.post("/auth/reissue", {}); // RT는 httpOnly 쿠키
      const accessToken = res.data?.data;
      if (!accessToken) throw new Error("No accessToken in reissue response");

      // 새 토큰을 전역 상태(store)에 업데이트
      store.dispatch(setUser({ token: accessToken }));

      // this.queue 복사본을 waiters 변수에 저장
      const waiters = this.queue.slice();

      this.queue.length = 0;
      // resolve() 로 Pending -> fullfilled 로 상태 업데이트
      for (const resolve of waiters) resolve(accessToken);
      return accessToken;
    } catch (e) {
      // reissue 실패 시 대기자들에게 null 전달 → 실패 처리
      const waiters = this.queue.slice();
      this.queue.length = 0;
      for (const resolve of waiters) resolve(null);
      throw e;
    } finally {
      // 성공/실패와 관계없이 갱신 상태 해제
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
  async patch(url, data) {
    return (await this.instance.patch(url, data)).data;
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
