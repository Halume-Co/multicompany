"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api";
import { AuthState, User } from "../types";

interface AuthActionResult {
  user: User | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<AuthActionResult>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "buyer" | "seller"
  ) => Promise<AuthActionResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const setAuthenticatedUser = (user: User) => {
    setAuthState({
      user,
      isLoading: false,
      isAuthenticated: true,
    });
  };

  const clearAuthentication = () => {
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const refreshUser = async (): Promise<User | null> => {
    const response = await api.getCurrentUser();
    const user = response.data?.user;

    if (response.success && user) {
      setAuthenticatedUser(user);
      return user;
    }

    clearAuthentication();
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const response = await api.getCurrentUser();
      const user = response.data?.user;

      if (!isMounted) {
        return;
      }

      if (response.success && user) {
        setAuthenticatedUser(user);
        return;
      }

      clearAuthentication();
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<AuthActionResult> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await api.loginUser(email, password);
      const user = response.data?.user;

      if (response.success && user) {
        setAuthenticatedUser(user);
        return { user, error: null };
      }
      clearAuthentication();
      return { user: null, error: response.error || "Login failed" };
    } catch {
      clearAuthentication();
      return { user: null, error: "Unable to reach the server" };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "buyer" | "seller"
  ): Promise<AuthActionResult> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await api.registerUser(email, password, name, role);
      const user = response.data?.user;

      if (response.success && user) {
        setAuthenticatedUser(user);
        return { user, error: null };
      }
      clearAuthentication();
      return { user: null, error: response.error || "Registration failed" };
    } catch {
      clearAuthentication();
      return { user: null, error: "Unable to reach the server" };
    }
  };

  const logout = async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      await api.logoutUser();
    } catch {
      // Logout should clear local state even if the network request fails.
    }

    clearAuthentication();
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
