import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

function AdminFeaturedCollections() {
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalProducts: 0,
  });
  
  const [form, setForm] = useState({
    slug: "",
    title: "",
    description: "",
    productsInput: "",
    sortOrder: 0,
    isActive: true,
  });
  
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [selectedProductsList, setSelectedProductsList] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setError("");
        setIsLoading(true);
        const response = await api.get("/api/featured-collections", {
          params: {
            active:
              statusFilter === "active"
                ? "true"
                : statusFilter === "inactive"
                ? "false"
                : undefined,
          },
        });

        const payload = Array.isArray(response.data)
          ? response.data
          : response.data.collections || [];

        setCollections(payload);

        // Calculate stats
        const totalProducts = payload.reduce(
          (sum, col) => sum + (Array.isArray(col.products) ? col.products.length : 0),
          0
        );

        setStats({
          total: payload.length,
          active: payload.filter((c) => c.isActive).length,
          totalProducts,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load featured collections. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [statusFilter]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsError("");
        setIsLoadingProducts(true);

        const response = await api.get("/api/products", {
          params: {
            pageSize: 100,
            page: 1,
          },
        });

        setProducts(response.data.products || []);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load products for selection.";
        setProductsError(message);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    // Update selected products list when productsInput changes
    const productIds = parseProductsInput(form.productsInput);
    const selectedProducts = products.filter((p) => productIds.includes(p._id));
    setSelectedProductsList(selectedProducts);
  }, [form.productsInput, products]);

  const resetForm = () => {
    setEditingId("");
    setForm({
      slug: "",
      title: "",
      description: "",
      productsInput: "",
      sortOrder: 0,
      isActive: true,
    });
    setSelectedProductsList([]);
    setShowForm(false);
    setPreviewMode(false);
  };

  const startEdit = (collection) => {
    setEditingId(collection._id);
    setForm({
      slug: collection.slug || "",
      title: collection.title || "",
      description: collection.description || "",
      productsInput: Array.isArray(collection.products)
        ? collection.products.map((product) => product._id).join(",")
        : "",
      sortOrder: collection.sortOrder ?? 0,
      isActive: Boolean(collection.isActive),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleProductsSelectChange = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions || []);
    const ids = selectedOptions.map((option) => option.value);

    setForm((previousForm) => ({
      ...previousForm,
      productsInput: ids.join(","),
    }));
  };

  const handleRemoveProduct = (productId) => {
    const currentIds = parseProductsInput(form.productsInput);
    const newIds = currentIds.filter((id) => id !== productId);
    setForm((prev) => ({
      ...prev,
      productsInput: newIds.join(","),
    }));
  };

  const parseProductsInput = (productsInput) => {
    if (!productsInput) return [];
    return productsInput
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const products = parseProductsInput(form.productsInput);

    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      products,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    try {
      setError("");
      setSuccess("");

      if (editingId) {
        const response = await api.put(
          `/api/featured-collections/${editingId}`,
          payload
        );
        const updated = response.data;

        setCollections((previousCollections) =>
          previousCollections.map((collection) =>
            collection._id === updated._id ? updated : collection
          )
        );
        setSuccess("Collection updated successfully!");
      } else {
        const response = await api.post("/api/featured-collections", payload);
        const created = response.data;

        setCollections((previousCollections) => [
          created,
          ...previousCollections,
        ]);
        setSuccess("Collection created successfully!");
      }

      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to save featured collection. Please check the form and try again.";
      setError(message);
    }
  };

  const handleToggleActive = async (collection) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.patch(
        `/api/featured-collections/${collection._id}/active`,
        {
          isActive: !collection.isActive,
        }
      );
      const updated = response.data;

      setCollections((previousCollections) =>
        previousCollections.map((item) =>
          item._id === updated._id ? updated : item
        )
      );
      setSuccess(
        `Collection ${updated.isActive ? "activated" : "deactivated"} successfully!`
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update collection status. Please try again.";
      setError(message);
    }
  };

  const handleDelete = async (collectionId) => {
    if (!window.confirm("Are you sure you want to delete this collection?"))
      return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/api/featured-collections/${collectionId}`);

      setCollections((prev) => prev.filter((c) => c._id !== collectionId));
      setSuccess("Collection deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete collection. Please try again.";
      setError(message);
    }
  };

  const filteredCollections = collections.filter(
    (collection) =>
      collection.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-12 bg-surface-secondary rounded w-full" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-secondary rounded-xl" />
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
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎯</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Featured Collections
              </h1>
            </div>
            <p className="text-muted">
              Create and manage featured product sections for your homepage
            </p>
          </div>
          <Link
            to="/admin/dashboard"
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Collections</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
            <p className="text-xs text-muted">Products Featured</p>
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

        {/* Create Button */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 btn-primary inline-flex items-center gap-2 group"
          >
            <span>+</span>
            <span>Create New Collection</span>
          </button>
        )}

        {/* Collection Form */}
        {showForm && (
          <div className="mb-8 card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <span>{editingId ? "✏️" : "➕"}</span>
                {editingId ? "Edit Collection" : "Create New Collection"}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="btn-outline text-sm px-3 py-1"
                >
                  {previewMode ? "Edit" : "Preview"}
                </button>
                <button
                  onClick={resetForm}
                  className="text-muted hover:text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {previewMode ? (
              // Collection Preview
              <div className="space-y-4">
                <div className="p-6 rounded-xl border border-border-subtle bg-surface-secondary">
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    {form.title || "Collection Title"}
                  </h3>
                  <p className="text-muted mb-4">
                    {form.description || "Collection description will appear here"}
                  </p>
                  <div className="flex gap-2 mb-4">
                    <span className="badge badge-accent">Slug: {form.slug || "collection-slug"}</span>
                    <span
                      className={`badge ${
                        form.isActive
                          ? "bg-success/20 text-success"
                          : "bg-muted/20 text-muted"
                      }`}
                    >
                      {form.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Preview Products Grid */}
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {selectedProductsList.slice(0, 4).map((product) => (
                      <div
                        key={product._id}
                        className="p-2 rounded-lg border border-border-subtle bg-surface-primary"
                      >
                        {(product.images && product.images.length > 0) || product.image ? (
                          <img
                            src={
                              product.images && product.images.length > 0
                                ? product.images[0]
                                : product.image
                            }
                            alt={product.name}
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                        ) : null}
                        <p className="text-xs font-medium text-primary truncate">
                          {product.name}
                        </p>
                        <p className="text-[10px] text-muted">₹{product.price}</p>
                      </div>
                    ))}
                    {selectedProductsList.length === 0 && (
                      <p className="text-sm text-muted col-span-4 text-center py-8">
                        No products selected for preview
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // Edit Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Slug */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">
                      Slug *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={form.slug}
                      onChange={handleChange}
                      required
                      placeholder="summer-collection-2024"
                      className="input w-full"
                    />
                    <p className="text-xs text-muted">
                      Unique identifier for this collection
                    </p>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="Summer Collection 2024"
                      className="input w-full"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-primary">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="Light, fresh scents for warm summer days"
                      className="input w-full"
                    />
                  </div>

                  {/* Products Selection */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-primary">
                      Products *
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <select
                          multiple
                          value={parseProductsInput(form.productsInput)}
                          onChange={handleProductsSelectChange}
                          className="input w-full min-h-[200px]"
                          size={6}
                        >
                          {isLoadingProducts ? (
                            <option value="" disabled>
                              Loading products...
                            </option>
                          ) : products.length === 0 ? (
                            <option value="" disabled>
                              No products available
                            </option>
                          ) : (
                            products.map((product) => (
                              <option key={product._id} value={product._id}>
                                {product.name} - ₹{product.price}
                              </option>
                            ))
                          )}
                        </select>
                        {productsError && (
                          <p className="text-xs text-error mt-1">{productsError}</p>
                        )}
                      </div>

                      {/* Selected Products */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-primary">
                          Selected Products ({selectedProductsList.length})
                        </p>
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                          {selectedProductsList.map((product) => (
                            <div
                              key={product._id}
                              className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary border border-border-subtle"
                            >
                              <div className="flex items-center gap-2">
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <div>
                                  <p className="text-xs font-medium text-primary truncate max-w-[150px]">
                                    {product.name}
                                  </p>
                                  <p className="text-[10px] text-muted">
                                    ₹{product.price}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveProduct(product._id)}
                                className="text-muted hover:text-error transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {selectedProductsList.length === 0 && (
                            <p className="text-xs text-muted text-center py-4">
                              No products selected
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      Hold Ctrl/Cmd to select multiple products
                    </p>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={form.sortOrder}
                      onChange={handleChange}
                      className="input w-full"
                      min="0"
                    />
                  </div>

                  {/* Active Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                      className="w-4 h-4 rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                    />
                    <label htmlFor="isActive" className="text-sm text-primary">
                      Active (visible on site)
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary px-6 py-2">
                    {editingId ? "Update Collection" : "Create Collection"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-outline px-6 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search collections by title or slug..."
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input px-4 py-2 sm:w-40"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              No Collections Found
            </h3>
            <p className="text-muted mb-6">
              {searchTerm || statusFilter
                ? "No collections match your filters"
                : "Create your first featured collection"}
            </p>
            {(searchTerm || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCollections.map((collection, index) => (
              <div
                key={collection._id}
                className="card p-6 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Collection Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-primary">
                          {collection.title}
                        </h3>
                        <p className="text-sm text-muted mt-1">
                          {collection.description || "No description"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            collection.isActive
                              ? "bg-success/20 text-success"
                              : "bg-muted/20 text-muted"
                          }`}
                        >
                          {collection.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-xs text-muted">Slug:</span>
                        <span className="ml-2 text-accent-primary font-mono">
                          {collection.slug}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted">Sort Order:</span>
                        <span className="ml-2 text-primary">
                          {collection.sortOrder || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted">Products:</span>
                        <span className="ml-2 text-primary">
                          {Array.isArray(collection.products)
                            ? collection.products.length
                            : 0}
                        </span>
                      </div>
                    </div>

                    {/* Products Preview */}
                    {Array.isArray(collection.products) &&
                      collection.products.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-primary mb-2">
                            Featured Products:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {collection.products.slice(0, 5).map((product) => (
                              <div
                                key={product._id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary border border-border-subtle"
                              >
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-8 h-8 rounded object-cover"
                                  />
                                )}
                                <span className="text-xs text-primary">
                                  {product.name}
                                </span>
                              </div>
                            ))}
                            {collection.products.length > 5 && (
                              <div className="flex items-center px-3 rounded-lg bg-surface-secondary border border-border-subtle">
                                <span className="text-xs text-muted">
                                  +{collection.products.length - 5} more
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-row lg:flex-col gap-2">
                    <button
                      onClick={() => startEdit(collection)}
                      className="btn-outline text-xs px-4 py-2 whitespace-nowrap"
                    >
                      Edit Collection
                    </button>
                    <button
                      onClick={() => handleToggleActive(collection)}
                      className={`btn-outline text-xs px-4 py-2 whitespace-nowrap ${
                        collection.isActive
                          ? "border-warning text-warning hover:bg-warning/10"
                          : "border-success text-success hover:bg-success/10"
                      }`}
                    >
                      {collection.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(collection._id)}
                      className="btn-outline text-xs px-4 py-2 whitespace-nowrap border-error text-error hover:bg-error/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminFeaturedCollections;
