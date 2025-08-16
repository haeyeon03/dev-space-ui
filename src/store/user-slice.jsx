import { createSlice, configureStore } from "@reduxjs/toolkit";

const STORAGE = {
  token: "token",
  nickname: "nickname",
  email: "email",
  role: "role",
};

const safeGet = (key) =>
  (typeof localStorage !== "undefined"
    ? localStorage.getItem(key) || ""
    : ""
  ).trim();

const load = () => ({
  token: safeGet(STORAGE.token),
  nickname: safeGet(STORAGE.nickname),
  email: safeGet(STORAGE.email),
  role: safeGet(STORAGE.role),
});

const userSlice = createSlice({
  name: "user",
  initialState: load(),
  reducers: {
    setUser(state, { payload }) {
      const { token, nickname, email, role } = payload || {};
      if (token !== undefined) state.token = token;
      if (nickname !== undefined) state.nickname = nickname;
      if (email !== undefined) state.email = email;
      if (role !== undefined) state.role = String(role);
    },
    clearUser(state) {
      state.token = "";
      state.nickname = "";
      state.email = "";
      state.role = "";
    },
    syncFromStorage(state) {
      const s = load();
      state.token = s.token;
      state.nickname = s.nickname;
      state.email = s.email;
      state.role = s.role;
    },
  },
});

export const { setUser, clearUser, syncFromStorage } = userSlice.actions;

export const store = configureStore({
  reducer: { user: userSlice.reducer },
});

// 저장소 → localStorage 동기화
if (typeof window !== "undefined") {
  store.subscribe(() => {
    const { token, nickname, email, role } = store.getState().user;
    if (token) localStorage.setItem(STORAGE.token, token);
    else localStorage.removeItem(STORAGE.token);

    if (nickname) localStorage.setItem(STORAGE.nickname, nickname);
    else localStorage.removeItem(STORAGE.nickname);

    if (email) localStorage.setItem(STORAGE.email, email);
    else localStorage.removeItem(STORAGE.email);

    if (role) localStorage.setItem(STORAGE.role, role);
    else localStorage.removeItem(STORAGE.role);
  });
}

export const selectSession = (state) => {
  const { nickname, email, role } = state.user;
  if (!nickname && !email && !role) return null;
  return {
    user: {
      name: nickname || "(No Name)",
      email: email || "(No Linked E-Mail)",
      role,
    },
  };
};
