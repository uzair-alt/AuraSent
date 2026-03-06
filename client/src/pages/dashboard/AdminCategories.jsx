import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";

function getSession() {
  const stored = localStorage.getItem("auth");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    parent: "",
    image: "",
    icon: "",
    isActive: true,
    sortOrder: 0,
    metaTitle: "",
    metaDescription: "",
  });

  useEffect(() => {
    const session = getSession();

    if (!session || !session.user?.isAdmin) {
      navigate("/login");
      return;
    }

    const fetchCategories = async () => {
      try {
        setError("");
        setIsLoading(true);
        const response = await api.get("/api/categories");
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load categories";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [navigate]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      parent: "",
      image: "",
      icon: "",
      isActive: true,
      sortOrder: 0,
      metaTitle: "",
      metaDescription: "",
    });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue =
      type === "checkbox"
        ? checked
        : name === "sortOrder"
        ? Number(value) || 0
        : value;
    setForm((previous) => ({
      ...previous,
      [name]: nextValue,
    }));
  };

  const handleEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || "",
      slug: category.slug || "",
      description: category.description || "",
      parent: category.parent || "",
      image: category.image || "",
      icon: category.icon || "",
      isActive: category.isActive ?? true,
      sortOrder: typeof category.sortOrder === "number" ? category.sortOrder : 0,
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/api/categories/${categoryId}`);
      setCategories((previous) =>
        previous.filter((item) => item._id !== categoryId)
      );
      resetForm();
      setSuccess("Category deleted");
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete category";
      setError(message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setError("");
      setSuccess("");

      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        parent: form.parent || null,
        image: form.image,
        icon: form.icon,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
      };

      if (!editing) {
        const response = await api.post("/api/categories", payload);
        setCategories((previous) => [response.data, ...previous]);
        resetForm();
        setSuccess("Category created");
      } else {
        const response = await api.put(
          `/api/categories/${editing._id}`,
          payload
        );
        setCategories((previous) =>
          previous.map((item) =>
            item._id === editing._id ? response.data : item
          )
        );
        resetForm();
        setSuccess("Category updated");
      }
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to save category";
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="h-24 bg-surface-secondary rounded-xl"
                />
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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🗂️</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Categories
              </h1>
            </div>
            <p className="text-muted">
              Manage your fragrance categories and how they appear in the store.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-success/20 bg-success/10 p-3">
            <p className="text-sm text-success">{success}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1 card p-6">
            <h2 className="text-lg font-semibold text-primary mb-4">
              {editing ? "Edit Category" : "Create Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="e.g. Women's Fragrances"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Slug
                </label>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="womens-fragrances"
                />
                <p className="text-[11px] text-muted">
                  If left blank, it will be generated from the name.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Parent Category
                </label>
                <select
                  name="parent"
                  value={form.parent}
                  onChange={handleChange}
                  className="input w-full text-sm"
                >
                  <option value="">None (top level)</option>
                  {categories
                    .filter((cat) => !cat.parent)
                    .map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="input w-full min-h-[60px]"
                  placeholder="Short description for this category"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Image URL
                  </label>
                  <input
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    className="input w-full text-sm"
                    placeholder="/images/categories/women.jpg"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Icon
                  </label>
                  <input
                    name="icon"
                    value={form.icon}
                    onChange={handleChange}
                    className="input w-full text-sm"
                    placeholder="👩"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-sm text-primary">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                    className="rounded border-border-subtle text-accent-primary focus:ring-accent-primary"
                  />
                  Active
                </label>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={form.sortOrder}
                    onChange={handleChange}
                    className="input w-full text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Meta Title
                </label>
                <input
                  name="metaTitle"
                  value={form.metaTitle}
                  onChange={handleChange}
                  className="input w-full text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Meta Description
                </label>
                <textarea
                  name="metaDescription"
                  value={form.metaDescription}
                  onChange={handleChange}
                  className="input w-full min-h-[60px]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" className="btn-primary text-sm px-4 py-2">
                  {editing ? "Update Category" : "Create Category"}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-outline text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">
                Existing Categories
              </h2>
              <span className="text-xs text-muted">
                {categories.length} total
              </span>
            </div>

            {categories.length === 0 ? (
              <p className="text-sm text-muted">
                No categories yet. Create your first category using the form.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted border-b border-border-subtle">
                      <th className="py-2 pr-4 text-left">Name</th>
                      <th className="py-2 pr-4 text-left hidden md:table-cell">
                        Slug
                      </th>
                      <th className="py-2 pr-4 text-left hidden md:table-cell">
                        Parent
                      </th>
                      <th className="py-2 pr-4 text-center">Active</th>
                      <th className="py-2 pr-4 text-right">Sort</th>
                      <th className="py-2 pl-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => {
                      const parent =
                        category.parent &&
                        categories.find(
                          (c) => String(c._id) === String(category.parent)
                        );
                      return (
                        <tr
                          key={category._id}
                          className="border-b border-border-subtle/60 last:border-b-0"
                        >
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              {category.icon && (
                                <span className="text-lg">
                                  {category.icon}
                                </span>
                              )}
                              <div>
                                <p className="text-sm text-primary">
                                  {category.name}
                                </p>
                                {category.description && (
                                  <p className="text-[11px] text-muted line-clamp-1">
                                    {category.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-xs text-muted hidden md:table-cell">
                            {category.slug}
                          </td>
                          <td className="py-2 pr-4 text-xs text-muted hidden md:table-cell">
                            {parent ? parent.name : "—"}
                          </td>
                          <td className="py-2 pr-4 text-center">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                                category.isActive
                                  ? "bg-success/10 text-success"
                                  : "bg-border-subtle text-muted"
                              }`}
                            >
                              {category.isActive ? "Active" : "Hidden"}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-right text-xs text-muted">
                            {category.sortOrder ?? 0}
                          </td>
                          <td className="py-2 pl-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(category)}
                                className="text-xs text-accent-primary hover:text-accent-secondary"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(category._id)}
                                className="text-xs text-error hover:text-error/80"
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
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminCategories;
