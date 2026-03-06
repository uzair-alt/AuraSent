import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    return remembered || "";
  });
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    const remembered = localStorage.getItem("rememberedEmail");
    return Boolean(remembered);
  });
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for smooth animation
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const data = response.data;

      // Store auth data
      const authData = {
        token: data.token,
        user: {
          id: data._id,
          name: data.name,
          email: data.email,
          isAdmin: data.isAdmin,
        },
      };

      localStorage.setItem("auth", JSON.stringify(authData));

      // Store email if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Redirect with success animation
      setTimeout(() => navigate("/"), 500);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message || "Unable to connect to server";
      setError(message);
      setIsSubmitting(false);
    }
  };

  // Demo credentials
  const fillDemoCredentials = () => {
    setEmail("demo@aurascents.com");
    setPassword("demo123");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-full max-w-md p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-3/4 mx-auto" />
            <div className="h-4 bg-surface-secondary rounded w-1/2 mx-auto" />
            <div className="space-y-4">
              <div className="h-12 bg-surface-secondary rounded" />
              <div className="h-12 bg-surface-secondary rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-page relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-page-gradient" />
      <div className="absolute inset-0 bg-accent-gradient opacity-5" />
      
      {/* Floating Perfume Bottles Decoration */}
      <div className="absolute left-0 top-1/4 text-7xl opacity-10 animate-float-slow">
        🌸
      </div>
      <div className="absolute right-0 bottom-1/4 text-7xl opacity-10 animate-float-slower">
        ✨
      </div>
      
      {/* Animated Circles */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent-primary/10 blur-3xl animate-pulse-slow" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-accent-secondary/10 blur-3xl animate-pulse-slower" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo/Brand */}
        <div className="text-center mb-6 animate-slide-down">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gradient">AuraScents</h1>
          </Link>
          <p className="text-muted text-sm mt-2">
            Welcome back to your fragrance journey
          </p>
        </div>

        {/* Main Card */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-accent-gradient rounded-2xl opacity-0 group-hover:opacity-20 blur transition-all duration-500" />
          
          <div className="relative bg-surface-primary border border-border-subtle rounded-2xl shadow-xl p-8 animate-slide-up">
            {/* Decorative Header Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-accent-gradient rounded-b-full" />

            <h2 className="text-2xl font-bold text-primary text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-muted text-center mb-8">
              Sign in to continue to your account
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4 animate-shake">
                <div className="flex items-center gap-3">
                  <span className="text-error text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-error">Login Failed</p>
                    <p className="text-xs text-error/80">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Credentials Hint */}
            <div className="mb-6 p-4 rounded-xl bg-accent-soft border border-accent-primary/20">
              <p className="text-xs text-muted mb-2">Demo Credentials:</p>
              <button
                onClick={fillDemoCredentials}
                className="text-sm text-accent-primary hover:text-accent-secondary transition-colors flex items-center gap-2 group"
              >
                <span className="text-lg">🔑</span>
                <span>Use demo account</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                    ✉️
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">
                  Password
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                    🔒
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-surface-secondary border border-border-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                  />
                  <span className="text-xs text-muted group-hover:text-primary transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent-primary hover:text-accent-secondary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full btn-primary py-3 text-base font-medium overflow-hidden group"
              >
                <span className={`relative z-10 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-0' : ''}`}>
                  Sign In
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                
                {isSubmitting && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Social Login */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-subtle" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-surface-primary text-muted">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border-subtle rounded-xl text-sm text-primary hover:bg-surface-secondary hover:border-accent-primary/50 transition-all group">
                  <span className="text-lg">📧</span>
                  <span>Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-border-subtle rounded-xl text-sm text-primary hover:bg-surface-secondary hover:border-accent-primary/50 transition-all group">
                  <span className="text-lg">🍏</span>
                  <span>Apple</span>
                </button>
              </div>
            </div>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-muted">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-accent-primary hover:text-accent-secondary font-medium transition-colors"
              >
                Create one now
              </Link>
            </p>

            {/* Terms */}
            <p className="mt-4 text-xs text-muted text-center">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="text-accent-primary hover:text-accent-secondary">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-accent-primary hover:text-accent-secondary">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
