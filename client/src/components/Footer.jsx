import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

function getSession() {
  const stored = localStorage.getItem("auth");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function Footer() {
  const year = new Date().getFullYear();
  const location = useLocation();
  const session = getSession();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAdmin = Boolean(session?.user?.isAdmin);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const socialLinks = [
    { name: "Instagram", icon: "📸", url: "#", color: "from-pink-500 to-purple-500" },
    { name: "Facebook", icon: "👍", url: "#", color: "from-blue-600 to-blue-700" },
    { name: "Twitter", icon: "🐦", url: "#", color: "from-sky-400 to-sky-500" },
    { name: "Pinterest", icon: "📌", url: "#", color: "from-red-600 to-red-700" },
  ];

  const footerLinks = [
    {
      title: "Shop",
      icon: "🛍️",
      links: [
        { label: "All fragrances", path: "/products", icon: "🌸" },
        { label: "New arrivals", path: "/products?sort=newest", icon: "✨" },
        { label: "Best rated", path: "/products?sort=rating", icon: "⭐" },
        { label: "Limited edition", path: "/products?filter=limited", icon: "💎" },
      ],
    },
    {
      title: "Discover",
      icon: "🔍",
      links: [
        { label: "Collections", path: "/#collections", icon: "🎯" },
        { label: "Fragrance notes", path: "/#notes", icon: "🌸" },
        { label: "Gift guide", path: "/gift-guide", icon: "🎁" },
        { label: "Blog", path: "/blog", icon: "📝" },
      ],
    },
    {
      title: "Account",
      icon: "👤",
      links: [
        { label: "My account", path: "/account", icon: "⚙️" },
        { label: "Orders", path: "/my-orders", icon: "📦" },
        { label: "Wishlist", path: "/wishlist", icon: "❤️" },
        { label: "Rewards", path: "/rewards", icon: "🎯" },
      ],
    },
    {
      title: "Support",
      icon: "💬",
      links: [
        { label: "Help center", path: "/help", icon: "❓" },
        { label: "Contact us", path: "/contact", icon: "📧" },
        { label: "Shipping", path: "/shipping", icon: "🚚" },
        { label: "Returns", path: "/returns", icon: "🔄" },
      ],
    },
  ];

  // Admin footer
  if (isAdminRoute && isAdmin) {
    return (
      <footer className="relative border-t border-border-subtle bg-surface-primary overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-accent-gradient opacity-5" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Admin Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔮</span>
                <h3 className="text-lg font-bold text-gradient">AuraScents Admin</h3>
              </div>
              <p className="text-sm text-muted">
                Internal dashboard for managing products, orders, and customers.
              </p>
              <div className="flex gap-3">
                <span className="badge badge-accent">v2.0.0</span>
                <span className="badge bg-success/10 text-success border border-success/20">
                  Secure
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-primary">Quick Stats</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Products</span>
                  <span className="text-primary font-medium">156</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Orders</span>
                  <span className="text-primary font-medium">1,234</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Customers</span>
                  <span className="text-primary font-medium">892</span>
                </div>
              </div>
            </div>

            {/* Admin Links */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-primary">Quick Links</h4>
              <div className="space-y-2">
                {["Dashboard", "Products", "Orders", "Customers"].map((item) => (
                  <Link
                    key={item}
                    to={`/admin/${item.toLowerCase()}`}
                    className="block text-sm text-muted hover:text-accent-primary transition-colors group"
                  >
                    <span className="inline-block w-20">{item}</span>
                    <span className="opacity-0 group-hover:opacity-100 ml-2">→</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-primary">System</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-muted">All systems operational</span>
                </div>
                <p className="text-xs text-muted">
                  Last backup: {new Date().toLocaleDateString()}
                </p>
                <p className="text-xs text-muted">
                  © {year} AuraScents Admin Console
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-border-subtle flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted">
              ⚡ Admin access • {session?.user?.name} • {session?.user?.role}
            </p>
            <div className="flex gap-4">
              <Link to="/admin/settings" className="text-xs text-muted hover:text-primary">
                Settings
              </Link>
              <Link to="/admin/logs" className="text-xs text-muted hover:text-primary">
                Logs
              </Link>
              <Link to="/admin/backup" className="text-xs text-muted hover:text-primary">
                Backup
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  // Public footer
  return (
    <footer className="relative border-t border-border-subtle bg-surface-primary overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-page-gradient" />
      <div className="absolute inset-0 bg-accent-gradient opacity-5" />
      
      {/* Floating perfume bottles decoration */}
      <div className="absolute left-0 top-0 text-6xl opacity-5 transform -rotate-12 hidden lg:block">
        🌸
      </div>
      <div className="absolute right-0 bottom-0 text-6xl opacity-5 transform rotate-12 hidden lg:block">
        ✨
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="group inline-flex items-center gap-2">
                <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
                  🌸
                </span>
                <span className="text-2xl font-bold text-gradient">AuraScents</span>
              </Link>
              
              <p className="text-muted max-w-md leading-relaxed">
                Curated fragrances for every mood, season, and occasion. 
                Discover your signature scent with our expert-guided collection.
              </p>

              {/* Newsletter Signup */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <span>📧</span> Subscribe to our newsletter
                </h4>
                <form
                  onSubmit={handleNewsletterSubmit}
                  className="flex flex-col sm:flex-row gap-2 max-w-md"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="input flex-1 text-sm"
                    required
                  />
                  <button 
                    type="submit" 
                    className="btn-primary px-4 py-2 text-sm whitespace-nowrap group"
                  >
                    {isSubscribed ? (
                      <span className="flex items-center gap-1">
                        <span>✓</span> Subscribed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        Subscribe
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    )}
                  </button>
                </form>
                {isSubscribed && (
                  <p className="text-xs text-success animate-slide-up">
                    ✨ Thanks for subscribing! Check your inbox for a welcome gift.
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary">Follow us</h4>
                <div className="flex flex-wrap gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${social.color} rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity`} />
                      <div className="relative h-10 w-10 rounded-full border border-border-subtle bg-surface-secondary flex items-center justify-center text-xl hover:border-accent-primary hover:scale-110 transition-all duration-300">
                        {social.icon}
                      </div>
                      <span className="sr-only">{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Links Columns */}
            {footerLinks.map((column) => (
              <div key={column.title} className="space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <span>{column.icon}</span>
                  {column.title}
                </h3>
                <ul className="space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="group flex items-center gap-2 text-sm text-muted hover:text-accent-primary transition-colors"
                      >
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          {link.icon}
                        </span>
                        <span>{link.label}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border-subtle py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <div className="text-xs text-muted text-center lg:text-left">
              <p>© {year} AuraScents. All rights reserved.</p>
              <p className="mt-1">
                Crafted with <span className="text-accent-primary animate-pulse">❤️</span> for fragrance lovers
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1 text-muted">
                <span className="text-success">✓</span>
                Secure checkout
              </div>
              <div className="flex items-center gap-1 text-muted">
                <span className="text-success">✓</span>
                Free shipping
              </div>
              <div className="flex items-center gap-1 text-muted">
                <span className="text-success">✓</span>
                100% authentic
              </div>
            </div>

            {/* Payment Icons */}
            <div className="flex gap-2">
              {['💳', '📱', '🔒', '🚚'].map((icon, index) => (
                <div
                  key={index}
                  className="h-8 w-8 rounded-lg border border-border-subtle bg-surface-secondary flex items-center justify-center text-sm hover:border-accent-primary transition-colors"
                >
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms of service
            </Link>
            <span>•</span>
            <Link to="/shipping" className="hover:text-primary transition-colors">
              Shipping info
            </Link>
            <span>•</span>
            <Link to="/returns" className="hover:text-primary transition-colors">
              Returns policy
            </Link>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="absolute -top-5 right-8 h-10 w-10 rounded-full bg-accent-primary text-white shadow-lg hover:shadow-accent hover:scale-110 transition-all duration-300 flex items-center justify-center group"
        aria-label="Back to top"
      >
        <span className="group-hover:-translate-y-1 transition-transform">↑</span>
      </button>
    </footer>
  );
}

export default Footer;
