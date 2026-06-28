import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, getApiErrorMessage } from "../api/client";
import {
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
  saveStoredUser,
} from "../storage/auth";
import {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  error: string | null;
  isSubmitting: boolean;
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  resetMode: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  refreshMe: () => Promise<AuthUser | null>;
  replaceUser: (user: AuthUser | null) => Promise<void>;
  applySession: (
    session: AuthSession,
    options?: { resetMode?: boolean }
  ) => Promise<void>;
  clearResetMode: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
        ]);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setStatus("authenticated");
          return;
        }
      } catch (bootstrapError) {
        console.warn("Failed to restore auth session", bootstrapError);
      }

      setStatus("unauthenticated");
    }

    bootstrap();
  }, []);

  const persistSession = useCallback(async (session: AuthSession) => {
    await saveAuthSession(session);
    setToken(session.token);
    setUser(session.user);
    setStatus("authenticated");
    setError(null);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", payload);
      const session = normalizeAuthResponse(response.data);
      await persistSession(session);
    } catch (loginError) {
      const message = getApiErrorMessage(loginError, "Prijava nije uspjela.");
      setError(message);
      throw loginError;
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const register = useCallback(async (payload: RegisterPayload) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await api.post("/auth/register", payload);
      const session = normalizeAuthResponse(response.data);
      await persistSession(session);
    } catch (registerError) {
      const message = getApiErrorMessage(
        registerError,
        "Registracija nije uspjela."
      );
      setError(message);
      throw registerError;
    } finally {
      setIsSubmitting(false);
    }
  }, [persistSession]);

  const logout = useCallback(async () => {
    setIsSubmitting(true);

    try {
      await api
        .post("/users/push-token", {
          enabled: false,
        })
        .catch((pushError) => {
          console.warn("Failed to disable push token", pushError);
        });

      await clearAuthSession();
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
      setError(null);
      setResetMode(false);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const replaceUser = useCallback(async (nextUser: AuthUser | null) => {
    await saveStoredUser(nextUser);
    setUser(nextUser);
  }, []);

  const applySession = useCallback(
    async (session: AuthSession, options?: { resetMode?: boolean }) => {
      await persistSession(session);
      setResetMode(options?.resetMode === true);
    },
    [persistSession]
  );

  const clearResetMode = useCallback(() => {
    setResetMode(false);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const response = await api.get("/users/me");
      const nextUser = response.data?.user as AuthUser | undefined;

      if (nextUser) {
        await replaceUser(nextUser);
        return nextUser;
      }
    } catch (refreshError) {
      console.warn("Failed to refresh current user", refreshError);
    }

    return null;
  }, [replaceUser]);

  const value = useMemo(
    () => ({
      error,
      isSubmitting,
      status,
      token,
      user,
      resetMode,
      login,
      logout,
      register,
      refreshMe,
      replaceUser,
      applySession,
      clearResetMode,
    }),
    [
      error,
      isSubmitting,
      status,
      token,
      user,
      resetMode,
      login,
      logout,
      register,
      refreshMe,
      replaceUser,
      applySession,
      clearResetMode,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

function normalizeAuthResponse(data: any): AuthSession {
  const token = data?.token;
  const user = data?.user;

  if (!token || !user) {
    throw new Error("Auth response does not contain token and user.");
  }

  return {
    token,
    user,
  };
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
