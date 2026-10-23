import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import EntranceGate from "./components/EntranceGate";
import { I18nProvider } from "./lib/i18n";

document.documentElement.classList.add("js");
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <I18nProvider>
      <EntranceGate>
        <App />
      </EntranceGate>
    </I18nProvider>
  </React.StrictMode>,
);
