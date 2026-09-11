import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UserProvider } from "./context/UserContext.jsx";
import { SchoolProvider } from "./context/SchoolContext.jsx";
import { ToastProvider, ToastViewport } from "./context/ToastContext.jsx";
import "./index.css";
import App from "./App.jsx";
import { applyTheme, getInitialTheme } from "./utils/theme.js";

applyTheme(getInitialTheme());

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UserProvider>
      <SchoolProvider>
        <ToastProvider>
          <App />
          <ToastViewport />
        </ToastProvider>
      </SchoolProvider>
    </UserProvider>
  </StrictMode>,
);
