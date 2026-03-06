import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";

function MyOrders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  useEffect(() => {
    if (searchParams.get("placed") === "1") {
      setFeedback("Order placed successfully! 🎉");
      setTimeout(() => setFeedback(""), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError("");
        setIsLoading(true);

        const response = await api.get("/api/orders/my");
        const ordersData = Array.isArray(response.data) ? response.data : [];
        setOrders(ordersData);

        // Calculate stats
        const stats = {
          total: ordersData.length,
          pending: ordersData.filter(o => o.status === "pending").length,
          processing: ordersData.filter(o => o.status === "processing").length,
          shipped: ordersData.filter(o => o.status === "shipped").length,
          delivered: ordersData.filter(o => o.status === "delivered").length,
          cancelled: ordersData.filter(o => o.status === "cancelled").length,
        };
        setStats(stats);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load orders. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: "bg-warning/20 text-warning border-warning/30",
      processing: "bg-accent-primary/20 text-accent-primary border-accent-primary/30",
      shipped: "bg-info/20 text-info border-info/30",
      delivered: "bg-success/20 text-success border-success/30",
      cancelled: "bg-error/20 text-error border-error/30",
    };
    return statusMap[status?.toLowerCase()] || "bg-surface-secondary text-muted border-border-subtle";
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      pending: "⏳",
      processing: "⚙️",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    };
    return iconMap[status?.toLowerCase()] || "📦";
  };

  const canCancel = (order) =>
    order.status === "pending" || order.status === "processing";

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      setIsUpdating(true);
      setError("");

      const response = await api.put(`/api/orders/${orderId}/cancel`);

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId ? response.data : order
        )
      );
      setFeedback("Order cancelled successfully.");
      setTimeout(() => setFeedback(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to cancel order. Please try again.";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== "all" && order.status !== filterStatus) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order._id.toLowerCase().includes(searchLower) ||
        order.orderItems?.some(item => 
          item.name?.toLowerCase().includes(searchLower)
        )
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-20 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-surface-secondary rounded-2xl" />
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
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
              My Orders
            </h1>
            <p className="text-muted">
              Track and manage your fragrance orders
            </p>
          </div>
          <Link
            to="/products"
            className="btn-primary inline-flex items-center gap-2 group"
          >
            <span>Continue Shopping</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          <div className="card p-3 text-center hover-lift">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total</p>
          </div>
          <div className="card p-3 text-center hover-lift border-warning/30">
            <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted">Pending</p>
          </div>
          <div className="card p-3 text-center hover-lift border-accent-primary/30">
            <p className="text-2xl font-bold text-accent-primary">{stats.processing}</p>
            <p className="text-xs text-muted">Processing</p>
          </div>
          <div className="card p-3 text-center hover-lift border-info/30">
            <p className="text-2xl font-bold text-info">{stats.shipped}</p>
            <p className="text-xs text-muted">Shipped</p>
          </div>
          <div className="card p-3 text-center hover-lift border-success/30">
            <p className="text-2xl font-bold text-success">{stats.delivered}</p>
            <p className="text-xs text-muted">Delivered</p>
          </div>
          <div className="card p-3 text-center hover-lift border-error/30">
            <p className="text-2xl font-bold text-error">{stats.cancelled}</p>
            <p className="text-xs text-muted">Cancelled</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by order ID or product name..."
                className="input w-full pl-10 pr-4 py-2"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input px-4 py-2 sm:w-48"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
        
        {feedback && (
          <div className="mb-6 rounded-xl border border-success/20 bg-success/10 p-4 animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="text-success text-lg">✓</span>
              <p className="text-sm text-success">{feedback}</p>
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No orders found</h3>
            <p className="text-muted mb-6">
              {orders.length === 0 
                ? "You haven't placed any orders yet." 
                : "No orders match your filters."}
            </p>
            {orders.length === 0 ? (
              <Link to="/products" className="btn-primary">
                Start Shopping
              </Link>
            ) : (
              <button
                onClick={() => { setFilterStatus("all"); setSearchTerm(""); }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => (
              <div
                key={order._id}
                className="card p-6 hover-lift hover-glow animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-primary">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex items-center gap-1`}>
                        <span>{getStatusIcon(order.status)}</span>
                        <span className="capitalize">{order.status}</span>
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted">Total:</span>
                    <span className="text-xl font-bold text-accent-primary">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Order Items Grid */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                    <span>📦</span> Items ({order.orderItems?.length || 0})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(order.orderItems) &&
                      order.orderItems.map((item) => (
                        <div
                          key={`${order._id}-${item.product}`}
                          className="flex gap-3 p-3 rounded-xl border border-border-subtle bg-surface-secondary group"
                        >
                          {item.image && (
                            <Link to={`/products/${item.product}`} className="flex-none">
                              <div className="h-16 w-16 overflow-hidden rounded-lg border border-border-subtle bg-surface-tertiary">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                              </div>
                            </Link>
                          )}
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${item.product}`}
                              className="text-xs font-medium text-primary hover:text-accent-primary transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted">
                                Qty {item.qty}
                              </span>
                              <span className="text-xs font-semibold text-accent-primary">
                                {formatCurrency(item.price * item.qty)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Order Footer */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-subtle">
                  <div className="text-xs text-muted">
                    <span className="block">Shipping to: {order.shippingAddress?.fullName}</span>
                    <span className="block text-[10px]">
                      {order.shippingAddress?.city}, {order.shippingAddress?.country}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Payment Status */}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.isPaid 
                        ? 'bg-success/10 text-success border border-success/20' 
                        : 'bg-warning/10 text-warning border border-warning/20'
                    }`}>
                      {order.isPaid ? '✓ Paid' : '⏳ Pending'}
                    </span>
                    
                    {/* Delivery Status */}
                    {order.isDelivered && (
                      <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success border border-success/20">
                        ✓ Delivered
                      </span>
                    )}

                    {/* Action Buttons */}
                    <Link
                      to={`/my-orders/${order._id}`}
                      className="btn-outline text-xs px-4 py-2 group"
                    >
                      <span>View Details</span>
                      <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                    
                    {!order.isDelivered && canCancel(order) && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleCancel(order._id)}
                        className="btn-outline text-xs px-4 py-2 border-error text-error hover:bg-error/10 disabled:opacity-40"
                      >
                        Cancel Order
                      </button>
                    )}
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

export default MyOrders;
