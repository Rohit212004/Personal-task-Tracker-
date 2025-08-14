// LoginPage.tsx
import React, { useState } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { LogIn, Sparkles, CheckCircle, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

type BackendResponse = {
  success: boolean;
  jwt?: string;
  user?: { name?: string; email?: string; profile_picture?: string };
  message?: string;
};

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'google' | 'credentials'>('google');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

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
      const res = await axios.post<BackendResponse>("http://localhost:8080/api/auth/google", { 
        Token: token 
      });
      if (res.data?.success && res.data.jwt) {
        localStorage.setItem("authToken", res.data.jwt);
        localStorage.setItem("user", JSON.stringify(res.data.user ?? {}));
        window.location.href = '/home';
      } else {
        setError(res.data?.message || "Authentication failed");
      }
    } catch (err: any) {
      try {
        const payload: any = jwtDecode(token);
        console.log("Decoded Google token (dev only):", payload);
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

  const handleCredentialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validation
    if (authMode === 'login') {
      if (!formData.username.trim() || !formData.password.trim()) {
        setError("Please fill in both username and password.");
        setLoading(false);
        return;
      }
    } else {
      if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim() || !formData.fullName.trim()) {
        setError("Please fill in all required fields.");
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      
      // Convert to PascalCase to match C# backend expectations
      const payload = authMode === 'login' 
        ? { 
            Username: formData.username.trim(), 
            Password: formData.password.trim() 
          }
        : { 
            Username: formData.username.trim(), 
            Email: formData.email.trim(), 
            Password: formData.password.trim(),
            FullName: formData.fullName.trim() 
          };

      console.log('Sending request to:', `http://localhost:8080${endpoint}`);
      console.log('Payload:', payload);

      const res = await axios.post<BackendResponse>(`http://localhost:8080${endpoint}`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response:', res.data);

      if (res.data?.success) {
        if (authMode === 'signup') {
          setSuccess("Account created successfully! Please login.");
          setAuthMode('login');
          setFormData({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
        } else if (res.data.jwt) {
          localStorage.setItem("authToken", res.data.jwt);
          localStorage.setItem("user", JSON.stringify(res.data.user ?? {}));
          window.location.href = '/home';
        }
      } else {
        setError(res.data?.message || `${authMode === 'login' ? 'Login' : 'Registration'} failed`);
      }
    } catch (err: any) {
      console.error('Request failed:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      const errorMessage = err.response?.data?.message || err.message || `${authMode === 'login' ? 'Login' : 'Registration'} failed. Please try again.`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ username: '', email: '', password: '', confirmPassword: '', fullName: '' });
    setError(null);
    setSuccess(null);
  };

  const switchAuthMode = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#c6ffdd] via-[#fbd786] to-[#f7797d] dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Auth Card */}
        <div className="relative bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm dark:backdrop-blur-none p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800">
                <Sparkles className="text-white" size={24} />
      </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Personal Task Tracker
              </h1>
                </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {authMode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
            </p>
            
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-r from-gray-500/20 to-gray-600/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-full blur-xl"></div>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex mb-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-1">
            <button
              onClick={() => switchAuthMode('login')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchAuthMode('signup')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                authMode === 'signup'
                  ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
            >
              Create user
            </button>
          </div>

          {/* Login Method Toggle (only for login) */}
          {authMode === 'login' && (
            <div className="flex mb-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl p-1">
              <button
                onClick={() => setLoginMethod('google')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === 'google'
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                Google
              </button>
              <button
                onClick={() => setLoginMethod('credentials')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginMethod === 'credentials'
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                }`}
              >
                Credentials
              </button>
            </div>
          )}

          {/* Google Login (only for login mode) */}
          {authMode === 'login' && loginMethod === 'google' && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                Continue with your Google account
              </p>
              
              <div className="flex justify-center">
                {loading ? (
                    <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-gray-100 rounded-xl">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
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
            </div>
          )}

          {/* Credentials Form */}
          {(authMode === 'signup' || (authMode === 'login' && loginMethod === 'credentials')) && (
            <form onSubmit={handleCredentialAuth} className="space-y-4">
              {/* Full Name (signup only) */}
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Email (signup only) */}
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password (signup only) */}
              {authMode === 'signup' && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white py-3 px-4 rounded-xl font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{authMode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                  </div>
                ) : (
                  authMode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>

              {/* Forgot Password Link (login only) */}
              {authMode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 font-medium transition-colors"
                    onClick={() => {/* Handle forgot password */}}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-xl text-sm text-center flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-xl text-sm text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;