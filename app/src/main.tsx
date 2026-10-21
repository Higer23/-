import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

document.documentElement.classList.add("js");
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
