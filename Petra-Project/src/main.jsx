import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UserProvider } from "./context/UserContext.jsx";
import { ToastProvider, ToastViewport } from "./context/ToastContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { applyTheme, getInitialTheme } from "./utils/theme.js";

applyTheme(getInitialTheme());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      <ToastProvider>
        <App />
        <ToastViewport />
      </ToastProvider>
    </UserProvider>
  </StrictMode>,
);
