import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";
import "./styles/base.css";
import App from "./App.jsx";
import { installHoverSfx } from "./lib/sfx.js";

installHoverSfx();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
