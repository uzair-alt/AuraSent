import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function NotAuthorizedPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);
  const [isExiting, setIsExiting] = useState(false);

  const handleAutoRedirect = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => navigate("/"), 500);
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleAutoRedirect]);

  return (
    <div className="min-h-screen bg-page relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-page-gradient" />
      <div className="absolute inset-0 bg-accent-gradient opacity-5" />
      
      {/* Decorative Elements */}
      <div className="absolute left-0 top-1/4 text-8xl opacity-10 animate-float-slow">
        🚫
      </div>
      <div className="absolute right-0 bottom-1/4 text-8xl opacity-10 animate-float-slower">
        🔒
      </div>
      
      {/* Animated Circles */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-warning/10 blur-3xl animate-pulse-slow" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-error/10 blur-3xl animate-pulse-slower" />

      {/* Main Content */}
      <div className={`relative min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="max-w-2xl w-full">
          {/* Main Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-warning/50 to-error/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
            
            <div className="relative bg-surface-primary border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
              {/* Decorative Header Bar */}
              <div className="h-2 bg-gradient-to-r from-warning to-error" />
              
              {/* Content */}
              <div className="p-8 md:p-12 text-center">
                {/* Icon */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-warning/10 animate-ping" />
                  </div>
                  <div className="relative inline-block">
                    <span className="text-8xl filter drop-shadow-2xl animate-bounce-slow">
                      🚫
                    </span>
                    <span className="absolute -top-2 -right-2 text-3xl animate-pulse">
                      🔒
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/20 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-warning">
                    Access Restricted • 403
                  </span>
                </div>

                {/* Main Message */}
                <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                  Access Denied
                </h1>
                
                <p className="text-xl text-primary mb-3">
                  You do not have permission to view this page
                </p>
                
                <p className="text-muted mb-8 max-w-md mx-auto">
                  This section is only available to administrators. If you believe this is an error, please contact the store owner for assistance.
                </p>

                {/* Admin Contact Card */}
                <div className="mb-8 p-6 rounded-2xl bg-surface-secondary border border-border-subtle">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-accent-soft flex items-center justify-center text-2xl">
                      👤
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-primary">Need admin access?</p>
                      <p className="text-xs text-muted">Contact the store administrator to request permissions</p>
                    </div>
                    <div className="text-2xl text-muted">→</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Link
                    to="/"
                    className="btn-primary px-8 py-3 text-base group relative overflow-hidden"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsExiting(true);
                      setTimeout(() => navigate("/"), 500);
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <span>🏠</span>
                      <span>Go back home</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <button
                    onClick={() => window.history.back()}
                    className="btn-outline px-8 py-3 text-base group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span className="group-hover:-translate-x-1 transition-transform">←</span>
                      <span>Go back</span>
                    </span>
                  </button>
                </div>

                {/* Auto-redirect Countdown */}
                <div className="text-sm text-muted">
                  <p>Redirecting to homepage in</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          className="text-border-subtle"
                          strokeWidth="2"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                        <circle
                          className="text-accent-primary transition-all duration-1000"
                          strokeWidth="2"
                          strokeDasharray={175.9}
                          strokeDashoffset={175.9 * (1 - countdown / 10)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="28"
                          cx="32"
                          cy="32"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
                        {countdown}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Help Links */}
                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <div className="flex flex-wrap justify-center gap-4 text-xs">
                    <Link to="/contact" className="text-muted hover:text-primary transition-colors">
                      Contact Support
                    </Link>
                    <span className="text-muted">•</span>
                    <Link to="/help" className="text-muted hover:text-primary transition-colors">
                      Help Center
                    </Link>
                    <span className="text-muted">•</span>
                    <Link to="/about" className="text-muted hover:text-primary transition-colors">
                      About Us
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-xs text-muted">
            <p className="flex items-center justify-center gap-2">
              <span className="text-lg">🔒</span>
              Your access attempt has been logged for security purposes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotAuthorizedPage;
