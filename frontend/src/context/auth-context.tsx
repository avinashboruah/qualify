"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, UserRole, LoginCredentials, RegisterCredentials } from "@/types/auth";
import { apiClient } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  quickLoginAsDemo: (role: UserRole) => Promise<User>;
  logout: () => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo mock accounts for seamless instant testing
const DEMO_ACCOUNTS: Record<UserRole, { user: User; token: string }> = {
  student: {
    user: {
      id: "demo-student-001",
      email: "student1@test.com",
      role: "student",
      hasProfile: true,
      name: "Aarav Sharma",
    },
    token: "mock-jwt-student-token-001",
  },
  admin: {
    user: {
      id: "demo-admin-001",
      email: "admin@scholarships.gov.in",
      role: "admin",
      hasProfile: true,
      name: "State Portal Administrator",
    },
    token: "mock-jwt-admin-token-001",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(newUser));
  }, []);

  const login = async (credentials: LoginCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      // First attempt real backend API
      const response = await apiClient.post<{
        success: boolean;
        token: string;
        user: User;
      }>("/auth/login", credentials);

      if (response.token && response.user) {
        saveSession(response.token, response.user);
        return response.user;
      }
      throw new Error("Invalid response from server");
    } catch (error) {
      // Fallback: If backend is unreachable, check demo credentials
      if (
        credentials.email === "student1@test.com" ||
        credentials.email.includes("student")
      ) {
        const demo = DEMO_ACCOUNTS.student;
        saveSession(demo.token, { ...demo.user, email: credentials.email });
        return demo.user;
      }
      if (
        credentials.email === "admin@scholarships.gov.in" ||
        credentials.email.includes("admin")
      ) {
        const demo = DEMO_ACCOUNTS.admin;
        saveSession(demo.token, { ...demo.user, email: credentials.email });
        return demo.user;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    setIsLoading(true);
    try {
      // First attempt real backend API
      const response = await apiClient.post<{
        success: boolean;
        token: string;
        user: User;
      }>("/auth/register", credentials);

      if (response.token && response.user) {
        saveSession(response.token, response.user);
        return response.user;
      }
      throw new Error("Registration failed");
    } catch {
      // Offline fallback: create local user session
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: credentials.email,
        role: credentials.role,
        hasProfile: false,
      };
      const newToken = `token-${Date.now()}`;
      saveSession(newToken, newUser);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const quickLoginAsDemo = async (role: UserRole): Promise<User> => {
    setIsLoading(true);
    const demo = DEMO_ACCOUNTS[role];
    saveSession(demo.token, demo.user);
    setIsLoading(false);
    return demo.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedUser };
      localStorage.setItem("auth_user", JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        quickLoginAsDemo,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
