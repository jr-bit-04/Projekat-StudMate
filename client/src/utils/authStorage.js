const USER_EVENT = "studmate:user-updated";
const TOKEN_KEY = "token";
const USER_KEY = "user";
const PASSWORD_RESET_MODE_KEY = "passwordResetMode";

function isPasswordResetMode() {
  return sessionStorage.getItem(PASSWORD_RESET_MODE_KEY) === "true";
}

function migrateSessionAuthToPersistentStorage() {
  if (isPasswordResetMode()) {
    return;
  }

  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  const sessionUser = sessionStorage.getItem(USER_KEY);

  if (sessionToken && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, sessionToken);
  }

  if (sessionUser && !localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, sessionUser);
  }

  if (sessionToken || sessionUser) {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

function dispatchUserEvent() {
  window.dispatchEvent(new Event(USER_EVENT));
}

export function getStoredToken() {
  migrateSessionAuthToPersistentStorage();

  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  migrateSessionAuthToPersistentStorage();

  const rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);

  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

export function setStoredAuth({ token, user, persistent = true }) {
  const activeStorage = persistent ? localStorage : sessionStorage;
  const inactiveStorage = persistent ? sessionStorage : localStorage;

  if (token) {
    activeStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    activeStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  inactiveStorage.removeItem(TOKEN_KEY);
  inactiveStorage.removeItem(USER_KEY);

  dispatchUserEvent();
}

export function updateStoredUser(user) {
  if (!user) return;

  migrateSessionAuthToPersistentStorage();

  let updated = false;

  if (localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    updated = true;
  }

  if (sessionStorage.getItem(USER_KEY)) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    updated = true;
  }

  if (!updated) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  dispatchUserEvent();
}

export function clearStoredAuth({ keepResetMode = false } = {}) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);

  if (!keepResetMode) {
    sessionStorage.removeItem(PASSWORD_RESET_MODE_KEY);
  }

  dispatchUserEvent();
}

export function subscribeToStoredUser(listener) {
  const sync = () => listener(getStoredUser());

  window.addEventListener("storage", sync);
  window.addEventListener(USER_EVENT, sync);

  return () => {
    window.removeEventListener("storage", sync);
    window.removeEventListener(USER_EVENT, sync);
  };
}
