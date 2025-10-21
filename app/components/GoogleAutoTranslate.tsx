"use client";

import { useEffect } from "react";

/**
 * Injects Google Translate Element and forces auto-translation to English.
 * Notes:
 * - This uses the legacy Website Translator script which still works for simple client-side translation.
 * - We set the `googtrans` cookie to /auto/en to force EN translation.
 * - We hide the default Google banner/frame to avoid layout shifts.
 */
export default function GoogleAutoTranslate() {
  useEffect(() => {
    // Guard: only run in browser
    if (typeof window === "undefined") return;

    // Avoid double-injecting
    const existingScript = document.getElementById("google-translate-script");
    if (existingScript) return;

    // Helper to set googtrans cookie with and without domain for robustness
    const setGoogTransCookie = (value: string) => {
      try {
        const hostname = window.location.hostname;
        const base = `googtrans=${value}; path=/; expires=${new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toUTCString()};`;
        // Without domain (works on localhost and most cases)
        document.cookie = base;
        // With domain (for subdomains)
        if (/\./.test(hostname)) {
          document.cookie = `${base} domain=.${hostname}`;
        }
      } catch {
        // no-op
      }
    };

    // Force translation to English
    setGoogTransCookie("/auto/en");

    // Inject minimal CSS to hide banner/frame and prevent layout shift
    const style = document.createElement("style");
    style.id = "google-translate-hide-style";
    style.innerHTML = `
      .goog-te-banner-frame { display: none !important; }
      .goog-te-gadget-icon { display: none !important; }
      .goog-te-gadget-simple { border: 0 !important; background: transparent !important; }
      .goog-tooltip { display: none !important; }
      .goog-te-balloon-frame { display: none !important; }
      body { top: 0 !important; }
    `;
    document.head.appendChild(style);

    // Create script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=__googleTranslateElementInit";
    // Define init callback globally
    (window as any).__googleTranslateElementInit = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g: any = (window as any).google;
        if (g && g.translate && g.translate.TranslateElement) {
          new g.translate.TranslateElement(
            {
              pageLanguage: "id",
              includedLanguages: "en",
              autoDisplay: false,
              layout: g.translate.TranslateElement.InlineLayout.SIMPLE,
            },
            "google_translate_element"
          );
        }
      } catch {
        // ignore
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      script.parentNode?.removeChild(script);
      const hideStyle = document.getElementById("google-translate-hide-style");
      hideStyle?.parentNode?.removeChild(hideStyle);
    };
  }, []);

  // Hidden container for the translate element (kept in DOM so it can initialize)
  return (
    <div
      id="google_translate_element"
      style={{ position: "fixed", visibility: "hidden", width: 0, height: 0, overflow: "hidden" }}
      aria-hidden
    />
  );
}
