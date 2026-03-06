import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { getImageUrl } from "../utils/images";
import { useSeo } from "../hooks/useSeo";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isRelatedLoading, setIsRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  
  const imageRef = useRef(null);
  const reviewSectionRef = useRef(null);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        setIsLoading(true);

        const [productResponse, reviewsResponse] = await Promise.all([
          api.get(`/api/products/${id}`),
          api.get(`/api/products/${id}/reviews`),
        ]);

        setProduct(productResponse.data || null);
        setReviews(Array.isArray(reviewsResponse.data) ? reviewsResponse.data : []);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load product. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const seoTitle = product
    ? `${product.name} | ${product.brand || "Luxury Perfume"} Online in India`
    : "Fragrance Details | Luxury Perfume Online Store";

  const seoDescription = product
    ? product.description && product.description.length > 120
      ? product.description.slice(0, 157) + "..."
      : product.description ||
        `Buy ${product.name} by ${product.brand || "top fragrance brands"} online. Explore notes, mood, occasions and reviews for this perfume.`
    : "Explore detailed fragrance information, notes and reviews for our curated perfumes.";

  useSeo({
    title: seoTitle,
    description: seoDescription,
  });

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await api.get("/api/users/wishlist");
        if (Array.isArray(response.data)) {
          const exists = response.data.some((item) => item._id === id);
          setIsInWishlist(exists);
        }
      } catch {
        setIsInWishlist(false);
      }
    };

    const stored = localStorage.getItem("auth");
    if (stored) fetchWishlist();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) {
        setRelatedProducts([]);
        return;
      }

      try {
        setRelatedError("");
        setIsRelatedLoading(true);

        const notes = [
          ...(Array.isArray(product.notes?.top) ? product.notes.top : []),
          ...(Array.isArray(product.notes?.middle) ? product.notes.middle : []),
          ...(Array.isArray(product.notes?.base) ? product.notes.base : []),
        ].map((value) => String(value).trim()).filter(Boolean);

        const response = await api.get("/api/products", {
          params: {
            category: product.category || undefined,
            notes: notes.length > 0 ? notes.join(",") : undefined,
            sortBy: "rating",
            pageSize: 8,
            page: 1,
          },
        });

        const items = Array.isArray(response.data.products) ? response.data.products : [];
        const filtered = items.filter((item) => item._id !== product._id);
        setRelatedProducts(filtered);
      } catch (errorResponse) {
        const message = errorResponse.response?.data?.message || "Failed to load related products.";
        setRelatedError(message);
      } finally {
        setIsRelatedLoading(false);
      }
    };

    fetchRelated();
  }, [product]);

  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;

    setIsCartAnimating(true);
    setTimeout(() => setIsCartAnimating(false), 1000);

    const stored = localStorage.getItem("cartItems");
    let cartItems = [];

    if (stored) {
      try {
        cartItems = JSON.parse(stored);
      } catch {
        cartItems = [];
      }
    }

    const existingIndex = cartItems.findIndex((item) => item.productId === product._id);

    if (existingIndex >= 0) {
      const existing = cartItems[existingIndex];
      const nextQuantity = Math.min(existing.quantity + quantity, product.stock || existing.quantity);
      cartItems[existingIndex] = { ...existing, quantity: nextQuantity };
    } else {
      cartItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      });
    }

    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    window.dispatchEvent(new Event("cartItemsUpdated"));
  };

  const handleQuantityChange = (event) => {
    const value = Number(event.target.value) || 1;
    const clamped = Math.max(1, Math.min(value, product?.stock || 1));
    setQuantity(clamped);
  };

  const handleToggleWishlist = async () => {
    if (!product) return;

    try {
      if (isInWishlist) {
        await api.delete(`/api/users/wishlist/${product._id}`);
        setIsInWishlist(false);
      } else {
        await api.post(`/api/users/wishlist/${product._id}`);
        setIsInWishlist(true);
      }
    } catch (wishlistError) {
      console.error(wishlistError);
    }
  };

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPosition({ x, y });
  };

  const renderRatingStars = (rating, size = "sm") => {
    if (typeof rating !== "number" || rating <= 0) return null;
    const clamped = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(clamped);
    const hasHalfStar = clamped % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className={`flex text-${size === "sm" ? "sm" : "base"} text-accent-primary`}>
          {Array.from({ length: 5 }).map((_, index) => {
            if (index < fullStars) return <span key={index}>★</span>;
            if (index === fullStars && hasHalfStar) return <span key={index}>½</span>;
            return <span key={index} className="text-muted">☆</span>;
          })}
        </div>
        <span className={`text-${size === "sm" ? "xs" : "sm"} text-muted`}>
          ({clamped.toFixed(1)})
        </span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-6 bg-surface-secondary rounded w-64" />
            <div className="grid gap-8 md:grid-cols-2">
              <div className="aspect-square rounded-3xl bg-surface-secondary" />
              <div className="space-y-4">
                <div className="h-8 bg-surface-secondary rounded w-3/4" />
                <div className="h-4 bg-surface-secondary rounded w-1/2" />
                <div className="h-24 bg-surface-secondary rounded" />
                <div className="h-12 bg-surface-secondary rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gradient mb-2">Product not found</h1>
            <p className="text-muted mb-6">{error || "The product you're looking for doesn't exist."}</p>
            <Link to="/products" className="btn-primary inline-flex items-center gap-2">
              <span>←</span> Back to products
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasStock = product.stock > 0;
  const hasNotes =
    Array.isArray(product.notes?.top) ||
    Array.isArray(product.notes?.middle) ||
    Array.isArray(product.notes?.base);

  const productImages =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image].filter(Boolean);

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
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="text-muted hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li>
              <Link to="/products" className="text-muted hover:text-primary transition-colors">
                Products
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li>
              <Link to={`/products?category=${product.category}`} className="text-muted hover:text-primary transition-colors">
                {product.category}
              </Link>
            </li>
            <li className="text-muted">/</li>
            <li className="text-primary font-medium truncate max-w-xs">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Main Section */}
        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div
              ref={imageRef}
              className="relative aspect-square rounded-3xl border border-border-subtle bg-surface-secondary overflow-hidden group"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomVisible(true)}
              onMouseLeave={() => setIsZoomVisible(false)}
            >
              <img
                src={getImageUrl(productImages[selectedImage] || product.image)}
                alt={product.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              {/* Zoom Lens */}
              {isZoomVisible && (
                <div
                  className="absolute inset-0 bg-surface-primary/10 backdrop-blur-sm pointer-events-none"
                  style={{
                    backgroundImage: `url(${getImageUrl(
                      productImages[selectedImage] || product.image
                    )})`,
                    backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                    backgroundSize: "200%",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}

              {/* Badges */}
              {product.discount && (
                <div className="absolute top-4 left-4 badge bg-success/90 text-white text-sm px-3 py-1">
                  -{product.discount}% OFF
                </div>
              )}
              {!hasStock && (
                <div className="absolute top-4 left-4 badge bg-error/90 text-white text-sm px-3 py-1">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {productImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                      selectedImage === index
                        ? 'border-accent-primary shadow-accent'
                        : 'border-border-subtle hover:border-accent-primary/50'
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`${product.name} - view ${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted">{product.brand}</span>
                    <span className="text-muted">•</span>
                    <span className="text-muted">{product.category}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleToggleWishlist}
                  className={`group h-12 w-12 rounded-full border flex items-center justify-center transition-all ${
                    isInWishlist
                      ? 'border-accent-primary bg-accent-soft text-accent-primary'
                      : 'border-border-subtle text-muted hover:border-accent-primary hover:text-accent-primary'
                  }`}
                >
                  <span className="text-2xl transform group-hover:scale-110 transition-transform">
                    {isInWishlist ? '❤️' : '🤍'}
                  </span>
                </button>
              </div>

              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-3">
                  {renderRatingStars(product.rating, "base")}
                  <span className="text-sm text-muted">
                    ({product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-accent-primary">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-muted line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${hasStock ? 'bg-success animate-pulse' : 'bg-error'}`} />
                <span className={`text-sm ${hasStock ? 'text-success' : 'text-error'}`}>
                  {hasStock ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Description Tabs */}
            <div className="border-b border-border-subtle">
              <div className="flex gap-6">
                {['description', 'details', 'notes'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium capitalize transition-all relative ${
                      activeTab === tab
                        ? 'text-accent-primary'
                        : 'text-muted hover:text-primary'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gradient" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'description' && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-secondary leading-relaxed">
                    {product.description || "No description available."}
                  </p>
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <p className="text-xs text-muted">Concentration</p>
                      <p className="text-sm font-medium text-primary">Eau de Parfum</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <p className="text-xs text-muted">Volume</p>
                      <p className="text-sm font-medium text-primary">100ml / 3.4 fl oz</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <p className="text-xs text-muted">Gender</p>
                      <p className="text-sm font-medium text-primary">Unisex</p>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                      <p className="text-xs text-muted">Year Launched</p>
                      <p className="text-sm font-medium text-primary">2024</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && hasNotes && (
                <div className="space-y-4 animate-fade-in">
                  {product.notes?.top?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-primary mb-2">Top Notes</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.notes.top.map((note) => (
                          <span key={note} className="badge badge-accent">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.notes?.middle?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-primary mb-2">Heart Notes</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.notes.middle.map((note) => (
                          <span key={note} className="badge badge-accent">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.notes?.base?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-primary mb-2">Base Notes</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.notes.base.map((note) => (
                          <span key={note} className="badge badge-accent">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Add to Cart Section */}
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3">
                  <span className="text-sm text-muted">Quantity:</span>
                  <div className="flex items-center border border-border-subtle rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-9 w-9 flex items-center justify-center text-primary hover:bg-surface-secondary transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={product.stock || 1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-16 text-center bg-transparent text-primary focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="h-9 w-9 flex items-center justify-center text-primary hover:bg-surface-secondary transition-colors"
                    >
                      +
                    </button>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!hasStock}
                  className="flex-1 btn-primary py-3 text-base group"
                >
                  <span className="flex items-center justify-center gap-2">
                    {hasStock ? (
                      <>
                        <span>Add to cart</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </>
                    ) : (
                      'Out of stock'
                    )}
                  </span>
                </button>
                
                <button
                  onClick={() => navigate('/checkout')}
                  disabled={!hasStock}
                  className="flex-1 btn-outline py-3 text-base"
                >
                  Buy now
                </button>
              </div>

              <p className="text-xs text-muted text-center">
                Free shipping on orders over ₹999 • 30-day returns
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mb-12" ref={reviewSectionRef}>
          <h2 className="text-2xl font-bold text-gradient mb-6">Customer Reviews</h2>
          
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-surface-secondary rounded-3xl border border-border-subtle">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-primary mb-2">No reviews yet</h3>
              <p className="text-muted mb-4">Be the first to share your thoughts about this fragrance</p>
              <button className="btn-primary">Write a review</button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="p-5 rounded-2xl border border-border-subtle bg-surface-secondary hover-lift hover-glow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-primary">{review.name}</p>
                      <p className="text-xs text-muted">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-accent-primary' : 'text-muted'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-secondary leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gradient">You might also like</h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item, index) => (
                <Link
                  key={item._id}
                  to={`/products/${item._id}`}
                  className="group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="card p-4 hover-lift hover-glow">
                    <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-surface-secondary">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-3xl">🌸</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className="font-medium text-primary text-sm mb-1 line-clamp-1 group-hover:text-accent-primary transition-colors">
                      {item.name}
                    </h3>
                    
                    <p className="text-xs text-muted mb-2">
                      {item.brand} • {item.category}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-accent-primary">
                        {formatCurrency(item.price)}
                      </span>
                      {item.rating > 0 && (
                        <span className="text-xs text-accent-primary">
                          ★ {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {isRelatedLoading && (
              <p className="text-sm text-muted">Loading recommendations...</p>
            )}
            {relatedError && (
              <p className="text-sm text-error">{relatedError}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default ProductDetail;
