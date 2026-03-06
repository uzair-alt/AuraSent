import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";
import { getImageUrl } from "../../utils/images";

function AdminArchivedProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalValue: 0,
    averagePrice: 0,
    totalStock: 0,
  });

  useEffect(() => {
    const fetchArchivedProducts = async () => {
      try {
        setError("");
        setIsLoading(true);
        const response = await api.get("/api/products/archived/list");
        const productsData = response.data || [];
        setProducts(productsData);

        // Extract unique categories
        const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
        setCategories(uniqueCategories);

        // Calculate stats
        const total = productsData.length;
        const totalValue = productsData.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
        const averagePrice = total > 0 ? totalValue / total : 0;
        const totalStock = productsData.reduce((sum, p) => sum + (p.stock || 0), 0);

        setStats({ total, totalValue, averagePrice, totalStock });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load archived products";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArchivedProducts();
  }, []);

  const handleRestore = async (productId) => {
    try {
      setError("");
      setSuccess("");
      setIsRestoring(true);

      await api.put(`/api/products/${productId}/restore`);
      
      setProducts((prev) => prev.filter((product) => product._id !== productId));
      setSelectedProducts((prev) => prev.filter(id => id !== productId));
      
      setSuccess("Product restored successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to restore product. Please try again.";
      setError(message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setError("");
      setSuccess("");
      setIsRestoring(true);

      // Restore products one by one
      for (const productId of selectedProducts) {
        await api.put(`/api/products/${productId}/restore`);
      }

      setProducts((prev) => prev.filter((product) => !selectedProducts.includes(product._id)));
      setSelectedProducts([]);
      
      setSuccess(`${selectedProducts.length} products restored successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to restore products. Please try again.";
      setError(message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p._id));
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.brand?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(product => filterCategory === "all" || product.category === filterCategory)
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "brand":
          comparison = (a.brand || "").localeCompare(b.brand || "");
          break;
        case "price":
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case "stock":
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
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
              <span className="text-3xl">🗑️</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Archived Products
              </h1>
            </div>
            <p className="text-muted">
              Manage products removed from the active catalog
            </p>
          </div>
          <Link
            to="/admin/products"
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Products</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Archived</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
            <p className="text-xs text-muted">Total Value</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.averagePrice)}</p>
            <p className="text-xs text-muted">Avg Price</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.totalStock}</p>
            <p className="text-xs text-muted">Total Stock</p>
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

        {/* Filters and Actions */}
        <div className="mb-6 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, brand, or category..."
                  className="input w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input px-4 py-2 sm:w-48"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="name">Sort by Name</option>
              <option value="brand">Sort by Brand</option>
              <option value="price">Sort by Price</option>
              <option value="stock">Sort by Stock</option>
            </select>

            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="btn-outline px-4 py-2"
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent-soft border border-accent-primary/20 animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary">
                  {selectedProducts.length} product(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleBulkRestore}
                  disabled={isRestoring}
                  className="btn-primary text-sm px-4 py-2"
                >
                  {isRestoring ? 'Restoring...' : 'Restore Selected'}
                </button>
                <button
                  onClick={() => setSelectedProducts([])}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Archived Products</h3>
            <p className="text-muted mb-6">
              There are no products in the archive
            </p>
            <Link
              to="/admin/products"
              className="btn-primary inline-flex items-center gap-2"
            >
              <span>←</span> Go to Active Products
            </Link>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No products match your filters</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length}
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredProducts.map((product, index) => (
                    <tr
                      key={product._id}
                      className="hover:bg-surface-secondary transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleSelectProduct(product._id)}
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
                                    ? getImageUrl(product.images[0])
                                    : getImageUrl(product.image)
                                }
                                alt={product.name}
                                loading="lazy"
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
                          <span className="font-medium text-primary">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {product.brand || '-'}
                      </td>
                      <td className="px-4 py-3 text-secondary">
                        {product.category ? (
                          <span className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                            {product.category}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${
                          product.stock > 0 ? 'text-success' : 'text-error'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-primary">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(product._id)}
                            disabled={isRestoring}
                            className="btn-outline text-xs px-3 py-1.5 border-success text-success hover:bg-success/10"
                          >
                            Restore
                          </button>
                          <Link
                            to={`/admin/products/${product._id}`}
                            className="btn-outline text-xs px-3 py-1.5"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 border-t border-border-subtle bg-surface-secondary">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Showing {filteredProducts.length} of {products.length} products
                </span>
                <span className="text-muted">
                  Total Value: {formatCurrency(
                    filteredProducts.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 p-6 card bg-warning/5 border-warning/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-lg font-semibold text-warning mb-2">About Archived Products</h3>
              <p className="text-sm text-muted mb-3">
                Archived products are removed from the active catalog but can be restored at any time. 
                This is useful for seasonal items, discontinued products, or items you want to temporarily hide.
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-success">✓ Restore to make products visible again</span>
                <span className="text-muted">• Stock levels are preserved</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminArchivedProducts;
