import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type BackendResponse = {
  success: boolean;
  jwt?: string;
  user?: { name?: string; email?: string; profile_picture?: string };
  message?: string;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setError(null);
    setLoading(true);

    const token = credentialResponse?.credential;
    if (!token) {
      setError("No credential returned by Google.");
      setLoading(false);
      return;
    }

    try {
      // Option A (recommended): send to your backend to validate + create JWT + DB save
      const res = await axios.post<BackendResponse>("http://localhost:8080/api/auth/google", { token });
      if (res.data?.success && res.data.jwt) {
        // Save token (for production prefer httpOnly cookie set by backend)
        localStorage.setItem("authToken", res.data.jwt);
        // Optional: save user info
        localStorage.setItem("user", JSON.stringify(res.data.user ?? {}));
        window.location.href = '/home'; // Navigate directly to home page
      } else {
        setError(res.data?.message || "Authentication failed");
      }
    } catch (err: any) {
      // If backend is not ready, for quick local testing decode the token on the frontend:
      try {
        const payload: any = jwtDecode(token);
        // show decoded info locally (NOT secure; only for dev/testing)
        console.log("Decoded Google token (dev only):", payload);
        // Optionally store a dummy auth token so you can continue frontend dev:
        localStorage.setItem("authToken", token);
        localStorage.setItem("user", JSON.stringify({ name: payload.name, email: payload.email, picture: payload.picture }));
        window.location.href = '/home';
      } catch (decodeErr) {
        setError("Login failed (backend unreachable and token decode failed).");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
  style={{
    display: "flex",
    height: "100vh",
    width: "100vw",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: "url('/login.jpg')", // public folder image
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    position: "relative",
  }}
>
      {/* Overlay to make text more readable */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(3px)"
      }} />
      
      <div style={{ 
        width: 360, 
        padding: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        position: "relative",
        border: "1px solid rgba(255, 255, 255, 0.3)"
      }}>
        <h2 style={{ 
          textAlign: "center",
          fontSize: "28px",
          marginBottom: "16px",
          color: "#1a1a1a",
          fontWeight: "600"
        }}>Welcome Back</h2>
        <p style={{ 
          textAlign: "center", 
          color: "#666",
          marginBottom: "24px",
          fontSize: "16px"
        }}>Sign in with your Google account</p>

        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          marginTop: 20 
        }}>
          <GoogleLogin 
            onSuccess={handleGoogleLogin} 
            onError={() => setError("Google Login failed")} 
          />
        </div>

        {loading && (
          <p style={{ 
            textAlign: "center", 
            marginTop: "16px",
            color: "#4a4a4a" 
          }}>Processing...</p>
        )}
        {error && (
          <p style={{ 
            color: "#dc2626", 
            marginTop: "16px",
            textAlign: "center",
            padding: "8px",
            borderRadius: "4px",
            backgroundColor: "rgba(220, 38, 38, 0.1)"
          }}>{error}</p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;