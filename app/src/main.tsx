import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import EntranceGate from "./components/EntranceGate";

document.documentElement.classList.add("js");
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EntranceGate><App /></EntranceGate>
  </React.StrictMode>,
);
