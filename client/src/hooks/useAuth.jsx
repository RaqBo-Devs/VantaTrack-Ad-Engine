import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const {
    data: user,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
      // Store token in localStorage for API requests
      if (data.token) {
        localStorage.setItem('vantatrack_token', data.token);
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Registration removed - VantaTrack now uses invite-only onboarding

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      localStorage.removeItem('vantatrack_token');
    },
    onError: (error) => {
      console.error('Logout failed:', error);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
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