import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, getApiErrorMessage } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get("/api/users/me");
        if (!ignore) {
          setUser(response.data);
        }
      } catch {
        localStorage.removeItem("access_token");
        if (!ignore) {
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadUser();
    return () => {
      ignore = true;
    };
  }, []);

  async function login(email, password) {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);

    try {
      const tokenResponse = await api.post("/api/auth/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      localStorage.setItem("access_token", tokenResponse.data.access_token);

      const userResponse = await api.get("/api/users/me");
      setUser(userResponse.data);
      return userResponse.data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in"));
      throw error;
    }
  }

  async function register(email, password) {
    try {
      await api.post("/api/auth/register", { email, password });
      toast.success("Account created");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create account"));
      throw error;
    }
    return login(email, password);
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user && localStorage.getItem("access_token")),
      login,
      register,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
