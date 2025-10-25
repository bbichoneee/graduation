// src/main.jsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./api/fetch-bridge";



// Bootstrap & Project styles
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./styles/main.scss";

async function enableMocking() {
if (import.meta.env.MODE === "development" && import.meta.env.VITE_USE_MOCK === "1") {
  const { worker } = await import("./mocks/browser");
  await worker.start({ serviceWorker: { url: "/mockServiceWorker.js" }, onUnhandledRequest: "bypass" });
}
}


enableMocking().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
});
