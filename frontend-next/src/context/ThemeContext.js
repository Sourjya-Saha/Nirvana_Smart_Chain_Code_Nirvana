"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("app_theme");
        if (saved === "light" || saved === "dark") return saved;
      } catch (e) {}
    }
    return "dark";
  });

  useEffect(() => {
    // Load saved preference or default to dark
    const saved = localStorage.getItem("app_theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      document.documentElement.classList.toggle("light", saved === "light");
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("app_theme", nextTheme);
    document.documentElement.classList.toggle("light", nextTheme === "light");
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
