import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

function MyOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTimeline, setActiveTimeline] = useState(0);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setError("");
        setIsLoading(true);

        const response = await api.get(`/api/orders/${id}`);
        setOrder(response.data || null);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load order details. Please try again.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

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

  // Mock timeline data - in real app, this would come from API
  const getOrderTimeline = () => {
    const timeline = [
      {
        status: "Order Placed",
        date: order?.createdAt,
        completed: true,
        icon: "📝",
      },
      {
        status: "Payment Confirmed",
        date: order?.paidAt,
        completed: order?.isPaid,
        icon: "💳",
      },
      {
        status: "Processing",
        date: order?.processingAt,
        completed: order?.status === "processing" || order?.status === "shipped" || order?.status === "delivered",
        icon: "⚙️",
      },
      {
        status: "Shipped",
        date: order?.shippedAt,
        completed: order?.status === "shipped" || order?.status === "delivered",
        icon: "🚚",
      },
      {
        status: "Delivered",
        date: order?.deliveredAt,
        completed: order?.isDelivered,
        icon: "✅",
      },
    ];
    return timeline;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2 space-y-4">
                <div className="h-48 bg-surface-secondary rounded-2xl" />
                <div className="h-32 bg-surface-secondary rounded-2xl" />
              </div>
              <div className="space-y-4">
                <div className="h-40 bg-surface-secondary rounded-2xl" />
                <div className="h-32 bg-surface-secondary rounded-2xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gradient mb-2">Order Not Found</h1>
            <p className="text-muted mb-6">{error || "The order you're looking for doesn't exist."}</p>
            <Link to="/my-orders" className="btn-primary inline-flex items-center gap-2">
              <span>←</span> Back to My Orders
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const timeline = getOrderTimeline();
  const statusColor = getStatusColor(order.status);
  const statusIcon = getStatusIcon(order.status);

  return (
    <div className="min-h-screen bg-page">
      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Navigation */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/my-orders"
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary transition-colors mb-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              Back to My Orders
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gradient">
              Order #{order._id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-muted mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
          
          {/* Order Status Badge */}
          <div className={`px-4 py-2 rounded-full border ${statusColor} flex items-center gap-2 self-start`}>
            <span className="text-lg">{statusIcon}</span>
            <span className="text-sm font-medium capitalize">{order.status}</span>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="mb-8 card p-6">
          <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
            <span>⏱️</span> Order Timeline
          </h2>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-subtle" />
            
            {/* Timeline Items */}
            <div className="space-y-6 relative">
              {timeline.map((item, index) => (
                <div
                  key={item.status}
                  className={`flex items-start gap-4 ${
                    item.completed ? 'opacity-100' : 'opacity-50'
                  }`}
                  onMouseEnter={() => setActiveTimeline(index)}
                  onMouseLeave={() => setActiveTimeline(0)}
                >
                  <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                    item.completed
                      ? 'bg-accent-primary text-white'
                      : 'bg-surface-secondary text-muted'
                  } transition-transform duration-300 ${
                    activeTimeline === index ? 'scale-110' : ''
                  }`}>
                    <span>{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      item.completed ? 'text-primary' : 'text-muted'
                    }`}>
                      {item.status}
                    </p>
                    {item.date && (
                      <p className="text-xs text-muted">{formatDate(item.date)}</p>
                    )}
                    {!item.completed && index === timeline.length - 1 && (
                      <p className="text-xs text-accent-primary mt-1 animate-pulse">
                        Estimated delivery in 2-3 days
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Items and Shipping */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Section */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>📦</span> Order Items
              </h2>
              <div className="space-y-4">
                {Array.isArray(order.orderItems) &&
                  order.orderItems.map((item, index) => (
                    <div
                      key={`${order._id}-${item.product}`}
                      className="flex gap-4 p-4 rounded-xl border border-border-subtle bg-surface-secondary hover-lift transition-all"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {item.image && (
                        <Link to={`/products/${item.product}`} className="flex-none">
                          <div className="h-20 w-20 overflow-hidden rounded-lg border border-border-subtle bg-surface-tertiary group">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          </div>
                        </Link>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link
                            to={`/products/${item.product}`}
                            className="text-sm font-medium text-primary hover:text-accent-primary transition-colors line-clamp-2"
                          >
                            {item.name}
                          </Link>
                          <p className="text-xs text-muted mt-1">
                            Quantity: {item.qty} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-accent-primary mt-2">
                          {formatCurrency(item.price * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>📍</span> Shipping Address
              </h2>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-primary">{order.shippingAddress?.fullName}</p>
                <p className="text-secondary">{order.shippingAddress?.address}</p>
                <p className="text-secondary">
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
                </p>
                <p className="text-secondary">{order.shippingAddress?.country}</p>
                <p className="text-muted mt-2">📞 {order.shippingAddress?.phone}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary and Status */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>💰</span> Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="text-primary">{formatCurrency(order.itemsPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span className="text-primary">
                    {order.shippingPrice === 0 ? 'Free' : formatCurrency(order.shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Tax</span>
                  <span className="text-primary">{formatCurrency(order.taxPrice)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="border-t border-border-subtle pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-primary">Total</span>
                    <span className="text-xl font-bold text-accent-primary">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>💳</span> Payment Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Payment Method</span>
                  <span className="text-sm text-primary">Credit Card</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Payment Status</span>
                  <span className={`text-sm font-medium ${
                    order.isPaid ? 'text-success' : 'text-warning'
                  }`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">Paid At</span>
                    <span className="text-sm text-primary">{formatDate(order.paidAt)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Transaction ID</span>
                  <span className="text-sm text-primary font-mono">
                    {order.paymentId || 'TXN' + Math.random().toString(36).substring(7).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6 border-accent-primary/20 bg-accent-soft">
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span>❓</span> Need Help?
              </h2>
              <p className="text-sm text-muted mb-4">
                Having issues with your order? Our support team is here to help.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  className="w-full btn-outline text-sm py-2"
                  onClick={() =>
                    navigate(`/help?orderId=${encodeURIComponent(order._id)}`)
                  }
                >
                  Contact Support
                </button>
                <button
                  type="button"
                  className="w-full btn-outline text-sm py-2"
                  onClick={() =>
                    navigate(`/track-order?orderId=${encodeURIComponent(order._id)}`)
                  }
                >
                  Track Package
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="mt-8 flex flex-wrap gap-3 justify-end">
          {order.status === 'delivered' && (
            <button className="btn-primary px-6 py-2.5 text-sm">
              Write a Review
            </button>
          )}
          {order.status === 'pending' && (
            <button className="btn-outline border-error text-error hover:bg-error/10 px-6 py-2.5 text-sm">
              Cancel Order
            </button>
          )}
          <button className="btn-outline px-6 py-2.5 text-sm">
            Download Invoice
          </button>
          <button 
            onClick={() => window.print()}
            className="btn-outline px-6 py-2.5 text-sm"
          >
            Print Details
          </button>
        </div>
      </main>
    </div>
  );
}

export default MyOrderDetail;
