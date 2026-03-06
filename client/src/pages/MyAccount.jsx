import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

function MyAccount() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    wishlistItems: 0,
    memberSince: "",
    lastLogin: "",
  });

  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError("");
        setIsLoading(true);

        const response = await api.get("/api/users/profile");
        
        setName(response.data?.name || "");
        setEmail(response.data?.email || "");

        // Mock stats - in real app, these would come from API
        setStats({
          totalOrders: 12,
          wishlistItems: 8,
          memberSince: "January 2024",
          lastLogin: "Today, 10:30 AM",
        });

      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load profile. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
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

    // Validation
    if (password && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setError("");
      setFeedback("");
      setIsSaving(true);

      const payload = {
        name,
        email,
      };

      if (password.trim()) {
        payload.password = password;
      }

      const response = await api.put("/api/users/profile", payload);

      setName(response.data?.name || name);
      setEmail(response.data?.email || email);
      setPassword("");
      setConfirmPassword("");
      setFeedback("Profile updated successfully.");

      // Update local storage
      const stored = localStorage.getItem("auth");
      if (stored) {
        try {
          const session = JSON.parse(stored);
          const nextSession = {
            ...session,
            user: {
              ...session.user,
              name: response.data?.name || name,
              email: response.data?.email || email,
            },
          };
          localStorage.setItem("auth", JSON.stringify(nextSession));
        } catch (storageError) {
          console.error(storageError);
        }
      }

      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update profile. Please try again.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <div className="h-64 bg-surface-secondary rounded-2xl" />
              </div>
              <div className="h-64 bg-surface-secondary rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Gradient */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
            My Account
          </h1>
          <p className="text-muted">
            Manage your profile, preferences, and account settings
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card p-5 hover-lift hover-glow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center text-xl">
                📦
              </div>
              <div>
                <p className="text-xs text-muted">Total Orders</p>
                <p className="text-xl font-bold text-primary">{stats.totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-5 hover-lift hover-glow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center text-xl">
                ❤️
              </div>
              <div>
                <p className="text-xs text-muted">Wishlist Items</p>
                <p className="text-xl font-bold text-primary">{stats.wishlistItems}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-5 hover-lift hover-glow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center text-xl">
                🗓️
              </div>
              <div>
                <p className="text-xs text-muted">Member Since</p>
                <p className="text-sm font-bold text-primary">{stats.memberSince}</p>
              </div>
            </div>
          </div>
          
          <div className="card p-5 hover-lift hover-glow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center text-xl">
                🔐
              </div>
              <div>
                <p className="text-xs text-muted">Last Login</p>
                <p className="text-sm font-bold text-primary">{stats.lastLogin}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl">👤</span>
                <h2 className="text-xl font-semibold text-primary">Profile Information</h2>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4 animate-shake">
                  <div className="flex items-center gap-3">
                    <span className="text-error text-lg">⚠️</span>
                    <p className="text-sm text-error">{error}</p>
                  </div>
                </div>
              )}
              
              {feedback && (
                <div className="mb-6 rounded-xl border border-success/20 bg-success/10 p-4 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <span className="text-success text-lg">✓</span>
                    <p className="text-sm text-success">{feedback}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name Field */}
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
                      className="input w-full pl-10 pr-4 py-2.5"
                      placeholder="Your full name"
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
                      className="input w-full pl-10 pr-4 py-2.5"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary">
                    New Password
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                      🔒
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input w-full pl-10 pr-12 py-2.5"
                      placeholder="Enter new password"
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
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-primary">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                      🔐
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input w-full pl-10 pr-12 py-2.5"
                      placeholder="Confirm new password"
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

                <p className="text-xs text-muted">
                  Leave password fields blank to keep your current password
                </p>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary px-6 py-2.5 text-sm group disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Changes</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    )}
                  </span>
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Security Tips */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-lg font-semibold text-primary">Security Tips</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Use a strong, unique password
                </li>
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Enable two-factor authentication
                </li>
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Never share your credentials
                </li>
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Log out from shared devices
                </li>
              </ul>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⏱️</span>
                <h3 className="text-lg font-semibold text-primary">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Last order</span>
                  <span className="text-primary font-medium">2 days ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Profile updated</span>
                  <span className="text-primary font-medium">Today</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Password changed</span>
                  <span className="text-primary font-medium">30 days ago</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-semibold text-primary">Quick Actions</h3>
              </div>
              <div className="space-y-2">
                <Link
                  to="/my-orders"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent-soft transition-colors group"
                >
                  <span className="text-sm text-primary">View Orders</span>
                  <span className="text-muted group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  to="/wishlist"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent-soft transition-colors group"
                >
                  <span className="text-sm text-primary">View Wishlist</span>
                  <span className="text-muted group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  to="/addresses"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent-soft transition-colors group"
                >
                  <span className="text-sm text-primary">Manage Addresses</span>
                  <span className="text-muted group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <Link
                  to="/payment-methods"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent-soft transition-colors group"
                >
                  <span className="text-sm text-primary">Payment Methods</span>
                  <span className="text-muted group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="mt-8 p-6 card border-error/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl text-error">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-error mb-1">Delete Account</h3>
                <p className="text-sm text-muted">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
            </div>
            <button className="btn-outline border-error text-error hover:bg-error/10 px-6 py-2">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MyAccount;
