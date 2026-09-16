import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./app/App";
import "./styles/index.css";

// Google Identity Services client id is baked at build time via VITE_GOOGLE_CLIENT_ID
// (see Dockerfile.frontend + .github/workflows/cd.yml). When it's missing — e.g.
// local dev without the env, or a build that opted out of Google login — we
// skip the provider so the rest of the app still renders. The GoogleSignInButton
// component independently no-ops in that case.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const root = googleClientId
  ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    )
  : <App />;

createRoot(document.getElementById("root")!).render(root);
