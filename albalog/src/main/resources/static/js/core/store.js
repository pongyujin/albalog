// core/store.js
// localStorage 기반 데모 저장소 + 사용자 저장 헬퍼

export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  del(key) {
    localStorage.removeItem(key);
  }
};

// 기존 main.js 로직 유지용(데모 유저 저장)
const USER_KEY = "mg_user";

export function getUser() {
  return store.get(USER_KEY, null);
}

export function setUser(user) {
  store.set(USER_KEY, user);
}

export function clearUser() {
  store.del(USER_KEY);
}
