import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    totalRevenue: 0,
    pending: 0,
    delivered: 0,
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError("");
        setIsLoading(true);
        const params = { 
          page, 
          pageSize: 20,
          q: searchTerm || undefined,
          status: statusFilter || undefined,
          paid: paymentFilter === "paid" ? true : paymentFilter === "unpaid" ? false : undefined,
        };

        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;

        const response = await api.get("/api/orders", { params });
        const payload = Array.isArray(response.data)
          ? {
              orders: response.data,
              page: 1,
              totalPages: 1,
            }
          : response.data;

        const ordersData = payload.orders || [];
        setOrders(ordersData);
        setPage(payload.page || 1);
        setTotalPages(payload.totalPages || 1);

        // Calculate stats
        const totalRevenue = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        setStats({
          total: ordersData.length,
          totalRevenue,
          pending: ordersData.filter(o => o.status === "pending").length,
          delivered: ordersData.filter(o => o.status === "delivered").length,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message || "Failed to load orders";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, fromDate, toDate, searchTerm, statusFilter, paymentFilter]);

  const handleStatusChange = async (orderId, status) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.put(`/api/orders/${orderId}/status`, {
        status,
      });

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId ? { ...order, ...response.data } : order
        )
      );
      setSuccess(`Order #${orderId.slice(-6)} status updated to ${status}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update order status. Please try again.";
      setError(message);
    }
  };

  const handleToggleSelect = (orderId) => {
    setSelectedOrderIds((previousSelected) =>
      previousSelected.includes(orderId)
        ? previousSelected.filter((id) => id !== orderId)
        : [...previousSelected, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((order) => order._id));
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrderIds.length === 0) return;

    try {
      setError("");
      setSuccess("");
      setIsBulkUpdating(true);

      const response = await api.put("/api/orders/bulk/status", {
        orderIds: selectedOrderIds,
        status: bulkStatus,
      });

      const updatedOrders = response.data?.orders || [];

      setOrders((previousOrders) =>
        previousOrders.map((order) => {
          const updated = updatedOrders.find(
            (updatedOrder) => updatedOrder._id === order._id
          );
          return updated ? { ...order, ...updated } : order;
        })
      );

      setSuccess(`Updated ${selectedOrderIds.length} orders to ${bulkStatus}`);
      setSelectedOrderIds([]);
      setBulkStatus("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update selected orders. Please try again.";
      setError(message);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-warning/20 text-warning",
      processing: "bg-accent-primary/20 text-accent-primary",
      shipped: "bg-info/20 text-info",
      delivered: "bg-success/20 text-success",
      cancelled: "bg-error/20 text-error",
    };
    return colors[status?.toLowerCase()] || "bg-surface-secondary text-muted";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      processing: "⚙️",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    };
    return icons[status?.toLowerCase()] || "📦";
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
              <span className="text-3xl">📋</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Order Management
              </h1>
            </div>
            <p className="text-muted">
              Manage and track all customer orders
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
            <p className="text-xs text-muted">Total Orders</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-accent-primary">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-xs text-muted">Total Revenue</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted">Pending</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.delivered}</p>
            <p className="text-xs text-muted">Delivered</p>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order ID or customer name..."
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
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input px-3 py-2 text-sm w-36"
                placeholder="From"
              />
              <span className="text-muted">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input px-3 py-2 text-sm w-36"
                placeholder="To"
              />
              {(fromDate || toDate) && (
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="btn-outline text-sm px-3 py-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedOrderIds.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent-soft border border-accent-primary/20 animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary font-medium">
                  {selectedOrderIds.length} order(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="input px-3 py-2 text-sm"
                  disabled={isBulkUpdating}
                >
                  <option value="">Change status to...</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkStatusUpdate}
                  disabled={!bulkStatus || isBulkUpdating}
                  className="btn-primary px-4 py-2 text-sm whitespace-nowrap"
                >
                  {isBulkUpdating ? 'Updating...' : 'Update Selected'}
                </button>
                <button
                  onClick={() => setSelectedOrderIds([])}
                  className="btn-outline px-4 py-2 text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Orders Found</h3>
            <p className="text-muted mb-6">
              {searchTerm || statusFilter || paymentFilter || fromDate || toDate
                ? "No orders match your filters"
                : "No orders have been placed yet"}
            </p>
            {(searchTerm || statusFilter || paymentFilter || fromDate || toDate) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("");
                  setPaymentFilter("");
                  setFromDate("");
                  setToDate("");
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
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
                          checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                          onChange={handleToggleSelectAll}
                          className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted uppercase tracking-wider">
                        Payment
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
                    {orders.map((order, index) => (
                      <tr
                        key={order._id}
                        className="hover:bg-surface-secondary transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.includes(order._id)}
                            onChange={() => handleToggleSelect(order._id)}
                            className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="font-mono font-medium text-accent-primary hover:text-accent-secondary transition-colors"
                          >
                            #{order._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-primary">{order.user?.name || "Guest"}</p>
                            <p className="text-xs text-muted">{order.user?.email || "No email"}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-secondary whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-accent-primary">
                          {formatCurrency(order.totalPrice)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            order.isPaid
                              ? 'bg-success/20 text-success'
                              : 'bg-warning/20 text-warning'
                          }`}>
                            {order.isPaid ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status || "pending"}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={`input text-xs px-2 py-1 ${getStatusColor(order.status)}`}
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {getStatusIcon(status)} {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <span>→</span>
                          </Link>
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
                    Showing {orders.length} orders • Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Row */}
            <div className="flex justify-end">
              <div className="card p-4 inline-flex items-center gap-6">
                <div>
                  <span className="text-xs text-muted">Displayed Total</span>
                  <p className="text-lg font-bold text-accent-primary">
                    {formatCurrency(orders.reduce((sum, o) => sum + o.totalPrice, 0))}
                  </p>
                </div>
                <div className="w-px h-8 bg-border-subtle" />
                <div>
                  <span className="text-xs text-muted">Selected Total</span>
                  <p className="text-lg font-bold text-accent-primary">
                    {formatCurrency(
                      orders
                        .filter(o => selectedOrderIds.includes(o._id))
                        .reduce((sum, o) => sum + o.totalPrice, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminOrders;