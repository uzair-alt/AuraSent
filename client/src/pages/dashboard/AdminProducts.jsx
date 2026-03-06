import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
const BRAND_OPTIONS = ["Chanel", "Dior", "Tom Ford", "Creed", "Jo Malone", "Byredo"];

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterKeyword, setFilterKeyword] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [filterStock, setFilterStock] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    outOfStock: 0,
    lowStock: 0,
    featured: 0,
  });
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError("");
        setIsLoading(true);

        const params = { 
          pageSize: 20, 
          page,
          sort: `${sortBy}:${sortOrder}`
        };

        if (filterKeyword.trim()) params.keyword = filterKeyword.trim();
        if (filterBrand.trim()) params.brand = filterBrand.trim();
        if (filterCategory.trim()) params.category = filterCategory.trim();
        if (filterFeatured) params.isFeatured = true;
        if (filterStock === "out") params.stock = 0;
        if (filterStock === "low") params.stockLow = 5;

        const response = await api.get("/api/products", { params });
        const productsData = response.data.products || [];
        setProducts(productsData);
        setPage(response.data.page || 1);
        setTotalPages(response.data.totalPages || 1);

        // Calculate stats
        const totalValue = productsData.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
        setStats({
          total: productsData.length,
          totalValue,
          outOfStock: productsData.filter(p => p.stock === 0).length,
          lowStock: productsData.filter(p => p.stock > 0 && p.stock <= 5).length,
          featured: productsData.filter(p => p.isFeatured).length,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message || "Failed to load products";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [page, filterKeyword, filterBrand, filterCategory, filterFeatured, filterStock, sortBy, sortOrder]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await api.get("/api/categories");
        if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch {
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/api/products/${productId}`);
      setProducts((prev) => prev.filter((product) => product._id !== productId));
      setSuccess("Product deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete product. Please try again.";
      setError(message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProducts.length} selected products?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      
      // Delete products one by one
      await Promise.all(
        selectedProducts.map(id => api.delete(`/api/products/${id}`))
      );

      setProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
      setSuccess(`Deleted ${selectedProducts.length} products`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete products. Please try again.";
      setError(message);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setError("");
      setSuccess("");
      
      // Archive products one by one
      await Promise.all(
        selectedProducts.map(id => api.put(`/api/products/${id}/archive`))
      );

      setProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
      setSuccess(`Archived ${selectedProducts.length} products`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to archive products. Please try again.";
      setError(message);
    }
  };

  const handleToggleSelect = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p._id));
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-error/20 text-error" };
    if (stock <= 5) return { label: "Low Stock", color: "bg-warning/20 text-warning" };
    return { label: "In Stock", color: "bg-success/20 text-success" };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-surface-secondary rounded-xl" />
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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📦</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Product Management
              </h1>
            </div>
            <p className="text-muted">
              Manage your product catalog, inventory, and featured items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dashboard"
              className="btn-outline inline-flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Dashboard</span>
            </Link>
            <Link
              to="/admin/products/archived"
              className="btn-outline inline-flex items-center gap-2"
            >
              <span>🗄️</span>
              <span>Archived</span>
            </Link>
            <Link
              to="/admin/products/new"
              className="btn-primary inline-flex items-center gap-2 group"
            >
              <span>+</span>
              <span>Add Product</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Products</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-accent-primary">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-muted">Inventory Value</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-error">{stats.outOfStock}</p>
            <p className="text-xs text-muted">Out of Stock</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-warning">{stats.lowStock}</p>
            <p className="text-xs text-muted">Low Stock</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.featured}</p>
            <p className="text-xs text-muted">Featured</p>
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
        
        {success && (
          <div className="mb-6 rounded-xl border border-success/20 bg-success/10 p-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="text-success text-lg">✓</span>
              <p className="text-sm text-success">{success}</p>
            </div>
          </div>
        )}

        {/* Filters and Bulk Actions */}
        <div className="mb-6 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="Search by product name..."
                  className="input w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>

            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="">All Brands</option>
              {BRAND_OPTIONS.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="">All Categories</option>
              {isLoadingCategories ? (
                <option value="" disabled>
                  Loading...
                </option>
              ) : (
                categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>

            <select
              value={filterStock}
              onChange={(e) => setFilterStock(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock (≤5)</option>
              <option value="out">Out of Stock</option>
            </select>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-primary whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={filterFeatured}
                  onChange={(e) => setFilterFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                />
                <span>Featured Only</span>
              </label>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input px-3 py-2 text-sm w-32"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="rating">Rating</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                className="btn-outline px-3 py-2 text-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>

            {(filterKeyword || filterBrand || filterCategory || filterFeatured || filterStock !== "all") && (
              <button
                onClick={() => {
                  setPage(1);
                  setFilterKeyword("");
                  setFilterBrand("");
                  setFilterCategory("");
                  setFilterFeatured(false);
                  setFilterStock("all");
                }}
                className="btn-outline px-4 py-2 text-sm whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent-soft border border-accent-primary/20 animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary font-medium">
                  {selectedProducts.length} product(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkArchive}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Archive Selected
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="btn-outline border-error text-error hover:bg-error/10 text-sm px-4 py-2"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Products Found</h3>
            <p className="text-muted mb-6">
              {filterKeyword || filterBrand || filterCategory || filterFeatured || filterStock !== "all"
                ? "No products match your filters"
                : "Get started by adding your first product"}
            </p>
            {(filterKeyword || filterBrand || filterCategory || filterFeatured || filterStock !== "all") ? (
              <button
                onClick={() => {
                  setFilterKeyword("");
                  setFilterBrand("");
                  setFilterCategory("");
                  setFilterFeatured(false);
                  setFilterStock("all");
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            ) : (
              <Link to="/admin/products/new" className="btn-primary">
                Add First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary border-b border-border-subtle">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length}
                          onChange={handleSelectAll}
                          className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">
                        Featured
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {products.map((product, index) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <tr
                          key={product._id}
                          className="hover:bg-surface-secondary transition-colors animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProducts.includes(product._id)}
                              onChange={() => handleToggleSelect(product._id)}
                              className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {(product.images && product.images.length > 0) || product.image ? (
                                <div className="relative h-10 w-10">
                                  <img
                                    src={
                                      product.images && product.images.length > 0
                                        ? product.images[0]
                                        : product.image
                                    }
                                    alt={product.name}
                                    className="h-10 w-10 rounded-lg object-cover border border-border-subtle"
                                  />
                                  {product.images &&
                                    product.images.length > 1 && (
                                      <span className="absolute -bottom-1 -right-1 rounded-full bg-surface-primary border border-border-subtle px-1.5 py-0.5 text-[10px] text-muted shadow-sm">
                                        +{product.images.length - 1}
                                      </span>
                                    )}
                                </div>
                              ) : null}
                              <div>
                                <p className="font-medium text-primary">{product.name}</p>
                                <p className="text-xs text-muted">ID: {product._id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {product.brand || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {product.category && (
                              <span className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                                {product.category}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
                              {stockStatus.label} ({product.stock})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-accent-primary">
                            {formatCurrency(product.price)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {product.isFeatured ? (
                              <span className="text-success text-lg">★</span>
                            ) : (
                              <span className="text-muted text-lg">☆</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-sm text-primary">
                                {product.rating?.toFixed(1) || '0.0'}
                              </span>
                              <Link
                                to={`/admin/products/${product._id}/reviews`}
                                className="text-xs text-accent-primary hover:text-accent-secondary"
                              >
                                {product.numReviews || 0} reviews
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/admin/products/${product._id}/edit`}
                                className="btn-outline text-xs px-3 py-1.5"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(product._id)}
                                className="btn-outline text-xs px-3 py-1.5 border-error text-error hover:bg-error/10"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-3 border-t border-border-subtle bg-surface-secondary">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    Showing {products.length} products • Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-4">
                    <span className="text-muted">
                      Total Value: {formatCurrency(products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminProducts;
