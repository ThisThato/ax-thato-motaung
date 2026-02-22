import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";
import "highlight.js/styles/github-dark.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </GoogleOAuthProvider>
        ) : (
            <BrowserRouter>
                <App />
            </BrowserRouter>
        )}
    </React.StrictMode>
);
