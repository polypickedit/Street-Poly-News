import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from "@vercel/speed-insights";
import App from "./App.tsx";
import "./index.css";

if (import.meta.env.PROD) {
  injectSpeedInsights();
}

createRoot(document.getElementById("root")!).render(<App />);
