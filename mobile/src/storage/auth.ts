import * as SecureStore from "expo-secure-store";

import { AuthSession, AuthUser } from "../types/auth";

const AUTH_TOKEN_KEY = "studmate.auth.token";
const AUTH_USER_KEY = "studmate.auth.user";

let tokenCache: string | null = null;
let userCache: AuthUser | null = null;

export async function saveAuthSession(session: AuthSession) {
  tokenCache = session.token;
  userCache = session.user;

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(session.user));
}

export async function saveStoredUser(user: AuthUser | null) {
  userCache = user;

  if (!user) {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    return;
  }

  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
}

export async function clearAuthSession() {
  tokenCache = null;
  userCache = null;

  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(AUTH_USER_KEY);
}

export async function getStoredToken() {
  if (tokenCache) {
    return tokenCache;
  }

  tokenCache = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return tokenCache;
}

export async function getStoredUser() {
  if (userCache) {
    return userCache;
  }

  const serializedUser = await SecureStore.getItemAsync(AUTH_USER_KEY);
  if (!serializedUser) {
    return null;
  }

  try {
    userCache = JSON.parse(serializedUser) as AuthUser;
    return userCache;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
    return null;
  }
}

export function getCachedToken() {
  return tokenCache;
}

export function getCachedUser() {
  return userCache;
}
