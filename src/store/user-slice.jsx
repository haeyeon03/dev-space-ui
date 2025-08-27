import { createSlice, configureStore } from "@reduxjs/toolkit";

const STORAGE = {
  token: "token",
  nickname: "nickname",
  email: "email",
  role: "role",
  image: "image",
};

const safeGet = (key) =>
  (typeof localStorage !== "undefined" ? localStorage.getItem(key) || "" : "").trim();

const load = () => ({
  token: safeGet(STORAGE.token),
  nickname: safeGet(STORAGE.nickname),
  email: safeGet(STORAGE.email),
  role: safeGet(STORAGE.role),
  image: safeGet(STORAGE.image),
});

const userSlice = createSlice({
  name: "user",
  initialState: load(),
  reducers: {
    setUser(state, { payload }) {
      const { token, nickname, email, role, image } = payload || {};
      if (token !== undefined) state.token = token;
      if (nickname !== undefined) state.nickname = nickname;
      if (email !== undefined) state.email = email;
      if (role !== undefined) state.role = String(role);
      if (image !== undefined) state.image = image;
    },
    setProfileImage(state, { payload }) {
      state.image = payload || "";
    },
    clearUser(state) {
      state.token = "";
      state.nickname = "";
      state.email = "";
      state.role = "";
      state.image = "";
    },
    syncFromStorage(state) {
      const s = load();
      state.token = s.token;
      state.nickname = s.nickname;
      state.email = s.email;
      state.role = s.role;
      state.image = s.image;
    },
  },
});

export const { setUser, clearUser, syncFromStorage, setProfileImage } = userSlice.actions;

export const store = configureStore({
  reducer: { user: userSlice.reducer },
});

// 저장소 → localStorage 동기화
if (typeof window !== "undefined") {
  store.subscribe(() => {
    const { token, nickname, email, role, image } = store.getState().user;
    if (token) localStorage.setItem(STORAGE.token, token);
    else localStorage.removeItem(STORAGE.token);

    if (nickname) localStorage.setItem(STORAGE.nickname, nickname);
    else localStorage.removeItem(STORAGE.nickname);

    if (email) localStorage.setItem(STORAGE.email, email);
    else localStorage.removeItem(STORAGE.email);

    if (role) localStorage.setItem(STORAGE.role, role);
    else localStorage.removeItem(STORAGE.role);

    if (image) localStorage.setItem(STORAGE.image, image);
    else localStorage.removeItem(STORAGE.image);
  });
}

export const selectSession = (state) => {
  const { nickname, email, role, image } = state.user;
  if (!nickname && !email && !role && !image) return null;
  return {
    user: {
      name: nickname || "(No Name)",
      email: email || "(No Linked E-Mail)",
      role,
      image,
    },
  };
};
