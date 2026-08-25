import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import App from "./App.tsx";
import { store } from "@/app/store";
import { joyTheme } from "@/theme/joyTheme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <CssVarsProvider theme={joyTheme} defaultMode="light">
        <CssBaseline />
        <App />
        <ToastContainer position="top-right" autoClose={4000} />
      </CssVarsProvider>
    </Provider>
  </StrictMode>,
);
