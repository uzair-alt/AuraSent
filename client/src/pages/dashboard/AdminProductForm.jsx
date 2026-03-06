import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
const NOTE_CATEGORIES = [
  { value: "citrus", label: "Citrus", icon: "🍊" },
  { value: "floral", label: "Floral", icon: "🌸" },
  { value: "woody", label: "Woody", icon: "🌲" },
  { value: "amber", label: "Amber", icon: "✨" },
  { value: "fresh", label: "Fresh", icon: "💧" },
  { value: "gourmand", label: "Gourmand", icon: "🍰" },
  { value: "aromatic", label: "Aromatic", icon: "🌿" },
  { value: "spicy", label: "Spicy", icon: "🌶️" },
  { value: "fruity", label: "Fruity", icon: "🍎" },
  { value: "musk", label: "Musk", icon: "🦌" },
];

function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
   const [categoryId, setCategoryId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [topNotes, setTopNotes] = useState("");
  const [middleNotes, setMiddleNotes] = useState("");
  const [baseNotes, setBaseNotes] = useState("");
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [gender, setGender] = useState("");
  const [occasion, setOccasion] = useState("");
  const [mood, setMood] = useState("");
  const [collectionType, setCollectionType] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setError("");
        const response = await api.get(`/api/products/${id}`);
        const product = response.data;

        setName(product.name || "");
        setBrand(product.brand || "");
        setDescription(product.description || "");
        setPrice(product.price != null ? String(product.price) : "");
        setStock(product.stock != null ? String(product.stock) : "");
        setCategory(product.category || "");
        setCategoryId(product.categoryId || "");
        setIsFeatured(!!product.isFeatured);
        setGender(product.gender || "");

        const existingOccasion = Array.isArray(product.occasion)
          ? product.occasion.join(", ")
          : "";
        const existingMood = Array.isArray(product.mood)
          ? product.mood.join(", ")
          : "";

        setOccasion(existingOccasion);
        setMood(existingMood);
        setCollectionType(product.collectionType || "");

        const notes = product.notes || {};
        setTopNotes((notes.top || []).join(", "));
        setMiddleNotes((notes.middle || []).join(", "));
        setBaseNotes((notes.base || []).join(", "));

        if (product.image) {
          setImagePreview(product.image);
        }

        const images = Array.isArray(product.images) ? product.images : [];
        if (images.length > 0) {
          setGalleryPreviews(images);
        }
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message || "Failed to load product";
        setError(message);
      }
    };

    fetchProduct();
  }, [id]);

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

  // Mock suggestions - in real app, these would come from API
  useEffect(() => {
    if (name.length > 2) {
      setSuggestions([
        { name: `${name} Eau de Parfum`, brand: "Designer Brand" },
        { name: `${name} Intense`, brand: "Luxury House" },
        { name: `${name} Private Collection`, brand: "Niche Perfumer" },
      ]);
    } else {
      setSuggestions([]);
    }
  }, [name]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setImagePreview("");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!selectedFile.type.startsWith("image/")) {
      setError("File must be an image");
      return;
    }

    setFile(selectedFile);
    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreview(previewUrl);
    setError("");
  };

  const handleGalleryChange = (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      setGalleryFiles([]);
      setGalleryPreviews([]);
      return;
    }

    const validFiles = [];
    const previews = [];

    for (const current of files) {
      if (current.size > 5 * 1024 * 1024) {
        setError("Gallery images must be less than 5MB each");
        continue;
      }

      if (!current.type.startsWith("image/")) {
        setError("Gallery files must be images");
        continue;
      }

      validFiles.push(current);
      previews.push(URL.createObjectURL(current));
    }

    setGalleryFiles(validFiles);
    setGalleryPreviews(previews);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!name || !brand || !description || !price || !stock || !category) {
      setError("All required fields must be filled");
      return;
    }

    if (!id && !file && galleryFiles.length === 0) {
      setError("At least one product image is required");
      return;
    }

    if (Number(price) <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    if (Number(stock) < 0) {
      setError("Stock cannot be negative");
      return;
    }

    setIsSubmitting(true);

    try {
      const fileToBase64 = (targetFile) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(targetFile);
        });

      let imagePayload;
      let galleryPayload = [];

      if (file) {
        imagePayload = await fileToBase64(file);
      }

      if (galleryFiles.length > 0) {
        galleryPayload = await Promise.all(
          galleryFiles.map((current) => fileToBase64(current))
        );
      }

      const notes = {
        top: topNotes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        middle: middleNotes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        base: baseNotes
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      };

      const occasionValues = occasion
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const moodValues = mood
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      let categoryName = category;

      if (categoryId && categories.length > 0) {
        const matched = categories.find(
          (item) => String(item._id) === String(categoryId)
        );
        if (matched) {
          categoryName = matched.name || categoryName;
        }
      }

      const payload = {
        name,
        brand,
        description,
        price: Number(price),
        stock: Number(stock),
        category: categoryName,
        categoryId: categoryId || null,
        gender,
        occasion: occasionValues,
        mood: moodValues,
        collectionType,
        isFeatured,
        notes,
      };

      if (imagePayload) {
        payload.image = imagePayload;
      }

      if (galleryPayload.length > 0) {
        payload.images = galleryPayload;
      }

      if (id) {
        await api.put(`/api/products/${id}`, payload);
        setSuccess("Product updated successfully!");
      } else {
        await api.post("/api/products", payload);
        setSuccess("Product created successfully!");
      }

      setTimeout(() => {
        navigate("/admin/products");
      }, 1500);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to save product. Please try again.";
      setError(message);
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setName(suggestion.name);
    setBrand(suggestion.brand);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-page">
      <main className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{id ? "✏️" : "➕"}</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                {id ? "Edit Product" : "Create New Product"}
              </h1>
            </div>
            <p className="text-muted">
              {id
                ? "Update product details and images"
                : "Add a new fragrance to your catalog"}
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/products")}
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Products</span>
          </button>
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

        {/* Form Tabs */}
        <div className="mb-6 flex gap-2 border-b border-border-subtle">
          {[
            { id: "basic", label: "Basic Info", icon: "📝" },
            { id: "notes", label: "Fragrance Notes", icon: "🌸" },
            { id: "media", label: "Media", icon: "🖼️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? "text-accent-primary"
                  : "text-muted hover:text-primary"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-gradient" />
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Tab */}
              {activeTab === "basic" && (
                <div className="card p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span>📝</span> Basic Information
                  </h2>

                  {/* Name with suggestions */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Product Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input w-full"
                        placeholder="e.g. Midnight Rose Eau de Parfum"
                      />
                      {suggestions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-lg border border-border-subtle bg-surface-primary shadow-lg animate-slide-up">
                          {suggestions.map((s, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(s)}
                              className="w-full px-4 py-2 text-left hover:bg-accent-soft transition-colors first:rounded-t-lg last:rounded-b-lg"
                            >
                              <p className="text-sm text-primary">{s.name}</p>
                              <p className="text-xs text-muted">{s.brand}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Brand */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Brand *
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="input w-full"
                      placeholder="e.g. Chanel, Dior, Tom Ford"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setCategoryId(nextId);
                        if (!nextId) {
                          setCategory("");
                          return;
                        }
                        const matched = categories.find(
                          (item) => String(item._id) === String(nextId)
                        );
                        if (matched) {
                          setCategory(matched.name || "");
                        }
                      }}
                      className="input w-full"
                    >
                      <option value="">Select category</option>
                      {isLoadingCategories ? (
                        <option value="" disabled>
                          Loading categories...
                        </option>
                      ) : (
                        categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Gender
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">Not specified</option>
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                        <option value="unisex">Unisex</option>
                        <option value="kids">Kids</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Collection Type
                      </label>
                      <select
                        value={collectionType}
                        onChange={(e) => setCollectionType(e.target.value)}
                        className="input w-full"
                      >
                        <option value="">None</option>
                        <option value="best-sellers">Best Sellers</option>
                        <option value="new-arrivals">New Arrivals</option>
                        <option value="limited-edition">Limited Edition</option>
                        <option value="gift-sets">Gift Sets</option>
                        <option value="travel-minis">Travel Size / Minis</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Occasions
                      </label>
                      <input
                        type="text"
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        className="input w-full"
                        placeholder="Comma separated, e.g. daily, office, date-night"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Mood / Personality
                      </label>
                      <input
                        type="text"
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="input w-full"
                        placeholder="Comma separated, e.g. romantic, fresh, bold"
                      />
                    </div>
                  </div>

                  {/* Price and Stock */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="input w-full"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-primary">
                        Stock *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className="input w-full"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Featured Checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                    />
                    <label htmlFor="isFeatured" className="text-sm text-primary">
                      Mark as featured product
                    </label>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Description *
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={5}
                      className="input w-full resize-none"
                      placeholder="Describe the fragrance, its character, and the mood it evokes..."
                    />
                    <p className="text-xs text-muted text-right">
                      {description.length} characters
                    </p>
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === "notes" && (
                <div className="card p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span>🌸</span> Fragrance Notes
                  </h2>

                  {/* Note Suggestions */}
                  <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-surface-secondary border border-border-subtle">
                    <span className="text-xs text-muted">Quick add:</span>
                    {NOTE_CATEGORIES.map((note) => (
                      <button
                        key={note.value}
                        type="button"
                        onClick={() => {
                          const current = topNotes ? `${topNotes}, ${note.label}` : note.label;
                          setTopNotes(current);
                        }}
                        className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs hover:bg-accent-primary hover:text-white transition-colors"
                      >
                        {note.icon} {note.label}
                      </button>
                    ))}
                  </div>

                  {/* Top Notes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Top Notes
                    </label>
                    <input
                      type="text"
                      value={topNotes}
                      onChange={(e) => setTopNotes(e.target.value)}
                      className="input w-full"
                      placeholder="Bergamot, Grapefruit, Lemon"
                    />
                    <p className="text-xs text-muted">
                      Separate notes with commas
                    </p>
                  </div>

                  {/* Middle Notes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Heart Notes
                    </label>
                    <input
                      type="text"
                      value={middleNotes}
                      onChange={(e) => setMiddleNotes(e.target.value)}
                      className="input w-full"
                      placeholder="Lavender, Rose, Jasmine"
                    />
                  </div>

                  {/* Base Notes */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-primary">
                      Base Notes
                    </label>
                    <input
                      type="text"
                      value={baseNotes}
                      onChange={(e) => setBaseNotes(e.target.value)}
                      className="input w-full"
                      placeholder="Vanilla, Musk, Cedarwood"
                    />
                  </div>

                  {/* Notes Preview */}
                  {(topNotes || middleNotes || baseNotes) && (
                    <div className="mt-4 p-4 rounded-lg bg-surface-secondary border border-border-subtle">
                      <h3 className="text-sm font-medium text-primary mb-3">Notes Pyramid Preview</h3>
                      <div className="space-y-2">
                        {topNotes && (
                          <div>
                            <span className="text-xs text-muted">Top:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {topNotes.split(",").map((note, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                                  {note.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {middleNotes && (
                          <div>
                            <span className="text-xs text-muted">Heart:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {middleNotes.split(",").map((note, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                                  {note.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {baseNotes && (
                          <div>
                            <span className="text-xs text-muted">Base:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {baseNotes.split(",").map((note, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                                  {note.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Media Tab */}
              {activeTab === "media" && (
                <div className="card p-6 space-y-4 animate-fade-in">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span>🖼️</span> Product Images
                  </h2>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border-subtle rounded-xl p-6 text-center hover:border-accent-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer block"
                        >
                          <div className="text-4xl mb-3">📸</div>
                          <p className="text-sm text-primary mb-1">
                            Click to upload main image
                          </p>
                          <p className="text-xs text-muted">
                            PNG, JPG, WEBP up to 5MB
                          </p>
                        </label>
                      </div>

                      {imagePreview && (
                        <div className="relative group">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-96 object-contain rounded-xl border border-border-subtle bg-surface-secondary"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFile(null);
                              setImagePreview("");
                            }}
                            className="absolute top-2 right-2 p-2 rounded-full bg-surface-primary border border-border-subtle text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                          <span>🖼️</span> Gallery Images
                        </h3>
                        {galleryPreviews.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setGalleryFiles([]);
                              setGalleryPreviews([]);
                            }}
                            className="text-xs text-muted hover:text-error"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      <div className="border-2 border-dashed border-border-subtle rounded-xl p-4 text-center hover:border-accent-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleGalleryChange}
                          className="hidden"
                          id="gallery-upload"
                        />
                        <label
                          htmlFor="gallery-upload"
                          className="cursor-pointer block"
                        >
                          <p className="text-sm text-primary mb-1">
                            Add additional images
                          </p>
                          <p className="text-xs text-muted">
                            You can upload multiple images at once
                          </p>
                        </label>
                      </div>

                      {galleryPreviews.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {galleryPreviews.map((preview, index) => (
                            <div
                              key={preview}
                              className="relative aspect-square rounded-lg overflow-hidden border border-border-subtle bg-surface-secondary group"
                            >
                              <img
                                src={preview}
                                alt={`Gallery ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setGalleryFiles((previous) =>
                                    previous.filter((_, i) => i !== index)
                                  );
                                  setGalleryPreviews((previous) =>
                                    previous.filter((_, i) => i !== index)
                                  );
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-surface-primary border border-border-subtle text-[10px] text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Form Actions */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-primary mb-4">Form Actions</h3>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-3 text-sm font-medium group disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>{id ? "Saving..." : "Creating..."}</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>{id ? "Save Changes" : "Create Product"}</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/products")}
                    className="w-full btn-outline py-3 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Product Tips */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                  <span>💡</span> Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary">•</span>
                    Use high-quality images for better conversions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary">•</span>
                    Add detailed fragrance notes to help customers choose
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary">•</span>
                    Featured products appear on the homepage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent-primary">•</span>
                    Keep stock levels accurate to avoid overselling
                  </li>
                </ul>
              </div>

              {/* Preview Card */}
              {name && (
                <div className="card p-6 animate-slide-up">
                  <h3 className="text-sm font-semibold text-primary mb-3">Preview</h3>
                  <div className="space-y-2">
                    <div className="aspect-square rounded-lg bg-surface-secondary flex items-center justify-center overflow-hidden">
                      {imagePreview || galleryPreviews[0] ? (
                        <img
                          src={imagePreview || galleryPreviews[0]}
                          alt={name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-4xl">🌸</span>
                      )}
                    </div>
                    <p className="font-medium text-primary">{name || "Product Name"}</p>
                    <p className="text-sm text-accent-primary">₹{price || "0"}</p>
                    <p className="text-xs text-muted">{brand || "Brand"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AdminProductForm;
