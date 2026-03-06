import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";

function getSession() {
  const stored = localStorage.getItem("auth");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [recentSearches, setRecentSearches] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("recentSearches");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const userMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchRef = useRef(null);
   const suggestionsRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    return "dark";
  });

  const isAdmin = Boolean(session?.user?.isAdmin);
  const isHome = location.pathname === "/";
  const isCollectionsSection = isHome && location.hash === "#collections";
  const isNotesSection = isHome && location.hash === "#notes";
  const isCartPage = location.pathname === "/cart";
  const isProductsPage = location.pathname.startsWith("/products");
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (activeDropdown && !event.target.closest('.dropdown-trigger')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  useEffect(() => {
    const handleClickOutsideSuggestions = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSuggestions);
    return () => document.removeEventListener("mousedown", handleClickOutsideSuggestions);
  }, []);

  useEffect(() => {
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, []);

  // Cart and wishlist counts
  useEffect(() => {
    const loadCartCount = () => {
      const stored = localStorage.getItem("cartItems");
      if (!stored) {
        setCartCount(0);
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const nextCount = parsed.reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(nextCount);
        } else {
          setCartCount(0);
        }
      } catch {
        setCartCount(0);
      }
    };

    const loadWishlistCount = async () => {
      if (!session || !session.user || isAdmin) {
        setWishlistCount(0);
        return;
      }
      try {
        const response = await api.get("/api/users/wishlist");
        const items = Array.isArray(response.data) ? response.data : [];
        setWishlistCount(items.length);
      } catch {
        setWishlistCount(0);
      }
    };

    loadCartCount();
    loadWishlistCount();

    const handleStorage = (event) => {
      if (event.key === "cartItems") {
        loadCartCount();
        setIsCartAnimating(true);
        setTimeout(() => setIsCartAnimating(false), 1000);
      }
    };

    const handleCartUpdated = () => {
      loadCartCount();
      setIsCartAnimating(true);
      setTimeout(() => setIsCartAnimating(false), 1000);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("cartItemsUpdated", handleCartUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("cartItemsUpdated", handleCartUpdated);
    };
  }, [isAdmin, session]);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    const className = theme === "light" ? "theme-light" : "theme-dark";
    root.classList.add(className);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem("auth");
    navigate("/login");
  };

  const storeRecentSearch = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setRecentSearches((previous) => {
      const filtered = previous.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      );
      const next = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("recentSearches", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleApplySearch = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    storeRecentSearch(trimmed);
    navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    setIsMobileSearchOpen(false);
    setIsSuggestionsOpen(false);
    setSearchTerm("");
  };

  const fetchSuggestions = async (query) => {
    try {
      setIsLoadingSuggestions(true);
      const response = await api.get("/api/products", {
        params: {
          page: 1,
          pageSize: 5,
          keyword: query,
        },
      });
      const productsData = Array.isArray(response.data.products)
        ? response.data.products
        : [];
      const names = productsData
        .map((item) => item && item.name)
        .filter((value, index, self) => Boolean(value) && self.indexOf(value) === index);
      setSuggestions(names);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    setIsSuggestionsOpen(true);
    suggestionTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(trimmed);
    }, 250);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchTerm.trim();
    if (!value) return;
    handleApplySearch(value);
  };

  const searchParams = new URLSearchParams(location.search);
  const currentSort = searchParams.get("sort") || "";
  const isNewArrivals = isProductsPage && (currentSort === "" || currentSort === "newest");
  const isBestRated = isProductsPage && currentSort === "rating";
  const isLightTheme = theme === "light";

  // Navigation items
  const navItems = [
    { label: "Shop", path: "/products", active: isProductsPage, icon: "🛍️" },
    { label: "New", path: "/products?sort=newest", active: isNewArrivals, icon: "✨" },
    { label: "Best rated", path: "/products?sort=rating", active: isBestRated, icon: "⭐" },
    { label: "Collections", path: "/#collections", active: isCollectionsSection, icon: "🎯" },
    { label: "Notes", path: "/#notes", active: isNotesSection, icon: "🌸" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-page-overlay backdrop-blur-lg shadow-lg" 
          : "bg-page backdrop-blur-sm"
      }`}
    >
      <nav className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2 py-2 md:h-16 md:flex-nowrap">
          {/* Logo Section */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="group relative text-xl font-bold tracking-tight"
              onClick={() => setActiveDropdown(null)}
            >
              <span className="text-gradient">AuraScents</span>
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent-gradient group-hover:w-full transition-all duration-300" />
            </Link>

            {/* Desktop Navigation */}
            {!isAdmin && (
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="group relative px-3 py-2"
                    onClick={() => setActiveDropdown(null)}
                  >
                    <span className={`relative z-10 text-sm font-medium transition-colors duration-200 ${
                      item.active 
                        ? "text-accent-primary" 
                        : "text-muted hover:text-primary"
                    }`}>
                      {item.label}
                    </span>
                    {item.active && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-accent-gradient animate-slide-up" />
                    )}
                    <span className="absolute inset-0 rounded-lg bg-accent-soft opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAuthPage && (
              <>
                {/* Desktop Search */}
                <form
                  onSubmit={handleSearchSubmit}
                  ref={suggestionsRef}
                  className={`relative hidden md:flex items-center gap-2 rounded-full border-2 px-4 py-2 transition-all duration-300 ${
                    isSearchFocused
                      ? "border-accent-primary shadow-accent w-80"
                      : "border-border-subtle w-64 hover:border-accent-primary/50"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`h-4 w-4 transition-colors duration-200 ${
                      isSearchFocused ? "text-accent-primary" : "text-muted"
                    }`}
                  >
                    <circle cx="11" cy="11" r="6" />
                    <line x1="16" y1="16" x2="20" y2="20" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder="Search perfumes..."
                    className="flex-1 bg-transparent text-sm text-primary placeholder:text-muted focus:outline-none"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="text-muted hover:text-primary transition-colors"
                    >
                      ✕
                    </button>
                  )}
                  {isSuggestionsOpen && (suggestions.length > 0 || recentSearches.length > 0 || isLoadingSuggestions) && (
                    <div className="absolute left-0 top-full mt-2 w-full rounded-2xl bg-surface-primary border border-border-subtle shadow-xl z-40">
                      <div className="max-h-80 overflow-y-auto py-2">
                        {searchTerm.trim().length === 0 && recentSearches.length > 0 && (
                          <div className="px-3 pb-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">
                              Recent searches
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {recentSearches.slice(0, 6).map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onMouseDown={(event) => {
                                    event.preventDefault();
                                    handleApplySearch(item);
                                  }}
                                  className="inline-flex items-center rounded-full bg-surface-secondary px-3 py-1 text-xs text-primary hover:bg-accent-soft hover:text-accent-primary"
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchTerm.trim().length >= 2 && (
                          <div className="px-3 pt-1 pb-2">
                            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">
                              Suggestions
                            </p>
                            {isLoadingSuggestions && (
                              <div className="py-2 text-xs text-muted">Searching...</div>
                            )}
                            {!isLoadingSuggestions && suggestions.length === 0 && (
                              <div className="py-2 text-xs text-muted">
                                No suggestions for "{searchTerm.trim()}"
                              </div>
                            )}
                            <ul className="space-y-1">
                              {suggestions.map((name) => (
                                <li key={name}>
                                  <button
                                    type="button"
                                    onMouseDown={(event) => {
                                      event.preventDefault();
                                      handleApplySearch(name);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-primary hover:bg-accent-soft"
                                  >
                                    <span className="text-muted">🔍</span>
                                    <span className="line-clamp-1 text-left">{name}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>

                {/* Mobile Search Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                  className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-full border border-border-subtle bg-surface-secondary text-primary hover:border-accent-primary hover:text-accent-primary transition-all duration-200"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <circle cx="11" cy="11" r="6" />
                    <line x1="16" y1="16" x2="20" y2="20" />
                  </svg>
                </button>
              </>
            )}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(prev => prev === "light" ? "dark" : "light")}
              className="group relative h-10 w-10 rounded-full border border-border-subtle bg-surface-secondary text-primary hover:border-accent-primary transition-all duration-200"
              aria-label={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
            >
              <span className="absolute inset-0 rounded-full bg-accent-soft opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLightTheme ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 mx-auto"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 3v2" />
                  <path d="M12 19v2" />
                  <path d="M5 5l1.5 1.5" />
                  <path d="M17.5 17.5L19 19" />
                  <path d="M3 12h2" />
                  <path d="M19 12h2" />
                  <path d="M5 19l1.5-1.5" />
                  <path d="M17.5 6.5L19 5" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 mx-auto"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Auth Buttons or User Menu */}
            {!session && !isAuthPage ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors relative group"
                >
                  Login
                  <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-accent-primary group-hover:w-full transition-all duration-300" />
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary text-sm px-5 py-2 group"
                >
                  <span>Sign up</span>
                  <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            ) : session && (
              <div className="flex items-center gap-2">
                {/* Cart Icon (Non-admin only) */}
                {!session.user.isAdmin && (
                  <Link
                    to="/cart"
                    className={`group relative h-10 w-10 rounded-full border flex items-center justify-center transition-all duration-200 ${
                      isCartPage
                        ? "border-accent-primary bg-accent-soft text-accent-primary"
                        : "border-border-subtle bg-surface-secondary text-primary hover:border-accent-primary hover:text-accent-primary"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <circle cx="9" cy="20" r="1.5" />
                      <circle cx="17" cy="20" r="1.5" />
                      <path d="M3 4h2l2 12h10l2-8H7" />
                    </svg>
                    {cartCount > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[1.25rem] h-5 rounded-full bg-accent-primary text-white text-xs font-bold flex items-center justify-center px-1 ${
                        isCartAnimating ? 'animate-bounce' : ''
                      }`}>
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="group flex items-center gap-2 rounded-full border border-border-subtle bg-surface-secondary px-3 py-2 hover:border-accent-primary transition-all duration-200"
                  >
                    <div className="h-6 w-6 rounded-full bg-accent-gradient flex items-center justify-center text-white text-xs font-bold">
                      {session.user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium text-primary">
                      {session.user.name.split(' ')[0]}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`h-4 w-4 text-muted transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border-subtle bg-surface-primary shadow-xl animate-slide-up">
                      {session.user.isAdmin ? (
                        // Admin Menu
                        <div className="p-2">
                          <Link
                            to="/admin/dashboard"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary hover:bg-accent-soft transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="text-lg">📊</span>
                            Dashboard
                          </Link>
                          <Link
                            to="/admin/account"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary hover:bg-accent-soft transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="text-lg">👤</span>
                            Admin Profile
                          </Link>
                          <div className="my-2 h-px bg-border-subtle" />
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <span className="text-lg">🚪</span>
                            Logout
                          </button>
                        </div>
                      ) : (
                        // User Menu
                        <div className="p-2">
                          <div className="px-3 py-2">
                            <p className="text-xs text-muted">Signed in as</p>
                            <p className="text-sm font-medium text-primary">{session.user.email}</p>
                          </div>
                          <div className="my-2 h-px bg-border-subtle" />
                          
                          <Link
                            to="/my-orders"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary hover:bg-accent-soft transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="text-lg">📦</span>
                            My Orders
                          </Link>
                          
                          <Link
                            to="/wishlist"
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-primary hover:bg-accent-soft transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">❤️</span>
                              Wishlist
                            </div>
                            {wishlistCount > 0 && (
                              <span className="bg-accent-soft text-accent-primary text-xs font-bold px-2 py-1 rounded-full">
                                {wishlistCount}
                              </span>
                            )}
                          </Link>
                          
                          <Link
                            to="/account"
                            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-primary hover:bg-accent-soft transition-colors"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <span className="text-lg">⚙️</span>
                            Account Settings
                          </Link>
                          
                          <div className="my-2 h-px bg-border-subtle" />
                          
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                          >
                            <span className="text-lg">🚪</span>
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div
          ref={mobileSearchRef}
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileSearchOpen ? 'max-h-20 pb-4' : 'max-h-0'
          }`}
        >
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search perfumes..."
              className="input flex-1 text-sm"
              autoFocus={isMobileSearchOpen}
            />
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-sm"
            >
              Search
            </button>
          </form>
        </div>

        {/* Mobile Navigation */}
        {!isAdmin && !isAuthPage && (
          <div className="md:hidden flex items-center justify-around border-t border-border-subtle py-2 mt-2">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                  item.active ? 'text-accent-primary' : 'text-muted hover:text-primary'
                }`}
                onClick={() => setIsMobileSearchOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Progress Bar (optional) */}
      {isScrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border-subtle">
          <div 
            className="h-full bg-accent-gradient transition-all duration-300"
            style={{ width: `${(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%` }}
          />
        </div>
      )}
    </header>
  );
}

export default Navbar;
