const USER_EVENT = "studmate:user-updated";

function dispatchUserEvent() {
  window.dispatchEvent(new Event(USER_EVENT));
}

export function getStoredUser() {
  const rawUser =
    localStorage.getItem("user") || sessionStorage.getItem("user");

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
    activeStorage.setItem("token", token);
  }

  if (user) {
    activeStorage.setItem("user", JSON.stringify(user));
  }

  inactiveStorage.removeItem("token");
  inactiveStorage.removeItem("user");

  dispatchUserEvent();
}

export function updateStoredUser(user) {
  if (!user) return;

  let updated = false;

  if (localStorage.getItem("user")) {
    localStorage.setItem("user", JSON.stringify(user));
    updated = true;
  }

  if (sessionStorage.getItem("user")) {
    sessionStorage.setItem("user", JSON.stringify(user));
    updated = true;
  }

  if (!updated) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  dispatchUserEvent();
}

export function clearStoredAuth({ keepResetMode = false } = {}) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("user");

  if (!keepResetMode) {
    sessionStorage.removeItem("passwordResetMode");
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
