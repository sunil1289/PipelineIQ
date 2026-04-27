import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("piq-theme") || "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("piq-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

export function useWideView() {
  const [wide, setWide] = useState(
    () => localStorage.getItem("piq-wide") === "true"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("wide-layout", wide);
    localStorage.setItem("piq-wide", wide);
  }, [wide]);

  const toggle = () => setWide((w) => !w);
  return { wide, toggle };
}