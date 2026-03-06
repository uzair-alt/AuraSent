import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { getImageUrl } from "../utils/images";
import { useSeo } from "../hooks/useSeo";

function getSession() {
  const stored = localStorage.getItem("auth");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function Home() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [collections, setCollections] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  
  const session = getSession();
  const isAdmin = !!session?.user?.isAdmin;
  const sectionRefs = useRef([]);

  useSeo({
    title: "Luxury Fragrances Online | Discover Your Signature Scent",
    description:
      "Shop premium perfumes and fragrances for men and women. Curated collections, niche scents, gift sets, and exclusive offers tailored to every mood and occasion.",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        setIsLoading(true);

        const [bannersResponse, collectionsResponse, productsResponse] =
          await Promise.all([
            api.get("/api/banners/public"),
            api.get("/api/featured-collections/public"),
            api.get("/api/products", {
              params: { page: 1, pageSize: 8 },
            }),
          ]);

        setBanners(
          Array.isArray(bannersResponse.data) ? bannersResponse.data : []
        );
        setCollections(
          Array.isArray(collectionsResponse.data)
            ? collectionsResponse.data
            : []
        );
        setAllProducts(
          Array.isArray(productsResponse.data?.products)
            ? productsResponse.data.products
            : []
        );
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load home content. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up', 'opacity-100');
            entry.target.classList.remove('opacity-0');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [isLoading]);

  const heroBanner = banners.find((banner) => banner.placement === "home-hero");
  const secondaryBanners = banners.filter(
    (banner) => banner.placement === "home-secondary"
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const renderRatingStars = (rating) => {
    if (typeof rating !== "number" || rating <= 0) return null;
    const clamped = Math.max(0, Math.min(5, rating));
    const fullStars = Math.floor(clamped);
    const hasHalfStar = clamped % 1 >= 0.5;

    return (
      <div className="flex items-center gap-1">
        <div className="flex text-[10px] text-accent-primary">
          {Array.from({ length: 5 }).map((_, index) => {
            if (index < fullStars) {
              return <span key={index} className="animate-pulse-slow">★</span>;
            } else if (index === fullStars && hasHalfStar) {
              return <span key={index} className="relative">½</span>;
            }
            return <span key={index} className="text-muted">☆</span>;
          })}
        </div>
        <span className="text-[10px] text-muted">({clamped.toFixed(1)})</span>
      </div>
    );
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
  };

  const notes = [
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

  return (
    <div className="min-h-screen bg-page">
      {/* Background Gradient Effect */}
      <div className="fixed inset-0 bg-page-gradient pointer-events-none" />
      
      {/* Cart Animation Overlay */}
      {isCartAnimating && (
        <div className="fixed top-4 right-4 z-50 animate-slide-left">
          <div className="glass-dark px-4 py-2 rounded-lg border border-accent-primary/30">
            <p className="text-sm text-primary">✨ Added to cart!</p>
          </div>
        </div>
      )}

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-6 space-y-16">
        {/* Error Message */}
        {error && (
          <div 
            ref={(el) => (sectionRefs.current[0] = el)}
            className="opacity-0 glass border border-error/30 bg-error/10 px-4 py-3 rounded-lg"
          >
            <p className="text-sm text-error flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </p>
          </div>
        )}

        {/* Hero Section */}
        <section 
          ref={(el) => (sectionRefs.current[1] = el)}
          className="opacity-0"
        >
          {!heroBanner ? (
            <div className="relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-primary p-8 md:p-12 hover-lift hover-glow">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-accent-gradient opacity-5 animate-pulse-slow" />
              
              <div className="relative z-10 max-w-2xl space-y-6">
                <div className="space-y-2">
                  <span className="badge badge-accent animate-pulse-slow">
                    ✨ New Arrivals
                  </span>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                    <span className="text-gradient">AuraScents</span>
                  </h1>
                  <p className="text-lg text-muted">
                    Discover fragrances curated for your mood, season, and style.
                  </p>
                </div>

                {isAdmin ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted">
                      Use the admin panel to create home banners and featured collections.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => navigate("/admin/dashboard")}
                        className="btn-primary group"
                      >
                        <span>Go to dashboard</span>
                        <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                      </button>
                      <Link to="/login" className="btn-outline">
                        Sign in
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4">
                    <Link to="/products" className="btn-primary group">
                      <span>Browse fragrances</span>
                      <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Decorative Elements */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-primary/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-accent-secondary/10 blur-3xl" />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              {/* Main Hero Banner */}
              <div className="group relative overflow-hidden rounded-3xl border border-border-subtle bg-surface-primary hover-lift hover-glow">
                <div className="absolute inset-0 bg-gradient-to-r from-surface-primary via-surface-primary/80 to-transparent z-10" />
                
                {heroBanner.imageUrl && (
                  <img
                    src={heroBanner.imageUrl}
                    alt={heroBanner.title}
                    className="h-[400px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                
                <div className="absolute inset-0 z-20 flex flex-col justify-center p-8 md:p-12">
                  <span className="badge badge-accent animate-pulse-slow mb-4">
                    ✨ Featured Collection
                  </span>
                  
                  <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
                    {heroBanner.title}
                  </h1>
                  
                  {heroBanner.subtitle && (
                    <p className="text-lg text-secondary max-w-md mb-6">
                      {heroBanner.subtitle}
                    </p>
                  )}
                  
                  {heroBanner.linkUrl && (
                    <Link
                      to={heroBanner.linkUrl}
                      className="btn-primary inline-flex w-fit group"
                    >
                      <span>Shop now</span>
                      <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Secondary Banners */}
              <div className="space-y-4">
                {secondaryBanners.length === 0 ? (
                  <div className="flex h-[400px] items-center justify-center rounded-3xl border border-dashed border-border-subtle bg-surface-secondary p-6 text-center">
                    <p className="text-muted text-sm">
                      Add secondary banners in the admin panel
                    </p>
                  </div>
                ) : (
                  secondaryBanners.slice(0, 2).map((banner) => (
                    <button
                      key={banner._id}
                      onClick={() => banner.linkUrl && navigate(banner.linkUrl)}
                      className="group relative w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface-primary p-4 text-left hover-lift hover-glow"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-surface-primary to-transparent z-10" />
                      
                      {banner.imageUrl && (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                      
                      <div className="relative z-20">
                        <h3 className="text-lg font-semibold text-primary mb-1">
                          {banner.title}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-sm text-secondary">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* Features Section */}
        <section 
          ref={(el) => (sectionRefs.current[2] = el)}
          className="opacity-0"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-2">
              Why choose AuraScents
            </h2>
            <p className="text-muted">
              Experience the art of fine fragrance
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "✨",
                title: "Curated Collections",
                description: "Handpicked fragrances for every mood and occasion",
                color: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: "⭐",
                title: "Trusted Reviews",
                description: "Real feedback from our community of fragrance lovers",
                color: "from-yellow-500/20 to-orange-500/20"
              },
              {
                icon: "🎁",
                title: "Luxury Gifting",
                description: "Beautifully packaged and ready to surprise",
                color: "from-blue-500/20 to-cyan-500/20"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-primary p-6 hover-lift hover-glow"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <span className="text-4xl mb-4 block">{feature.icon}</span>
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative Line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gradient scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </section>

        {/* Collections Section */}
        {collections.map((collection, collectionIndex) => (
          <section
            key={collection._id}
            ref={(el) => (sectionRefs.current[3 + collectionIndex] = el)}
            className="opacity-0"
          >
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gradient mb-2">
                  {collection.title}
                </h2>
                {collection.description && (
                  <p className="text-muted">{collection.description}</p>
                )}
              </div>
              <Link
                to={`/collections/${collection._id}`}
                className="text-accent-primary hover:text-accent-secondary transition-colors text-sm font-medium group"
              >
                <span>View all</span>
                <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {collection.products?.slice(0, 4).map((product, index) => (
                <div
                  key={product._id}
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredProduct(product._id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-primary p-4 hover-lift hover-glow">
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {product.isFeatured && (
                        <span className="badge bg-accent-primary/90 text-white text-[10px] uppercase tracking-wide">
                          Featured
                        </span>
                      )}
                      {product.collectionType && (
                        <span className="badge bg-surface-secondary/90 text-[10px] uppercase tracking-wide">
                          {product.collectionType.replace("-", " ")}
                        </span>
                      )}
                    </div>
                    {/* Product Image */}
                    <Link to={`/products/${product._id}`}>
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

                        {/* Overlay on Hover */}
                        <div className={`absolute inset-0 bg-surface-primary/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
                          hoveredProduct === product._id ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}>
                          <button
                            onClick={() => setQuickViewProduct(product)}
                            className="btn-glass text-sm"
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
                          <div className="absolute top-2 right-2 badge bg-success/90 text-white">
                            -{product.discount}%
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-primary line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted">
                          {product.brand} • {product.category}
                        </p>
                        <div className="flex items-center justify-between">
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
                        <div className="flex flex-wrap gap-1">
                          {product.gender && (
                            <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                              {product.gender}
                            </span>
                          )}
                          {product.occasion && Array.isArray(product.occasion) && product.occasion.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                              {product.occasion[0]}
                            </span>
                          )}
                          {product.mood && Array.isArray(product.mood) && product.mood.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                              {product.mood[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => handleQuickAddToCart(product, e)}
                        disabled={product.stock <= 0}
                        className={`flex-1 btn-primary text-sm py-2 ${
                          product.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        {product.stock <= 0 ? "Out of stock" : "Add to cart"}
                      </button>
                      <Link
                        to={`/products/${product._id}`}
                        className="flex-1 btn-outline text-xs py-2 text-center"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Fragrance Notes Section */}
        <section 
          ref={(el) => (sectionRefs.current[5] = el)}
          className="opacity-0"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-2">
              Explore by Notes
            </h2>
            <p className="text-muted">
              Find your perfect scent family
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {notes.map((note) => (
              <button
                key={note.name}
                onClick={() => {
                  setActiveNote(note.name);
                  navigate(`/products?notes=${encodeURIComponent(note.name)}&sort=rating`);
                }}
                onMouseEnter={() => setActiveNote(note.name)}
                onMouseLeave={() => setActiveNote(null)}
                className="group relative overflow-hidden rounded-xl border border-border-subtle bg-surface-primary p-4 hover-lift hover-glow"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${note.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative z-10 text-center">
                  <span className="text-3xl mb-2 block transform group-hover:scale-110 transition-transform duration-300">
                    {note.icon}
                  </span>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    activeNote === note.name ? 'text-accent-primary' : 'text-primary'
                  }`}>
                    {note.name}
                  </span>
                </div>

                {/* Animated Border */}
                <div className="absolute inset-0 border-2 border-accent-primary/0 group-hover:border-accent-primary/20 rounded-xl transition-all duration-300" />
              </button>
            ))}
          </div>
        </section>

        {/* All Products Section */}
        <section 
          ref={(el) => (sectionRefs.current[6] = el)}
          className="opacity-0"
        >
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gradient mb-2">
                Popular Fragrances
              </h2>
              <p className="text-muted">
                Most loved scents by our community
              </p>
            </div>
            <Link
              to="/products"
              className="text-accent-primary hover:text-accent-secondary transition-colors text-sm font-medium group"
            >
              <span>View all products</span>
              <span className="inline-block ml-1 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl border border-border-subtle bg-surface-primary p-4 animate-pulse">
                  <div className="aspect-square rounded-xl bg-surface-secondary mb-4" />
                  <div className="h-4 bg-surface-secondary rounded w-3/4 mb-2" />
                  <div className="h-3 bg-surface-secondary rounded w-1/2 mb-4" />
                  <div className="h-8 bg-surface-secondary rounded" />
                </div>
              ))}
            </div>
          ) : allProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted">No products available yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {allProducts.map((product, index) => (
                <div
                  key={product._id}
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                  onMouseEnter={() => setHoveredProduct(product._id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-primary p-4 hover-lift hover-glow">
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {product.isFeatured && (
                        <span className="badge bg-accent-primary/90 text-white text-[10px] uppercase tracking-wide">
                          Best seller
                        </span>
                      )}
                      {product.collectionType && (
                        <span className="badge bg-surface-secondary/90 text-[10px] uppercase tracking-wide">
                          {product.collectionType.replace("-", " ")}
                        </span>
                      )}
                    </div>
                    <Link to={`/products/${product._id}`}>
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-surface-secondary">
                        {product.image ? (
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
                            className="btn-glass text-sm"
                          >
                            Quick view
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium text-primary line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-muted">
                          {product.brand} • {product.category}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-accent-primary">
                            {formatCurrency(product.price)}
                          </span>
                          {renderRatingStars(product.rating)}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {product.gender && (
                            <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                              {product.gender}
                            </span>
                          )}
                          {product.occasion && Array.isArray(product.occasion) && product.occasion.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                              {product.occasion[0]}
                            </span>
                          )}
                          {product.mood && Array.isArray(product.mood) && product.mood.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                              {product.mood[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={(e) => handleQuickAddToCart(product, e)}
                        className="flex-1 btn-primary text-sm py-2"
                      >
                        Add to cart
                      </button>
                      <Link
                        to={`/products/${product._id}`}
                        className="flex-1 btn-outline text-xs py-2 text-center"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter Section */}
        <section 
          ref={(el) => (sectionRefs.current[7] = el)}
          className="opacity-0 relative overflow-hidden rounded-3xl border border-border-subtle bg-gradient-to-br from-accent-primary/10 via-surface-primary to-accent-secondary/10 p-8 md:p-12"
        >
          <div className="absolute inset-0 bg-accent-gradient opacity-5" />
          
          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-4">
              Join the Scent Community
            </h2>
            <p className="text-muted mb-6">
              Subscribe to receive exclusive offers, new arrival alerts, and fragrance tips
            </p>

            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </form>

            <p className="text-xs text-muted mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-accent-primary/20 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-40 w-40 rounded-full bg-accent-secondary/20 blur-3xl" />
        </section>
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
                    src={quickViewProduct.image}
                    alt={quickViewProduct.name}
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
                      {quickViewProduct.notes.map((note) => (
                        <span key={note} className="badge badge-accent text-xs">
                          {note}
                        </span>
                      ))}
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

export default Home;
