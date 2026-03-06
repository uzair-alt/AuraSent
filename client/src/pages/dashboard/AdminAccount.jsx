import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

function AdminAccount() {
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
  const [activityLog, setActivityLog] = useState([]);
  
  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setError("");
        setIsLoading(true);

        const response = await api.get("/api/users/profile");
        setName(response.data?.name || "");
        setEmail(response.data?.email || "");

        // Mock activity log - in real app, this would come from API
        setActivityLog([
          { action: "Profile updated", timestamp: new Date(Date.now() - 86400000).toISOString(), ip: "192.168.1.1" },
          { action: "Password changed", timestamp: new Date(Date.now() - 172800000).toISOString(), ip: "192.168.1.1" },
          { action: "Login successful", timestamp: new Date().toISOString(), ip: "192.168.1.1" },
        ]);
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

  useEffect(() => {
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

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

      const stored = localStorage.getItem("auth");
      if (stored) {
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
      }

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-96 bg-surface-secondary rounded-2xl" />
              <div className="h-96 bg-surface-secondary rounded-2xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center text-xl">
              👑
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Admin Account
              </h1>
              <p className="text-muted">
                Manage your administrator profile and security settings
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
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

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile Form */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl">👤</span>
              <h2 className="text-xl font-semibold text-primary">Profile Information</h2>
            </div>

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
                    placeholder="Admin name"
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
                    placeholder="admin@example.com"
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

          {/* Right Column - Admin Tools */}
          <div className="space-y-6">
            {/* Admin Status Card */}
            <div className="card p-6 border-accent-primary/20 bg-accent-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-2xl">
                  👑
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Admin Privileges</h3>
                  <p className="text-xs text-muted">Full system access</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-success">✓</span>
                  <span className="text-primary">Product management</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-success">✓</span>
                  <span className="text-primary">Order processing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-success">✓</span>
                  <span className="text-primary">User management</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-success">✓</span>
                  <span className="text-primary">Analytics access</span>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-lg font-semibold text-primary">Security Tips</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Use a strong, unique password for admin access
                </li>
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Enable two-factor authentication
                </li>
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Regularly review access logs
                </li>
                <li className="flex items-start gap-2 text-sm text-muted">
                  <span className="text-accent-primary">•</span>
                  Log out after each admin session
                </li>
              </ul>
            </div>

            {/* Recent Activity Log */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📋</span>
                <h3 className="text-lg font-semibold text-primary">Recent Activity</h3>
              </div>
              <div className="space-y-3">
                {activityLog.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors">
                    <span className="text-lg">•</span>
                    <div className="flex-1">
                      <p className="text-sm text-primary">{log.action}</p>
                      <p className="text-xs text-muted">
                        {formatDate(log.timestamp)} • IP: {log.ip}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-xs text-accent-primary hover:text-accent-secondary transition-colors">
                View full activity log →
              </button>
            </div>

            {/* Quick Actions */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚡</span>
                <h3 className="text-lg font-semibold text-primary">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/admin/dashboard"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all text-center group"
                >
                  <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">📊</span>
                  <span className="text-xs text-primary">Dashboard</span>
                </Link>
                <Link
                  to="/admin/products"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all text-center group"
                >
                  <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">📦</span>
                  <span className="text-xs text-primary">Products</span>
                </Link>
                <Link
                  to="/admin/orders"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all text-center group"
                >
                  <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">📋</span>
                  <span className="text-xs text-primary">Orders</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all text-center group"
                >
                  <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">👥</span>
                  <span className="text-xs text-primary">Users</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 p-6 card border-error/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl text-error">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-error mb-1">Danger Zone</h3>
                <p className="text-sm text-muted">
                  Irreversible actions for admin account management
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline border-warning text-warning hover:bg-warning/10 px-4 py-2 text-sm">
                Disable 2FA
              </button>
              <button className="btn-outline border-error text-error hover:bg-error/10 px-4 py-2 text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminAccount;
