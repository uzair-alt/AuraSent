import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { getImageUrl } from "../utils/images";
import { useSeo } from "../hooks/useSeo";

const productListCache = new Map();
const PRODUCT_CACHE_TTL = 60 * 1000;

const NOTE_OPTIONS = [
  { name: "Citrus", icon: "🍊", color: "from-orange-500/20 to-yellow-500/20" },
  { name: "Floral", icon: "🌸", color: "from-pink-500/20 to-purple-500/20" },
  { name: "Woody", icon: "🌲", color: "from-amber-800/20 to-amber-600/20" },
  { name: "Amber", icon: "✨", color: "from-amber-400/20 to-yellow-600/20" },
  { name: "Fresh", icon: "💧", color: "from-cyan-500/20 to-blue-500/20" },
  { name: "Gourmand", icon: "🍰", color: "from-amber-600/20 to-red-500/20" },
  { name: "Aromatic", icon: "🌿", color: "from-green-500/20 to-emerald-500/20" },
  { name: "Spicy", icon: "🌶️", color: "from-red-600/20 to-orange-600/20" },
  { name: "Fruity", icon: "🍎", color: "from-red-400/20 to-pink-400/20" },
  { name: "Musk", icon: "🦌", color: "from-stone-600/20 to-stone-400/20" },
];

const PRICE_RANGES = [
  { id: "budget", min: 0, max: 1000, label: "Under ₹1000" },
  { id: "mid", min: 1000, max: 3000, label: "₹1000 - ₹3000" },
  { id: "premium", min: 3000, max: 7000, label: "₹3000 - ₹7000" },
  { id: "luxury", min: 7000, max: 15000, label: "₹7000 - ₹15000" },
  { id: "ultra", min: 15000, max: null, label: "Above ₹15000" },
];

const CATEGORY_NAV_GROUPS = [
  {
    name: "Shop by Gender",
    icon: "👤",
    items: [
      { label: "Men's Fragrances", gender: "men" },
      { label: "Women's Fragrances", gender: "women" },
      { label: "Unisex", gender: "unisex" },
      { label: "Kids", gender: "kids" },
    ],
  },
  {
    name: "Shop by Family",
    icon: "🌸",
    items: [
      { label: "Floral", notes: ["Floral"] },
      { label: "Woody", notes: ["Woody"] },
      { label: "Citrus", notes: ["Citrus"] },
      { label: "Fresh", notes: ["Fresh"] },
    ],
  },
  {
    name: "By Mood",
    icon: "🎭",
    items: [
      { label: "Romantic & Sensual", mood: "romantic" },
      { label: "Fresh & Energetic", mood: "fresh" },
      { label: "Bold & Confident", mood: "bold" },
      { label: "Elegant & Sophisticated", mood: "elegant" },
    ],
  },
  {
    name: "Collections",
    icon: "🎁",
    items: [
      { label: "Best Sellers", collectionType: "best-sellers" },
      { label: "New Arrivals", collectionType: "new-arrivals" },
      { label: "Gift Sets", collectionType: "gift-sets" },
      { label: "Travel Size / Minis", collectionType: "travel-minis" },
    ],
  },
];

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlistIds, setWishlistIds] = useState([]);
  const [brand, setBrand] = useState(searchParams.get("brand") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [selectedNotes, setSelectedNotes] = useState(() => {
    const raw = searchParams.get("notes") || "";
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
  });
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "newest");
  const [gender, setGender] = useState(searchParams.get("gender") || "");
  const [mood, setMood] = useState(searchParams.get("mood") || "");
  const [collectionType, setCollectionType] = useState(
    searchParams.get("collectionType") || ""
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [savedSearches, setSavedSearches] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("savedSearches");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  });

  const filterRef = useRef(null);
  const productGridRef = useRef(null);
  const loadMoreRef = useRef(null);

  const seoTitleBase = "All Perfumes & Fragrances Online | Shop by Notes, Mood & Price";
  const seoParts = [];

  if (keyword) {
    seoParts.push(`Search: "${keyword}"`);
  }

  if (brand) {
    seoParts.push(`Brand: ${brand}`);
  }

  if (gender) {
    seoParts.push(`Gender: ${gender}`);
  }

  if (collectionType) {
    seoParts.push(`Collection: ${collectionType}`);
  }

  if (selectedNotes.length > 0) {
    seoParts.push(`Notes: ${selectedNotes.join(", ")}`);
  }

  const seoTitle = seoParts.length
    ? `${seoTitleBase} | ${seoParts.join(" • ")}`
    : seoTitleBase;

  useSeo({
    title: seoTitle,
    description:
      "Browse our full range of luxury perfumes and fragrances. Filter by notes, mood, gender, price and special collections to find your perfect scent.",
  });

  const handleCategoryNavClick = (item) => {
    const nextKeyword = item.keyword || "";
    const nextMinPrice =
      typeof item.minPrice === "number" && item.minPrice >= 0
        ? String(item.minPrice)
        : "";
    const nextMaxPrice =
      typeof item.maxPrice === "number" && item.maxPrice > 0
        ? String(item.maxPrice)
        : "";
    const nextNotes = Array.isArray(item.notes) ? item.notes : [];
    const nextSort = item.sortBy || sortBy;
    const nextGender = item.gender || "";
    const nextMood = item.mood || "";
    const nextCollectionType = item.collectionType || "";

    setKeyword(nextKeyword);
    setMinPrice(nextMinPrice);
    setMaxPrice(nextMaxPrice);
    setSelectedNotes(nextNotes);
    setSortBy(nextSort);
    setGender(nextGender);
    setMood(nextMood);
    setCollectionType(nextCollectionType);

    applyFilters({
      nextPage: 1,
      nextKeyword,
      nextMinPrice,
      nextMaxPrice,
      nextNotes,
      nextSort,
      nextGender,
      nextMood,
      nextCollectionType,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const syncSearchParams = ({
    nextPage,
    nextKeyword,
    nextBrand,
    nextMinPrice,
    nextMaxPrice,
    nextNotes,
    nextSort,
    nextGender,
    nextMood,
    nextCollectionType,
  }) => {
    const params = new URLSearchParams();
    const pageValue = nextPage && nextPage > 0 ? nextPage : 1;

    if (pageValue > 1) params.set("page", String(pageValue));
    if (nextKeyword?.trim()) params.set("q", nextKeyword.trim());
    if (nextBrand?.trim()) params.set("brand", nextBrand.trim());
    if (nextMinPrice && Number(nextMinPrice) > 0) params.set("minPrice", String(Number(nextMinPrice)));
    if (nextMaxPrice && Number(nextMaxPrice) > 0) params.set("maxPrice", String(Number(nextMaxPrice)));
    if (Array.isArray(nextNotes) && nextNotes.length > 0) params.set("notes", nextNotes.join(","));
    if (nextSort && nextSort !== "newest") params.set("sort", nextSort);
    if (nextGender?.trim()) params.set("gender", nextGender.trim());
    if (nextMood?.trim()) params.set("mood", nextMood.trim());
    if (nextCollectionType?.trim())
      params.set("collectionType", nextCollectionType.trim());

    setSearchParams(params);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError("");
        setIsLoading(true);

        const currentKeyword = searchParams.get("q") || "";
        const currentBrand = searchParams.get("brand") || "";
        const currentMinPrice = searchParams.get("minPrice") || "";
        const currentMaxPrice = searchParams.get("maxPrice") || "";
        const rawNotes = searchParams.get("notes") || "";
        const currentSort = searchParams.get("sort") || "newest";
        const currentGender = searchParams.get("gender") || "";
        const currentMood = searchParams.get("mood") || "";
        const currentCollectionType =
          searchParams.get("collectionType") || "";

        const cacheKey = JSON.stringify({
          keyword: currentKeyword || "",
          brand: currentBrand || "",
          minPrice: currentMinPrice || "",
          maxPrice: currentMaxPrice || "",
          notes,
          sortBy: currentSort || "newest",
          gender: currentGender || "",
          mood: currentMood || "",
          collectionType: currentCollectionType || "",
        });

        const cached = productListCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < PRODUCT_CACHE_TTL) {
          setProducts(cached.products);
          setPage(cached.page);
          setTotalPages(cached.totalPages);
          setHasMore(cached.page < cached.totalPages);
          setIsLoading(false);
          return;
        }

        const notes = rawNotes.split(",").map((v) => v.trim()).filter(Boolean);

        const response = await api.get("/api/products", {
          params: {
            page: 1,
            pageSize,
            keyword: currentKeyword || undefined,
            brand: currentBrand || undefined,
            minPrice: currentMinPrice || undefined,
            maxPrice: currentMaxPrice || undefined,
            notes: notes.length > 0 ? notes.join(",") : undefined,
            sortBy: currentSort || undefined,
            gender: currentGender || undefined,
            mood: currentMood || undefined,
            collectionType: currentCollectionType || undefined,
          },
        });

        const productsData = Array.isArray(response.data.products)
          ? response.data.products
          : [];

        setProducts(productsData);

        const resolvedPage = response.data.page || 1;
        const resolvedTotalPages = response.data.totalPages || 1;

        setPage(resolvedPage);
        setTotalPages(resolvedTotalPages);
        setHasMore(resolvedPage < resolvedTotalPages);

        if (productsData.length > 0) {
          productListCache.set(cacheKey, {
            timestamp: Date.now(),
            products: productsData,
            page: resolvedPage,
            totalPages: resolvedTotalPages,
          });
        } else {
          productListCache.delete(cacheKey);
        }
      } catch (errorResponse) {
        const message = errorResponse.response?.data?.message || "Failed to load products. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, pageSize]);

  useEffect(() => {
    setKeyword(searchParams.get("q") || "");
    setBrand(searchParams.get("brand") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");

    const raw = searchParams.get("notes") || "";
    const notes = raw.split(",").map((v) => v.trim()).filter(Boolean);
    setSelectedNotes(notes);
    setSortBy(searchParams.get("sort") || "newest");
    setGender(searchParams.get("gender") || "");
    setMood(searchParams.get("mood") || "");
    setCollectionType(searchParams.get("collectionType") || "");
  }, [searchParams]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await api.get("/api/users/wishlist");
        if (Array.isArray(response.data)) {
          setWishlistIds(response.data.map((item) => item._id));
        }
      } catch {
        setWishlistIds([]);
      }
    };

    const stored = localStorage.getItem("auth");
    if (stored) fetchWishlist();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const handleSaveCurrentSearch = () => {
    const hasFilters =
      (keyword && keyword.trim()) ||
      (brand && brand.trim()) ||
      (minPrice && String(minPrice).trim()) ||
      (maxPrice && String(maxPrice).trim()) ||
      selectedNotes.length > 0 ||
      sortBy !== "newest";

    if (!hasFilters) {
      return;
    }

    const parts = [];
    if (keyword && keyword.trim()) parts.push(`"${keyword.trim()}"`);
    if (brand && brand.trim()) parts.push(brand.trim());
    if (selectedNotes.length > 0) parts.push(selectedNotes.join(", "));
    if (minPrice || maxPrice) {
      const from = minPrice ? `₹${minPrice}` : "Any";
      const to = maxPrice ? `₹${maxPrice}` : "Any";
      parts.push(`Price ${from} - ${to}`);
    }
    if (sortBy && sortBy !== "newest") {
      if (sortBy === "priceAsc") parts.push("Price ↑");
      else if (sortBy === "priceDesc") parts.push("Price ↓");
      else if (sortBy === "rating") parts.push("Top rated");
    }

    const name = parts.join(" • ") || "Search";

    const params = {
      keyword: keyword || "",
      brand: brand || "",
      minPrice: minPrice || "",
      maxPrice: maxPrice || "",
      notes: selectedNotes.slice(),
      sortBy: sortBy || "newest",
    };

    setSavedSearches((previous) => {
      const exists = previous.some(
        (item) => JSON.stringify(item.params) === JSON.stringify(params)
      );
      if (exists) {
        return previous;
      }
      const entry = {
        id: Date.now(),
        name,
        params,
      };
      const next = [entry, ...previous].slice(0, 10);
      try {
        localStorage.setItem("savedSearches", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleApplySavedSearch = (entry) => {
    if (!entry || !entry.params) return;
    const params = entry.params;
    const nextKeyword = params.keyword || "";
    const nextBrand = params.brand || "";
    const nextMinPrice = params.minPrice || "";
    const nextMaxPrice = params.maxPrice || "";
    const nextNotes = Array.isArray(params.notes) ? params.notes : [];
    const nextSort = params.sortBy || "newest";

    setKeyword(nextKeyword);
    setBrand(nextBrand);
    setMinPrice(nextMinPrice);
    setMaxPrice(nextMaxPrice);
    setSelectedNotes(nextNotes);
    setSortBy(nextSort);

    applyFilters({
      nextPage: 1,
      nextKeyword,
      nextBrand,
      nextMinPrice,
      nextMaxPrice,
      nextNotes,
      nextSort,
    });
  };

  const handleRemoveSavedSearch = (entryId) => {
    setSavedSearches((previous) => {
      const next = previous.filter((item) => item.id !== entryId);
      try {
        localStorage.setItem("savedSearches", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const applyFilters = (overrides = {}) => {
    const nextPage = overrides.nextPage ?? 1;
    setPage(nextPage);
    syncSearchParams({
      nextPage,
      nextKeyword: overrides.nextKeyword ?? keyword,
      nextBrand: overrides.nextBrand ?? brand,
      nextMinPrice: overrides.nextMinPrice ?? minPrice,
      nextMaxPrice: overrides.nextMaxPrice ?? maxPrice,
      nextNotes: overrides.nextNotes ?? selectedNotes,
      nextSort: overrides.nextSort ?? sortBy,
      nextGender: overrides.nextGender ?? gender,
      nextMood: overrides.nextMood ?? mood,
      nextCollectionType:
        overrides.nextCollectionType ?? collectionType,
    });
    setIsFilterOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    applyFilters({ nextPage: 1, nextKeyword: keyword });
  };

  const handleBrandChange = (value) => {
    setBrand(value);
    applyFilters({ nextPage: 1, nextBrand: value });
  };

  const handlePriceApply = () => {
    applyFilters({ nextPage: 1, nextMinPrice: minPrice, nextMaxPrice: maxPrice });
  };

  const handleSortChange = (value) => {
    const nextSort = value || "newest";
    setSortBy(nextSort);
    applyFilters({ nextPage: 1, nextSort });
  };

  const handleToggleNote = (noteName) => {
    const exists = selectedNotes.includes(noteName);
    const nextNotes = exists
      ? selectedNotes.filter((item) => item !== noteName)
      : [...selectedNotes, noteName];

    setSelectedNotes(nextNotes);
    applyFilters({ nextPage: 1, nextNotes });
  };

  const handleQuickAddToCart = (product, event) => {
    event?.stopPropagation();
    
    if (!product || (product.stock && product.stock <= 0)) return;

    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 1000);

    const stored = localStorage.getItem("cartItems");
    let cartItems = [];

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) cartItems = parsed;
      } catch {
        cartItems = [];
      }
    }

    const existingIndex = cartItems.findIndex((item) => item.productId === product._id);

    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += 1;
    } else {
      cartItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }

    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartItemsUpdated"));
  };

  const toggleWishlist = async (productId, isInWishlist, event) => {
    event?.stopPropagation();
    try {
      if (isInWishlist) {
        await api.delete(`/api/users/wishlist/${productId}`);
        setWishlistIds((prev) => prev.filter((id) => id !== productId));
      } else {
        await api.post(`/api/users/wishlist/${productId}`);
        setWishlistIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
      }
    } catch (wishlistError) {
      console.error(wishlistError);
    }
  };

  const brandOptions = Array.from(
    new Set(
      products
        .map((product) => product.brand)
        .filter((value) => typeof value === "string" && value.trim())
    )
  ).sort();

  const renderRatingStars = (rating) => {
    if (typeof rating !== "number" || rating <= 0) return null;
    const clamped = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(clamped);
    const hasHalfStar = clamped % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex text-xs text-accent-primary">
          {Array.from({ length: 5 }).map((_, index) => {
            if (index < fullStars) return <span key={index}>★</span>;
            if (index === fullStars && hasHalfStar) return <span key={index}>½</span>;
            return <span key={index} className="text-muted">☆</span>;
          })}
        </div>
        <span className="text-xs text-muted">({clamped.toFixed(1)})</span>
      </div>
    );
  };

  const loadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);

      const currentKeyword = searchParams.get("q") || "";
      const currentBrand = searchParams.get("brand") || "";
      const currentMinPrice = searchParams.get("minPrice") || "";
      const currentMaxPrice = searchParams.get("maxPrice") || "";
      const rawNotes = searchParams.get("notes") || "";
      const currentSort = searchParams.get("sort") || "newest";

      const notes = rawNotes
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const nextPage = page + 1;

      const response = await api.get("/api/products", {
        params: {
          page: nextPage,
          pageSize,
          keyword: currentKeyword || undefined,
          brand: currentBrand || undefined,
          minPrice: currentMinPrice || undefined,
          maxPrice: currentMaxPrice || undefined,
          notes: notes.length > 0 ? notes.join(",") : undefined,
          sortBy: currentSort || undefined,
        },
      });

      const productsData = Array.isArray(response.data.products)
        ? response.data.products
        : [];

      setProducts((previous) => {
        if (!previous.length) {
          return productsData;
        }

        const existingIds = new Set(previous.map((item) => item._id));
        const merged = [...previous];

        productsData.forEach((item) => {
          if (item && !existingIds.has(item._id)) {
            merged.push(item);
          }
        });

        return merged;
      });

      const resolvedPage = response.data.page || nextPage;
      const resolvedTotalPages = response.data.totalPages || totalPages;

      setPage(resolvedPage);
      setTotalPages(resolvedTotalPages);
      setHasMore(resolvedPage < resolvedTotalPages);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to load more products. Please try again.";
      setError(message);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoading, isLoadingMore, page, pageSize, searchParams, totalPages]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry.isIntersecting) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "200px",
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  return (
    <div className="min-h-screen bg-page">
      {/* Cart Animation Overlay */}
      {isCartAnimating && (
        <div className="fixed top-4 right-4 z-50 animate-slide-left">
          <div className="glass-dark px-4 py-2 rounded-lg border border-accent-primary/30">
            <p className="text-sm text-primary">✨ Added to cart!</p>
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                All Products
              </h1>
              <p className="text-muted">
                Discover your perfect scent from our curated collection
              </p>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search by name or note..."
                  className="input w-full pl-10 pr-4 py-2"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="6" />
                  <line x1="16" y1="16" x2="20" y2="20" />
                </svg>
              </div>
              <button type="submit" className="btn-primary px-6">
                Search
              </button>
            </form>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORY_NAV_GROUPS.map((group) => (
              <div key={group.name} className="card p-4">
                <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <span>{group.icon}</span>
                  <span>{group.name}</span>
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={() => handleCategoryNavClick(item)}
                        className="text-xs text-muted hover:text-accent-primary"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Active Filters and Saved Searches */}
          {(keyword || brand || minPrice || maxPrice || selectedNotes.length > 0 || savedSearches.length > 0) && (
            <div className="space-y-2">
              {(keyword || brand || minPrice || maxPrice || selectedNotes.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                  <span className="text-xs text-muted">Active filters:</span>
                  {keyword && (
                    <span className="badge badge-accent flex items-center gap-1">
                      Search: {keyword}
                      <button
                        type="button"
                        onClick={() => {
                          setKeyword("");
                          applyFilters({ nextKeyword: "" });
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {brand && (
                    <span className="badge badge-accent flex items-center gap-1">
                      Brand: {brand}
                      <button type="button" onClick={() => handleBrandChange("")}>
                        ✕
                      </button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="badge badge-accent flex items-center gap-1">
                      Price: {minPrice && `₹${minPrice}`} {minPrice && maxPrice && "-"}{" "}
                      {maxPrice && `₹${maxPrice}`}
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice("");
                          setMaxPrice("");
                          applyFilters({ nextMinPrice: "", nextMaxPrice: "" });
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {selectedNotes.map((note) => (
                    <span key={note} className="badge badge-accent flex items-center gap-1">
                      {note}
                      <button type="button" onClick={() => handleToggleNote(note)}>
                        ✕
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setBrand("");
                      setMinPrice("");
                      setMaxPrice("");
                      setSelectedNotes([]);
                      setSortBy("newest");
                      applyFilters({
                        nextKeyword: "",
                        nextBrand: "",
                        nextMinPrice: "",
                        nextMaxPrice: "",
                        nextNotes: [],
                        nextSort: "newest",
                      });
                    }}
                    className="text-xs text-accent-primary hover:text-accent-secondary ml-auto"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCurrentSearch}
                    className="text-xs text-accent-primary hover:text-accent-secondary"
                  >
                    Save this search
                  </button>
                </div>
              )}

              {savedSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">Saved searches:</span>
                  {savedSearches.map((entry) => (
                    <div
                      key={entry.id}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-secondary border border-border-subtle px-3 py-1 text-xs text-primary"
                    >
                      <button
                        type="button"
                        onClick={() => handleApplySavedSearch(entry)}
                        className="hover:text-accent-primary"
                      >
                        {entry.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSavedSearch(entry.id)}
                        className="text-muted hover:text-error"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="lg:hidden w-full mb-4 btn-outline flex items-center justify-center gap-2 py-3"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside
            ref={filterRef}
            className={`lg:w-80 space-y-6 ${
              isFilterOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="sticky top-24 space-y-6">
              {/* Brand Filter */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <span>🏷️</span> Brand
                </h3>
                <select
                  value={brand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="input w-full text-sm"
                >
                  <option value="">All brands</option>
                  {brandOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <span>💰</span> Price Range
                </h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Min"
                      className="input w-full text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Max"
                      className="input w-full text-sm"
                    />
                  </div>
                  <button
                    onClick={handlePriceApply}
                    className="btn-outline w-full text-sm py-2"
                  >
                    Apply Price
                  </button>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PRICE_RANGES.map((range) => {
                      const isActive =
                        (minPrice && Number(minPrice) === (range.min || 0)) &&
                        ((range.max === null && !maxPrice) ||
                          (range.max !== null &&
                            maxPrice &&
                            Number(maxPrice) === range.max));
                      return (
                        <button
                          key={range.id}
                          type="button"
                          onClick={() => {
                            const nextMin =
                              typeof range.min === "number" && range.min > 0
                                ? String(range.min)
                                : "";
                            const nextMax =
                              typeof range.max === "number" && range.max > 0
                                ? String(range.max)
                                : "";
                            setMinPrice(nextMin);
                            setMaxPrice(nextMax);
                            applyFilters({
                              nextPage: 1,
                              nextMinPrice: nextMin,
                              nextMaxPrice: nextMax,
                            });
                          }}
                          className={`px-2 py-1 rounded-full border text-[11px] ${
                            isActive
                              ? "border-accent-primary bg-accent-soft text-accent-primary"
                              : "border-border-subtle text-muted hover:text-primary"
                          }`}
                        >
                          {range.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Notes Filter */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <span>🌸</span> Fragrance Notes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {NOTE_OPTIONS.map((note) => {
                    const isSelected = selectedNotes.includes(note.name);
                    return (
                      <button
                        key={note.name}
                        onClick={() => handleToggleNote(note.name)}
                        className={`group relative overflow-hidden rounded-lg p-2 text-center transition-all duration-200 ${
                          isSelected
                            ? 'border-2 border-accent-primary bg-accent-soft'
                            : 'border border-border-subtle bg-surface-secondary hover:border-accent-primary/50'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${note.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                        <span className="relative z-10 block text-lg mb-1">{note.icon}</span>
                        <span className={`relative z-10 text-xs font-medium ${
                          isSelected ? 'text-accent-primary' : 'text-muted'
                        }`}>
                          {note.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1" ref={productGridRef}>
            {/* Sort and Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted">
                Showing <span className="text-primary font-medium">{products.length}</span> products
              </p>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input text-sm py-2 pl-3 pr-8 w-40"
              >
                <option value="newest">Newest</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {error && (
              <div className="glass border border-error/30 bg-error/10 px-4 py-3 rounded-lg mb-6">
                <p className="text-sm text-error flex items-center gap-2">
                  <span>⚠️</span> {error}
                </p>
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="card p-4 animate-pulse">
                    <div className="aspect-square rounded-xl bg-surface-secondary mb-4" />
                    <div className="h-4 bg-surface-secondary rounded w-3/4 mb-2" />
                    <div className="h-3 bg-surface-secondary rounded w-1/2 mb-4" />
                    <div className="h-8 bg-surface-secondary rounded" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-xl font-semibold text-primary mb-2">No products found</h3>
                <p className="text-muted mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => {
                    setKeyword("");
                    setBrand("");
                    setMinPrice("");
                    setMaxPrice("");
                    setSelectedNotes([]);
                    setSortBy("newest");
                    applyFilters({ nextKeyword: "", nextBrand: "", nextMinPrice: "", nextMaxPrice: "", nextNotes: [], nextSort: "newest" });
                  }}
                  className="btn-primary"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, index) => {
                    const isInWishlist = wishlistIds.includes(product._id);
                    
                    return (
                      <div
                        key={product._id}
                        className="group relative"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onMouseEnter={() => setHoveredProduct(product._id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        <div className="card p-4 hover-lift hover-glow">
                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => toggleWishlist(product._id, isInWishlist, e)}
                            className={`absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              isInWishlist
                                ? 'bg-accent-primary text-white'
                                : 'bg-surface-secondary text-muted hover:text-accent-primary'
                            }`}
                          >
                            <span className="text-lg">{isInWishlist ? '❤️' : '🤍'}</span>
                          </button>

                          <Link to={`/products/${product._id}`}>
                            {/* Product Image */}
                            <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-surface-secondary">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={getImageUrl(product.images[0])}
                                  alt={product.name}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : product.image ? (
                                <img
                                  src={getImageUrl(product.image)}
                                  alt={product.name}
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <span className="text-4xl">🌸</span>
                                </div>
                              )}

                              {/* Quick View Overlay */}
                              <div className={`absolute inset-0 bg-surface-primary/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
                                hoveredProduct === product._id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setQuickViewProduct(product);
                                  }}
                                  className="btn-glass text-sm px-4 py-2"
                                >
                                  Quick view
                                </button>
                              </div>

                              {/* Badges */}
                              {product.stock <= 0 && (
                                <div className="absolute top-2 left-2 badge bg-error/90 text-white">
                                  Out of stock
                                </div>
                              )}
                              {product.discount && (
                                <div className="absolute top-2 left-2 badge bg-success/90 text-white">
                                  -{product.discount}%
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="space-y-2">
                              <h3 className="font-medium text-primary line-clamp-1 group-hover:text-accent-primary transition-colors">
                                {product.name}
                              </h3>
                              
                              <p className="text-xs text-muted">
                                {product.brand} • {product.category}
                              </p>

                              {/* Notes Tags */}
                              {product.notes && product.notes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {product.notes.slice(0, 3).map((note) => (
                                    <span key={note} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent-primary">
                                      {note}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2">
                                <div className="space-y-1">
                                  <span className="text-lg font-bold text-accent-primary">
                                    {formatCurrency(product.price)}
                                  </span>
                                  {product.originalPrice && (
                                    <span className="text-xs text-muted line-through ml-2">
                                      {formatCurrency(product.originalPrice)}
                                    </span>
                                  )}
                                </div>
                                {renderRatingStars(product.rating)}
                              </div>
                            </div>
                          </Link>

                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => handleQuickAddToCart(product, e)}
                            disabled={product.stock <= 0}
                            className={`mt-4 w-full btn-outline text-sm py-2 ${
                              product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {product.stock <= 0 ? 'Out of stock' : 'Add to cart'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div ref={loadMoreRef}>
                      {hasMore ? (
                        <button
                          type="button"
                          onClick={loadMore}
                          disabled={isLoadingMore}
                          className="btn-outline px-4 py-2 text-sm disabled:opacity-50"
                        >
                          {isLoadingMore ? "Loading more..." : "Load more"}
                        </button>
                      ) : (
                        <p className="text-xs text-muted">
                          You have reached the end of the list.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-page-overlay animate-fade-in">
          <div className="relative max-w-2xl w-full bg-surface-primary rounded-3xl border border-border-subtle shadow-xl animate-slide-up">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-primary border border-border-subtle flex items-center justify-center text-muted hover:text-primary transition-colors z-10"
            >
              ✕
            </button>

            <div className="grid md:grid-cols-2 gap-6 p-6">
              <div className="aspect-square rounded-xl bg-surface-secondary overflow-hidden">
                {quickViewProduct.image ? (
                  <img
                    src={getImageUrl(quickViewProduct.image)}
                    alt={quickViewProduct.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-6xl">🌸</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {quickViewProduct.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {quickViewProduct.brand} • {quickViewProduct.category}
                  </p>
                </div>

                {quickViewProduct.description && (
                  <p className="text-sm text-secondary">
                    {quickViewProduct.description}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-accent-primary">
                    {formatCurrency(quickViewProduct.price)}
                  </span>
                  {renderRatingStars(quickViewProduct.rating)}
                </div>

                {quickViewProduct.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-primary mb-2">Fragrance Notes</h4>
                    <div className="flex flex-wrap gap-2">
                      {quickViewProduct.notes.map((note) => {
                        const noteInfo = NOTE_OPTIONS.find(n => n.name === note);
                        return (
                          <span key={note} className="badge badge-accent text-xs flex items-center gap-1">
                            {noteInfo?.icon} {note}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={(e) => {
                      handleQuickAddToCart(quickViewProduct, e);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 btn-primary"
                  >
                    Add to cart
                  </button>
                  <Link
                    to={`/products/${quickViewProduct._id}`}
                    onClick={() => setQuickViewProduct(null)}
                    className="flex-1 btn-outline text-center"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
