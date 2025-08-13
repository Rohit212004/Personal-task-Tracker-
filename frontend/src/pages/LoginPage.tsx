import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogIn, Sparkles, CheckCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex items-center justify-center p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Welcome Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-6">
          {/* Header with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 rounded-xl mb-6 -mx-2">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <LogIn size={32} />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
              <p className="text-blue-100 text-sm">
                Sign in to access your task management dashboard
              </p>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          </div>

          {/* Features highlight */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl">
              <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
              <span className="text-sm text-gray-700">Organize and prioritize your tasks</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50/50 rounded-xl">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <span className="text-sm text-gray-700">Track progress with AI insights</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl">
              <CheckCircle size={20} className="text-purple-600 flex-shrink-0" />
              <span className="text-sm text-gray-700">Get smart notifications and reminders</span>
            </div>
          </div>

          {/* Google Login */}
          <div className="text-center">
            <p className="text-gray-600 mb-4 text-sm">
              Continue with your Google account
            </p>
            
            <div className="flex justify-center">
              {loading ? (
                <div className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="font-medium">Signing you in...</span>
                </div>
              ) : (
                <GoogleLogin 
                  onSuccess={handleGoogleLogin} 
                  onError={() => setError("Google Login failed")}
                  size="large"
                  theme="outline"
                  shape="rectangular"
                />
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Thought of the day card */}
        <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-white/50 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles size={20} className="text-blue-500" />
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              Thought of the Day
            </span>
          </div>
          <p className="text-gray-700 italic leading-relaxed">
            "The best way to predict the future is to create it." — Peter Drucker
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          Secure authentication powered by Google
        </div>
      </div>
    </div>
  );
};

export default LoginPage;