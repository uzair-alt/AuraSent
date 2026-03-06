import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

function MyWishlist() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setError("");
        setIsLoading(true);

        const response = await api.get("/api/users/wishlist");
        setItems(Array.isArray(response.data) ? response.data : []);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load wishlist. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const handleRemoveFromWishlist = async (productId, event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      setIsRemoving(true);
      setRemovingId(productId);

      await api.delete(`/api/users/wishlist/${productId}`);

      setItems((prev) => prev.filter((item) => item._id !== productId));
      setFeedback("Item removed from wishlist");
      setTimeout(() => setFeedback(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to remove item. Please try again.";
      setError(message);
    } finally {
      setIsRemoving(false);
      setRemovingId(null);
    }
  };

  const handleAddToCart = (product, event) => {
    event.preventDefault();
    event.stopPropagation();

    const stored = localStorage.getItem("cartItems");
    let cartItems = [];

    if (stored) {
      try {
        cartItems = JSON.parse(stored);
      } catch {
        cartItems = [];
      }
    }

    const existingIndex = cartItems.findIndex(
      (item) => item.productId === product._id
    );

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
    
    setFeedback("Added to cart! 🛒");
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleClearWishlist = async () => {
    if (!window.confirm("Are you sure you want to clear your entire wishlist?")) return;

    try {
      setIsRemoving(true);
      
      // Remove items one by one (or use bulk delete endpoint if available)
      for (const item of items) {
        await api.delete(`/api/users/wishlist/${item._id}`);
      }

      setItems([]);
      setFeedback("Wishlist cleared successfully");
      setTimeout(() => setFeedback(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to clear wishlist. Please try again.";
      setError(message);
    } finally {
      setIsRemoving(false);
    }
  };

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

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "priceAsc":
        return (a.price || 0) - (b.price || 0);
      case "priceDesc":
        return (b.price || 0) - (a.price || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "name":
        return (a.name || "").localeCompare(b.name || "");
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-surface-secondary rounded-xl" />
              ))}
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
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
              My Wishlist
            </h1>
            <p className="text-muted">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>
          
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input text-sm py-2 px-3"
              >
                <option value="default">Sort by</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="name">Name</option>
              </select>
              
              <button
                onClick={handleClearWishlist}
                disabled={isRemoving}
                className="btn-outline text-sm px-4 py-2 border-error text-error hover:bg-error/10 disabled:opacity-40"
              >
                Clear All
              </button>
              
              <Link
                to="/products"
                className="btn-primary inline-flex items-center gap-2 group"
              >
                <span>Continue Shopping</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          )}
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

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-primary mb-2">Your wishlist is empty</h3>
            <p className="text-muted mb-6">
              Save your favorite fragrances and they'll appear here
            </p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2 group">
              <span>Browse Products</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Stats */}
            <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-4">
              <div className="card p-4">
                <p className="text-2xl font-bold text-primary">{items.length}</p>
                <p className="text-xs text-muted">Total Items</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(items.reduce((sum, item) => sum + (item.price || 0), 0))}
                </p>
                <p className="text-xs text-muted">Total Value</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-primary">
                  {items.filter(i => i.rating >= 4).length}
                </p>
                <p className="text-xs text-muted">Top Rated</p>
              </div>
              <div className="card p-4">
                <p className="text-2xl font-bold text-primary">
                  {items.filter(i => i.stock > 0).length}
                </p>
                <p className="text-xs text-muted">In Stock</p>
              </div>
            </div>

            {/* Wishlist Grid */}
            <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {sortedItems.map((product, index) => (
                <div
                  key={product._id}
                  className="group relative animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Link
                    to={`/products/${product._id}`}
                    className="block card p-4 hover-lift hover-glow"
                  >
                    {/* Remove Button */}
                    <button
                      onClick={(e) => handleRemoveFromWishlist(product._id, e)}
                      disabled={isRemoving && removingId === product._id}
                      className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-surface-secondary border border-border-subtle flex items-center justify-center text-muted hover:text-error hover:border-error transition-all duration-200 disabled:opacity-40"
                    >
                      {isRemoving && removingId === product._id ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <span className="text-lg">✕</span>
                      )}
                    </button>

                    {/* Product Image */}
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-secondary">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-4xl">🌸</span>
                        </div>
                      )}

                      {/* Stock Badge */}
                      {product.stock <= 0 && (
                        <div className="absolute top-2 left-2 badge bg-error/90 text-white text-xs">
                          Out of Stock
                        </div>
                      )}
                      {product.discount && (
                        <div className="absolute top-2 left-2 badge bg-success/90 text-white text-xs">
                          -{product.discount}%
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-primary text-sm line-clamp-2 group-hover:text-accent-primary transition-colors">
                        {product.name}
                      </h3>
                      
                      <p className="text-xs text-muted">
                        {product.brand} • {product.category}
                      </p>

                      {/* Notes Tags */}
                      {product.notes && product.notes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.notes.slice(0, 2).map((note) => (
                            <span key={note} className="text-[10px] px-2 py-0.5 rounded-full bg-accent-soft text-accent-primary">
                              {note}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Price and Rating */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
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

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        disabled={product.stock <= 0}
                        className={`flex-1 btn-primary text-xs py-2 ${
                          product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                      
                      <Link
                        to={`/products/${product._id}`}
                        className="btn-outline text-xs py-2 px-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </div>
                  </Link>
                </div>
              ))}
            </section>

            {/* Share Wishlist */}
            <div className="mt-8 p-6 card border-accent-primary/20 bg-accent-soft">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📤</span>
                  <div>
                    <h3 className="text-lg font-semibold text-primary">Share Your Wishlist</h3>
                    <p className="text-sm text-muted">
                      Let friends and family know what fragrances you love
                    </p>
                  </div>
                </div>
                <button className="btn-primary whitespace-nowrap">
                  Share Wishlist
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default MyWishlist;