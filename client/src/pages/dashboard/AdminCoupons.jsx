import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    used: 0,
  });
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    isActive: true,
    usageLimit: "",
    usedCount: 0,
  });

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setError("");
        setIsLoading(true);
        const response = await api.get("/api/coupons", {
          params: {
            q: search || undefined,
            active:
              statusFilter === "active"
                ? "true"
                : statusFilter === "inactive"
                ? "false"
                : undefined,
            type: typeFilter || undefined,
          },
        });

        const payload = Array.isArray(response.data)
          ? response.data
          : response.data.coupons || [];

        setCoupons(payload);

        // Calculate stats
        const now = new Date();
        const stats = {
          total: payload.length,
          active: payload.filter(c => c.isActive).length,
          expired: payload.filter(c => c.endDate && new Date(c.endDate) < now).length,
          used: payload.reduce((sum, c) => sum + (c.usedCount || 0), 0),
        };
        setStats(stats);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load coupons. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
  }, [search, statusFilter, typeFilter]);

  const resetForm = () => {
    setEditingId("");
    setForm({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      startDate: "",
      endDate: "",
      isActive: true,
      usageLimit: "",
      usedCount: 0,
    });
    setShowForm(false);
  };

  const startEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue ?? "",
      minOrderAmount: coupon.minOrderAmount ?? "",
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : "",
      isActive: Boolean(coupon.isActive),
      usageLimit: coupon.usageLimit ?? "",
      usedCount: coupon.usedCount || 0,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previousForm) => ({
      ...previousForm,
      [name]: type === "checkbox" ? checked : value.toUpperCase?.() || value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      discountValue: form.discountValue ? Number(form.discountValue) : 0,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
    };

    try {
      setError("");
      setSuccess("");

      if (editingId) {
        const response = await api.put(`/api/coupons/${editingId}`, payload);
        const updated = response.data;

        setCoupons((previousCoupons) =>
          previousCoupons.map((coupon) =>
            coupon._id === updated._id ? updated : coupon
          )
        );
        setSuccess("Coupon updated successfully!");
      } else {
        const response = await api.post("/api/coupons", payload);
        const created = response.data;
        setCoupons((previousCoupons) => [created, ...previousCoupons]);
        setSuccess("Coupon created successfully!");
      }

      resetForm();
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to save coupon. Please check the form and try again.";
      setError(message);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.patch(`/api/coupons/${coupon._id}/active`, {
        isActive: !coupon.isActive,
      });
      const updated = response.data;

      setCoupons((previousCoupons) =>
        previousCoupons.map((item) =>
          item._id === updated._id ? updated : item
        )
      );
      setSuccess(`Coupon ${updated.isActive ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update coupon status. Please try again.";
      setError(message);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      setError("");
      setSuccess("");
      await api.delete(`/api/coupons/${couponId}`);
      
      setCoupons((prev) => prev.filter((c) => c._id !== couponId));
      setSuccess("Coupon deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete coupon. Please try again.";
      setError(message);
    }
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const getCouponStatus = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) return { label: "Inactive", color: "bg-surface-secondary text-muted" };
    if (coupon.endDate && new Date(coupon.endDate) < now) return { label: "Expired", color: "bg-error/20 text-error" };
    if (coupon.startDate && new Date(coupon.startDate) > now) return { label: "Scheduled", color: "bg-warning/20 text-warning" };
    return { label: "Active", color: "bg-success/20 text-success" };
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
              <span className="text-3xl">🏷️</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Coupon Management
              </h1>
            </div>
            <p className="text-muted">
              Create and manage discount codes for your promotions
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
            <p className="text-xs text-muted">Total Coupons</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-error">{stats.expired}</p>
            <p className="text-xs text-muted">Expired</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.used}</p>
            <p className="text-xs text-muted">Total Uses</p>
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
            <span>Create New Coupon</span>
          </button>
        )}

        {/* Coupon Form */}
        {showForm && (
          <div className="mb-8 card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <span>{editingId ? '✏️' : '➕'}</span>
                {editingId ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button
                onClick={resetForm}
                className="text-muted hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Code */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    placeholder="SUMMER20"
                    className="input w-full"
                  />
                  <p className="text-xs text-muted">Will be stored in uppercase</p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Summer sale 20% off"
                    className="input w-full"
                  />
                </div>

                {/* Discount Type */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Discount Type *
                  </label>
                  <select
                    name="discountType"
                    value={form.discountType}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                {/* Discount Value */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    value={form.discountValue}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="input w-full"
                  />
                </div>

                {/* Min Order Amount */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Minimum Order Amount
                  </label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="input w-full"
                    placeholder="0 = no minimum"
                  />
                </div>

                {/* Max Discount Amount */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Maximum Discount Amount
                  </label>
                  <input
                    type="number"
                    name="maxDiscountAmount"
                    value={form.maxDiscountAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="input w-full"
                    placeholder="For percentage discounts"
                  />
                </div>

                {/* Usage Limit */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={form.usageLimit}
                    onChange={handleChange}
                    min="0"
                    className="input w-full"
                    placeholder="Unlimited if empty"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </div>
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
                  Active (available for use)
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary px-6 py-2">
                  {editingId ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button type="button" onClick={resetForm} className="btn-outline px-6 py-2">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by code or description..."
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input px-4 py-2 sm:w-40"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input px-4 py-2 sm:w-40"
          >
            <option value="">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        {/* Coupons Table */}
        {coupons.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏷️</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Coupons Found</h3>
            <p className="text-muted mb-6">
              {search || statusFilter || typeFilter
                ? "No coupons match your filters"
                : "Create your first coupon to start promoting"}
            </p>
            {(search || statusFilter || typeFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setTypeFilter("");
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Min Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Validity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {coupons.map((coupon, index) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr
                        key={coupon._id}
                        className="hover:bg-surface-secondary transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-accent-primary">
                            {coupon.code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary">
                          {coupon.description || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full bg-accent-soft text-accent-primary text-xs">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}%`
                              : `₹${coupon.discountValue}`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-secondary">
                          {coupon.minOrderAmount ? `₹${coupon.minOrderAmount}` : 'No min'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-primary">{coupon.usedCount || 0}</span>
                            {coupon.usageLimit && (
                              <>
                                <span className="text-muted">/</span>
                                <span className="text-muted">{coupon.usageLimit}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {coupon.startDate || coupon.endDate ? (
                            <>
                              <div>{formatDate(coupon.startDate)}</div>
                              <div className="text-muted">to {formatDate(coupon.endDate)}</div>
                            </>
                          ) : (
                            <span className="text-muted">No expiry</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(coupon)}
                              className="btn-outline text-xs px-3 py-1.5"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(coupon)}
                              className={`btn-outline text-xs px-3 py-1.5 ${
                                coupon.isActive
                                  ? 'border-warning text-warning hover:bg-warning/10'
                                  : 'border-success text-success hover:bg-success/10'
                              }`}
                            >
                              {coupon.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDelete(coupon._id)}
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
                  Showing {coupons.length} coupons
                </span>
                <span className="text-muted">
                  Total value: {coupons.reduce((sum, c) => sum + (c.discountValue || 0), 0)} points
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminCoupons;