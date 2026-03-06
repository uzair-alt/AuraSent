import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(15);
  const [isExiting, setIsExiting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

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

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const floatingEmojis = ["🔍", "🌿", "🌸", "✨", "💨", "🍃"];

  return (
    <div className="min-h-screen bg-page relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-page-gradient" />
      <div className="absolute inset-0 bg-accent-gradient opacity-5" />
      
      {/* Parallax Floating Elements */}
      {floatingEmojis.map((emoji, index) => (
        <div
          key={index}
          className="absolute text-6xl opacity-10 animate-float-slow pointer-events-none"
          style={{
            left: `${20 + (index * 15)}%`,
            top: `${10 + (index * 20)}%`,
            animationDelay: `${index * 0.5}s`,
            transform: `translate(${mousePosition.x * (index + 1)}px, ${mousePosition.y * (index + 1)}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          {emoji}
        </div>
      ))}

      {/* Animated Gradient Orbs */}
      <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-accent-primary/10 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-20 h-64 w-64 rounded-full bg-accent-secondary/10 blur-3xl animate-pulse-slower" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent-tertiary/5 blur-3xl animate-pulse" />

      {/* Main Content */}
      <div className={`relative min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        <div className="max-w-3xl w-full">
          {/* Main Card */}
          <div 
            className="relative group"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-primary/50 via-accent-secondary/50 to-accent-tertiary/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
            
            <div className="relative bg-surface-primary border border-border-subtle rounded-3xl shadow-2xl overflow-hidden">
              {/* Animated Header Bar */}
              <div className="h-2 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary animate-gradient-x" />
              
              {/* Content */}
              <div className="p-8 md:p-12 text-center">
                {/* 404 Animation */}
                <div className="relative mb-8">
                  {/* Background Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 rounded-full border-2 border-dashed border-accent-primary/20 animate-spin-slow" />
                  </div>
                  
                  {/* Main 404 Display */}
                  <div className="relative flex items-center justify-center gap-4">
                    {['4', '0', '4'].map((digit, index) => (
                      <div
                        key={index}
                        className={`relative transform transition-all duration-500 ${
                          isHovering ? 'scale-110' : ''
                        }`}
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        <span className="text-8xl md:text-9xl font-bold text-gradient animate-bounce-slow">
                          {digit}
                        </span>
                        {index === 1 && (
                          <span className="absolute -top-4 -right-4 text-4xl animate-pulse">
                            👻
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Floating Perfume Bottle */}
                  <div className="absolute -right-4 -bottom-4 text-4xl animate-float">
                    🌸
                  </div>
                  <div className="absolute -left-4 -top-4 text-4xl animate-float-slow">
                    ✨
                  </div>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-soft border border-accent-primary/20 mb-6">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-primary"></span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent-primary">
                    Error 404 • Page Not Found
                  </span>
                </div>

                {/* Main Message */}
                <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">
                  Lost Your Scent?
                </h1>
                
                <p className="text-xl text-primary mb-3">
                  The fragrance you're looking for seems to have evaporated
                </p>
                
                <p className="text-muted mb-8 max-w-md mx-auto">
                  The page you were searching for doesn't exist or may have been moved to a new location. 
                  Let's help you find your way back to our collection.
                </p>

                {/* Search Suggestions */}
                <div className="mb-8 p-6 rounded-2xl bg-surface-secondary border border-border-subtle">
                  <h3 className="text-sm font-semibold text-primary mb-4 flex items-center justify-center gap-2">
                    <span>🔍</span>
                    <span>Popular Searches</span>
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Citrus', 'Floral', 'Woody', 'Fresh', 'Gourmand'].map((term) => (
                      <Link
                        key={term}
                        to={`/products?notes=${term}`}
                        className="px-4 py-2 rounded-full bg-surface-primary border border-border-subtle text-xs text-primary hover:border-accent-primary hover:text-accent-primary transition-all hover:scale-105"
                      >
                        {term}
                      </Link>
                    ))}
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
                      <span className="group-hover:-translate-y-1 transition-transform">🏠</span>
                      <span>Return Home</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                    <span className="absolute inset-0 bg-gradient-to-r from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                  
                  <Link
                    to="/products"
                    className="btn-outline px-8 py-3 text-base group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Browse Collection</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </Link>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <Link
                    to="/products/new-arrivals"
                    className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all group"
                  >
                    <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">✨</span>
                    <span className="text-xs text-primary">New Arrivals</span>
                  </Link>
                  <Link
                    to="/collections"
                    className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all group"
                  >
                    <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">🎯</span>
                    <span className="text-xs text-primary">Collections</span>
                  </Link>
                  <Link
                    to="/best-sellers"
                    className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all group"
                  >
                    <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">⭐</span>
                    <span className="text-xs text-primary">Best Sellers</span>
                  </Link>
                  <Link
                    to="/sale"
                    className="p-3 rounded-xl bg-surface-secondary border border-border-subtle hover:border-accent-primary transition-all group"
                  >
                    <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">🏷️</span>
                    <span className="text-xs text-primary">Sale</span>
                  </Link>
                </div>

                {/* Auto-redirect Countdown */}
                <div className="text-sm text-muted">
                  <p>Taking you back to our homepage in</p>
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
                          strokeDashoffset={175.9 * (1 - countdown / 15)}
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
                    <span className="text-xs text-muted">seconds</span>
                  </div>
                </div>

                {/* Help Links */}
                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <div className="flex flex-wrap justify-center gap-4 text-xs">
                    <Link to="/contact" className="text-muted hover:text-primary transition-colors">
                      Contact Support
                    </Link>
                    <span className="text-muted">•</span>
                    <Link to="/search" className="text-muted hover:text-primary transition-colors">
                      Advanced Search
                    </Link>
                    <span className="text-muted">•</span>
                    <Link to="/sitemap" className="text-muted hover:text-primary transition-colors">
                      Sitemap
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fun Fact */}
          <div className="mt-6 text-center text-xs text-muted">
            <p className="flex items-center justify-center gap-2">
              <span className="text-lg">💡</span>
              Did you know? The world's most expensive perfume costs over $1 million
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
