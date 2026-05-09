import React from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { toast } from "react-toastify";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function GoogleAuthButton({ onAuthenticated }) {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Google sign in failed");
      }

      onAuthenticated(data);
    } catch (error) {
      toast.error(error.message || "Google sign in failed");
    }
  };

  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes("your-google")) {
    return (
      <button className="google-auth-disabled" type="button" disabled>
        Add Google Client ID to enable Google sign in
      </button>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="google-auth-button">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error("Google sign in was cancelled")}
          shape="rectangular"
          size="large"
          text="continue_with"
          width="360"
        />
      </div>
    </GoogleOAuthProvider>
  );
}

export default GoogleAuthButton;
