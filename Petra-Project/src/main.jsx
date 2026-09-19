import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { UserProvider } from "./context/UserContext.jsx";
import { SchoolProvider } from "./context/SchoolContext.jsx";
import { ToastProvider, ToastViewport } from "./context/ToastContext.jsx";
import "./index.css";
import "./Styles/petra-theme.css";
import "./Styles/petra-responsive.css";
import "./Styles/nuvora-theme.css";
import "./Styles/nuvora-minimal.css";
import App from "./App.jsx";
import { applyTheme } from "./utils/theme.js";
applyTheme();
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
