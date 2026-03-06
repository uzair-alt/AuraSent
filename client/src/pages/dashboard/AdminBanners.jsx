import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [placementFilter, setPlacementFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    hero: 0,
    secondary: 0,
  });
  
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    placement: "home-hero",
    sortOrder: 0,
    isActive: true,
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setError("");
        setIsLoading(true);
        const response = await api.get("/api/banners", {
          params: {
            placement: placementFilter || undefined,
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
          : response.data.banners || [];

        setBanners(payload);

        // Calculate stats
        setStats({
          total: payload.length,
          active: payload.filter(b => b.isActive).length,
          hero: payload.filter(b => b.placement === "home-hero").length,
          secondary: payload.filter(b => b.placement === "home-secondary").length,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load banners. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, [placementFilter, statusFilter]);

  const resetForm = () => {
    setEditingId("");
    setForm({
      title: "",
      subtitle: "",
      imageUrl: "",
      linkUrl: "",
      placement: "home-hero",
      sortOrder: 0,
      isActive: true,
    });
    setImageFile(null);
    setImagePreview("");
    setImageUploadError("");
    setShowForm(false);
    setPreviewMode(false);
  };

  const startEdit = (banner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      linkUrl: banner.linkUrl || "",
      placement: banner.placement || "home-hero",
      sortOrder: banner.sortOrder ?? 0,
      isActive: Boolean(banner.isActive),
    });
    setImagePreview(banner.imageUrl || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      setError("");
      setSuccess("");

      if (editingId) {
        const response = await api.put(`/api/banners/${editingId}`, payload);
        const updated = response.data;

        setBanners((previousBanners) =>
          previousBanners.map((banner) =>
            banner._id === updated._id ? updated : banner
          )
        );
        setSuccess("Banner updated successfully!");
      } else {
        const response = await api.post("/api/banners", payload);
        const created = response.data;

        setBanners((previousBanners) => [created, ...previousBanners]);
        setSuccess("Banner created successfully!");
      }

      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to save banner. Please check the form and try again.";
      setError(message);
    }
  };

  const handleImageFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setImageUploadError("");
    setImagePreview("");

    if (!selectedFile) {
      setImageFile(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    
    setImageFile(selectedFile);
  };

  const handleUploadImage = async () => {
    if (!imageFile) return;

    setImageUploadError("");
    setIsUploadingImage(true);

    try {
      const fileToBase64 = (targetFile) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(targetFile);
        });

      const imagePayload = await fileToBase64(imageFile);

      const response = await api.post("/api/banners/upload-image", {
        image: imagePayload,
      });

      const uploadedUrl = response.data?.imageUrl;

      if (!uploadedUrl) {
        setImageUploadError("Upload succeeded but no URL was returned");
        return;
      }

      setForm((previous) => ({
        ...previous,
        imageUrl: uploadedUrl,
      }));
      
      setSuccess("Image uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to upload image. Please try again.";
      setImageUploadError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.patch(`/api/banners/${banner._id}/active`, {
        isActive: !banner.isActive,
      });
      const updated = response.data;

      setBanners((previousBanners) =>
        previousBanners.map((item) =>
          item._id === updated._id ? updated : item
        )
      );
      setSuccess(`Banner ${updated.isActive ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update banner status. Please try again.";
      setError(message);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/api/banners/${bannerId}`);
      
      setBanners((prev) => prev.filter((b) => b._id !== bannerId));
      setSuccess("Banner deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete banner. Please try again.";
      setError(message);
    }
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    setBanners(newBanners);
  };

  const handleMoveDown = (index) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    setBanners(newBanners);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-12 bg-surface-secondary rounded w-full" />
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
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
                Banner Management
              </h1>
            </div>
            <p className="text-muted">
              Create and manage promotional banners for your store
            </p>
          </div>
          <Link
            to="/admin/dashboard"
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Banners</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.hero}</p>
            <p className="text-xs text-muted">Hero Banners</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.secondary}</p>
            <p className="text-xs text-muted">Secondary</p>
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
            <span>Create New Banner</span>
          </button>
        )}

        {/* Banner Form */}
        {showForm && (
          <div className="mb-8 card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <span>{editingId ? '✏️' : '➕'}</span>
                {editingId ? 'Edit Banner' : 'Create New Banner'}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="btn-outline text-sm px-3 py-1"
                >
                  {previewMode ? 'Edit' : 'Preview'}
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
              // Banner Preview
              <div className="relative overflow-hidden rounded-xl border border-border-subtle bg-surface-secondary p-6">
                {form.imageUrl || imagePreview ? (
                  <img
                    src={imagePreview || form.imageUrl}
                    alt={form.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-surface-tertiary rounded-lg flex items-center justify-center">
                    <span className="text-muted">No image selected</span>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-bold text-primary">{form.title || 'Banner Title'}</h3>
                  <p className="text-sm text-muted">{form.subtitle || 'Banner subtitle will appear here'}</p>
                  <div className="flex gap-2">
                    <span className="badge badge-accent">{form.placement === 'home-hero' ? 'Hero Banner' : 'Secondary Banner'}</span>
                    <span className={`badge ${form.isActive ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted'}`}>
                      {form.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Form
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
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
                      placeholder="Discover your signature scent"
                      className="input w-full"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      value={form.subtitle}
                      onChange={handleChange}
                      placeholder="Handpicked fragrances for every mood"
                      className="input w-full"
                    />
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-primary">
                      Banner Image *
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <input
                          type="text"
                          name="imageUrl"
                          value={form.imageUrl}
                          onChange={handleChange}
                          required
                          placeholder="https://..."
                          className="input w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          className="text-xs text-muted file:mr-2 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-xs file:font-medium file:text-accent-primary hover:file:bg-accent-soft/80"
                        />
                        <button
                          type="button"
                          disabled={!imageFile || isUploadingImage}
                          onClick={handleUploadImage}
                          className="btn-outline text-xs px-3 py-1.5 whitespace-nowrap"
                        >
                          {isUploadingImage ? 'Uploading...' : 'Upload'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Image Preview */}
                    {(imagePreview || form.imageUrl) && (
                      <div className="mt-2 relative w-32 h-20 rounded-lg overflow-hidden border border-border-subtle">
                        <img
                          src={imagePreview || form.imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {imageUploadError && (
                      <p className="text-xs text-error mt-1">{imageUploadError}</p>
                    )}
                    <p className="text-xs text-muted">
                      Upload an image or paste a URL directly
                    </p>
                  </div>

                  {/* Link URL */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">
                      Link URL
                    </label>
                    <input
                      type="text"
                      name="linkUrl"
                      value={form.linkUrl}
                      onChange={handleChange}
                      placeholder="/collections/summer"
                      className="input w-full"
                    />
                  </div>

                  {/* Placement */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-primary">
                      Placement
                    </label>
                    <select
                      name="placement"
                      value={form.placement}
                      onChange={handleChange}
                      className="input w-full"
                    >
                      <option value="home-hero">Home Hero Banner</option>
                      <option value="home-secondary">Home Secondary Banner</option>
                    </select>
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
                    {editingId ? 'Update Banner' : 'Create Banner'}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-outline px-6 py-2">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="input px-4 py-2 sm:w-48"
          >
            <option value="">All Placements</option>
            <option value="home-hero">Home Hero</option>
            <option value="home-secondary">Home Secondary</option>
          </select>

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

        {/* Banners Grid */}
        {banners.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Banners Found</h3>
            <p className="text-muted mb-6">
              {placementFilter || statusFilter
                ? "No banners match your filters"
                : "Create your first banner to promote your products"}
            </p>
            {(placementFilter || statusFilter) && (
              <button
                onClick={() => {
                  setPlacementFilter("");
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
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className="card p-4 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Banner Preview */}
                  <div className="lg:w-64 flex-shrink-0">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-32 object-cover rounded-lg border border-border-subtle"
                      />
                    ) : (
                      <div className="w-full h-32 rounded-lg border border-dashed border-border-subtle bg-surface-secondary flex items-center justify-center">
                        <span className="text-xs text-muted">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Banner Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="text-sm text-muted">{banner.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          banner.isActive
                            ? 'bg-success/20 text-success'
                            : 'bg-muted/20 text-muted'
                        }`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                          {banner.placement === 'home-hero' ? 'Hero' : 'Secondary'}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 text-sm mb-3">
                      <div>
                        <span className="text-xs text-muted">Sort Order:</span>
                        <span className="ml-2 text-primary">{banner.sortOrder || 0}</span>
                      </div>
                      {banner.linkUrl && (
                        <div className="sm:col-span-2">
                          <span className="text-xs text-muted">Link:</span>
                          <span className="ml-2 text-accent-primary text-xs truncate">
                            {banner.linkUrl}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => startEdit(banner)}
                        className="btn-outline text-xs px-3 py-1.5"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(banner)}
                        className={`btn-outline text-xs px-3 py-1.5 ${
                          banner.isActive
                            ? 'border-warning text-warning hover:bg-warning/10'
                            : 'border-success text-success hover:bg-success/10'
                        }`}
                      >
                        {banner.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="btn-outline text-xs px-3 py-1.5 border-error text-error hover:bg-error/10"
                      >
                        Delete
                      </button>
                      <div className="flex gap-1 ml-auto">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="btn-outline text-xs px-2 py-1.5 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === banners.length - 1}
                          className="btn-outline text-xs px-2 py-1.5 disabled:opacity-40"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
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

export default AdminBanners;