import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.PROD && typeof window !== "undefined") {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocal) {
    try {
      injectSpeedInsights();
    } catch { void 0; }
  }
}

createRoot(document.getElementById("root")!).render(<App />);
