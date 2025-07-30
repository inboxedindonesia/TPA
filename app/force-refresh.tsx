"use client";

import { useEffect } from "react";

export default function ForceRefresh() {
  useEffect(() => {
    // Force refresh CSS
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href) {
        const newHref = href.includes("?")
          ? `${href}&v=${Date.now()}`
          : `${href}?v=${Date.now()}`;
        link.setAttribute("href", newHref);
      }
    });

    // Force light theme
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");

    // Set CSS variables for light theme
    document.documentElement.style.setProperty("--foreground-rgb", "0, 0, 0");
    document.documentElement.style.setProperty(
      "--background-start-rgb",
      "255, 255, 255"
    );
    document.documentElement.style.setProperty(
      "--background-end-rgb",
      "249, 250, 251"
    );
  }, []);

  return null;
}
