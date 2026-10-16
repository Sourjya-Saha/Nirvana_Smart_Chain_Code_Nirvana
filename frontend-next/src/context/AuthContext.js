"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId");
      const storedUserType = localStorage.getItem("userType");
      const storedUserName = localStorage.getItem("userName");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (storedUserId) setUserId(storedUserId);
      if (storedUserType) setUserType(storedUserType);
      if (storedUserName) setUserName(storedUserName);
      setIsReady(true);

      // If we have a numeric userId but no stored username, resolve it from backend
      if (storedUserId && !storedUserName) {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
        fetch(`${API_BASE}/get_name_of_retailer_by_user_id`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: storedUserId }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.user_id) {
              setUserName(data.user_id);
              localStorage.setItem("userName", data.user_id);
            }
          })
          .catch((err) => {
            console.warn("User name query:", err);
          });
      }
    }
  }, []);

  const login = (id, type, name) => {
    setUserId(id);
    if (type) setUserType(type);
    if (name) setUserName(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("userId", id);
      if (type) localStorage.setItem("userType", type);
      if (name) localStorage.setItem("userName", name);
    }
  };

  const logout = () => {
    setUserId(null);
    setUserName(null);
    setUserType(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      localStorage.removeItem("userType");
      window.location.href = "/auth/login";
    }
  };

  const isAuthenticated = () => userId !== null;

  return (
    <AuthContext.Provider
      value={{
        userId,
        userName,
        userType,
        login,
        logout,
        isAuthenticated,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
