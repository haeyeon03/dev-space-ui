let accessToken = null;

export const authStore = {
  setAccessToken(token) {
    accessToken = token;
  },
  getAccessToken() {
    return accessToken;
  },
  clear() {
    accessToken = null;
  },
};
