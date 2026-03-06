import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  // Simulate loading for smooth animation
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };

  const getPasswordStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "bg-error";
    if (score <= 3) return "bg-warning";
    if (score <= 4) return "bg-accent-primary";
    return "bg-success";
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return "Weak";
    if (score <= 3) return "Fair";
    if (score <= 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!agreeToTerms) {
      setError("You must agree to the Terms and Privacy Policy");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/auth/register", {
        name,
        email,
        password,
      });

      const data = response.data;

      localStorage.setItem(
        "auth",
        JSON.stringify({
          token: data.token,
          user: {
            id: data._id,
            name: data.name,
            email: data.email,
            isAdmin: data.isAdmin,
          },
        })
      );

      // Redirect with success animation
      setTimeout(() => navigate("/"), 500);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message || "Unable to connect to server";
      setError(message);
      setIsSubmitting(false);
    }
  };

  // Demo fill for testing
  const fillDemoData = () => {
    setName("John Doe");
    setEmail("john@example.com");
    setPassword("Demo123!@#");
    setConfirmPassword("Demo123!@#");
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
      
      {/* Floating Decorative Elements */}
      <div className="absolute left-0 top-1/4 text-7xl opacity-10 animate-float-slow">
        🌸
      </div>
      <div className="absolute right-0 bottom-1/4 text-7xl opacity-10 animate-float-slower">
        ✨
      </div>
      <div className="absolute left-1/4 bottom-1/4 text-6xl opacity-10 animate-float">
        🌿
      </div>
      
      {/* Animated Circles */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent-primary/10 blur-3xl animate-pulse-slow" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-accent-secondary/10 blur-3xl animate-pulse-slower" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent-tertiary/5 blur-3xl animate-pulse" />

      <div className="relative w-full max-w-md px-4">
        {/* Logo/Brand */}
        <div className="text-center mb-6 animate-slide-down">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gradient">AuraScents</h1>
          </Link>
          <p className="text-muted text-sm mt-2">
            Begin your fragrance journey with us
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
              Create Account
            </h2>
            <p className="text-sm text-muted text-center mb-8">
              Join our community of fragrance lovers
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4 animate-shake">
                <div className="flex items-center gap-3">
                  <span className="text-error text-lg">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-error">Registration Failed</p>
                    <p className="text-xs text-error/80">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Demo Fill Hint */}
            <div className="mb-6 p-4 rounded-xl bg-accent-soft border border-accent-primary/20">
              <p className="text-xs text-muted mb-2">Quick fill for testing:</p>
              <button
                onClick={fillDemoData}
                className="text-sm text-accent-primary hover:text-accent-secondary transition-colors flex items-center gap-2 group"
              >
                <span className="text-lg">⚡</span>
                <span>Fill with demo data</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">
                  Full Name
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                    👤
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    placeholder="John Doe"
                    autoComplete="name"
                  />
                </div>
              </div>

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
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3 space-y-2 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Password strength:</span>
                      <span className={`text-xs font-medium ${
                        getPasswordStrengthScore() <= 2 ? 'text-error' :
                        getPasswordStrengthScore() <= 3 ? 'text-warning' :
                        getPasswordStrengthScore() <= 4 ? 'text-accent-primary' : 'text-success'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-tertiary rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                        style={{ width: `${(getPasswordStrengthScore() / 5) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? 'text-success' : 'text-muted'}`}>
                        <span>{passwordStrength.hasMinLength ? '✓' : '○'}</span> 8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.hasUpperCase ? 'text-success' : 'text-muted'}`}>
                        <span>{passwordStrength.hasUpperCase ? '✓' : '○'}</span> Uppercase
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.hasLowerCase ? 'text-success' : 'text-muted'}`}>
                        <span>{passwordStrength.hasLowerCase ? '✓' : '○'}</span> Lowercase
                      </div>
                      <div className={`flex items-center gap-1 ${passwordStrength.hasNumber ? 'text-success' : 'text-muted'}`}>
                        <span>{passwordStrength.hasNumber ? '✓' : '○'}</span> Number
                      </div>
                      <div className={`flex items-center gap-1 col-span-2 ${passwordStrength.hasSpecialChar ? 'text-success' : 'text-muted'}`}>
                        <span>{passwordStrength.hasSpecialChar ? '✓' : '○'}</span> Special character
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">
                  Confirm Password
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                    🔐
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-surface-secondary border border-border-subtle rounded-xl text-primary placeholder:text-muted focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword && (
                  <div className={`text-xs flex items-center gap-1 mt-1 ${
                    password === confirmPassword ? 'text-success' : 'text-error'
                  }`}>
                    <span>{password === confirmPassword ? '✓' : '✗'}</span>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary focus:ring-offset-0"
                />
                <label htmlFor="terms" className="text-xs text-muted">
                  I agree to the{" "}
                  <Link to="/terms" className="text-accent-primary hover:text-accent-secondary">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-accent-primary hover:text-accent-secondary">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !agreeToTerms}
                className="relative w-full btn-primary py-3 text-base font-medium overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`relative z-10 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-0' : ''}`}>
                  Create Account
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

            {/* Benefits List */}
            <div className="mt-6 p-4 rounded-xl bg-surface-secondary border border-border-subtle">
              <h3 className="text-xs font-semibold text-primary mb-2 flex items-center gap-2">
                <span>✨</span> Member benefits
              </h3>
              <ul className="space-y-2 text-xs text-muted">
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  Early access to new fragrances
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  Exclusive member discounts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  Personalized recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-success">✓</span>
                  Birthday surprise gifts
                </li>
              </ul>
            </div>

            {/* Sign In Link */}
            <p className="mt-8 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-accent-primary hover:text-accent-secondary font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
