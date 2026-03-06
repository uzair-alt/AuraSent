import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";

function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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
          "Failed to load order details";
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

  const formatDateTime = (value) =>
    value
      ? new Date(value).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      const response = await api.patch(`/api/orders/${id}/status`, {
        status: newStatus,
      });

      setOrder(response.data);
      setSuccess(`Order status updated to ${newStatus}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update order status";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      const response = await api.patch(`/api/orders/${id}/paid`);

      setOrder(response.data);
      setSuccess("Order marked as paid");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to mark order as paid";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsDelivered = async () => {
    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      const response = await api.patch(`/api/orders/${id}/delivered`);

      setOrder(response.data);
      setSuccess("Order marked as delivered");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to mark order as delivered";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-warning/20 text-warning border-warning/30",
      processing: "bg-accent-primary/20 text-accent-primary border-accent-primary/30",
      shipped: "bg-info/20 text-info border-info/30",
      delivered: "bg-success/20 text-success border-success/30",
      cancelled: "bg-error/20 text-error border-error/30",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-surface-secondary rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gradient mb-2">Order Not Found</h1>
            <p className="text-muted mb-6">{error || "The order you're looking for doesn't exist."}</p>
            <Link to="/admin/orders" className="btn-primary inline-flex items-center gap-2">
              <span>←</span> Back to Orders
            </Link>
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
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex items-center gap-1`}>
                <span>{getStatusIcon(order.status)}</span>
                <span className="capitalize">{order.status}</span>
              </span>
              <span className="text-sm text-muted">
                Placed on {formatDateTime(order.createdAt)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/orders")}
              className="btn-outline inline-flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to Orders</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-outline inline-flex items-center gap-2 group print:hidden"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Print Invoice</span>
            </button>
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

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3 print:hidden">
          {order.status !== "cancelled" && (
            <>
              <select
                onChange={(e) => handleUpdateStatus(e.target.value)}
                value={order.status}
                disabled={isUpdating}
                className="input px-4 py-2 text-sm"
              >
                <option value="pending">⏳ Pending</option>
                <option value="processing">⚙️ Processing</option>
                <option value="shipped">🚚 Shipped</option>
                <option value="delivered">✅ Delivered</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              
              {!order.isPaid && (
                <button
                  onClick={handleMarkAsPaid}
                  disabled={isUpdating}
                  className="btn-success px-4 py-2 text-sm"
                >
                  Mark as Paid
                </button>
              )}
              
              {order.isPaid && !order.isDelivered && (
                <button
                  onClick={handleMarkAsDelivered}
                  disabled={isUpdating}
                  className="btn-success px-4 py-2 text-sm"
                >
                  Mark as Delivered
                </button>
              )}
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6 bg-surface-primary rounded-2xl border border-border-subtle p-6 print:bg-white print:border-0">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Order Summary */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span>📊</span> Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Order ID</span>
                  <span className="text-primary font-mono">{order._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span className={`capitalize ${getStatusColor(order.status)} px-2 py-0.5 rounded-full text-xs`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Created</span>
                  <span className="text-primary">{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Payment</span>
                  <span className="text-primary">{order.paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span>👤</span> Customer
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-primary font-medium">{order.user?.name || "Guest"}</p>
                <p className="text-muted">{order.user?.email || "No email"}</p>
                {order.user?.phone && (
                  <p className="text-muted">📞 {order.user.phone}</p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span>📍</span> Shipping Address
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-primary font-medium">{order.shippingAddress.fullName}</p>
                <p className="text-muted">{order.shippingAddress.address}</p>
                <p className="text-muted">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p className="text-muted">{order.shippingAddress.country}</p>
                <p className="text-muted">📞 {order.shippingAddress.phone}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <span>📦</span> Order Items
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {order.orderItems.map((item, index) => (
                    <tr key={`${item.product}-${index}`} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border-subtle"
                            />
                          )}
                          <div>
                            <p className="font-medium text-primary">{item.name}</p>
                            <p className="text-xs text-muted">SKU: {item.sku || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-primary">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-primary">
                        {item.qty}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-accent-primary">
                        {formatCurrency(item.qty * item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
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
                <div className="border-t border-border-subtle pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-primary">Total</span>
                    <span className="text-xl font-bold text-accent-primary">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Timeline */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Payment Details */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span>💳</span> Payment Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Method</span>
                  <span className="text-primary">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    order.isPaid ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-muted">Paid At</span>
                    <span className="text-primary">{formatDateTime(order.paidAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Transaction ID</span>
                  <span className="text-primary font-mono text-xs">
                    {order.paymentId || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <span>⏱️</span> Timeline
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${order.createdAt ? 'bg-success' : 'bg-muted'}`} />
                  <span className="text-sm text-primary flex-1">Order Placed</span>
                  <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${order.isPaid ? 'bg-success' : 'bg-muted'}`} />
                  <span className="text-sm text-primary flex-1">Payment Confirmed</span>
                  <span className="text-xs text-muted">
                    {order.isPaid ? formatDateTime(order.paidAt) : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${order.isDelivered ? 'bg-success' : 'bg-muted'}`} />
                  <span className="text-sm text-primary flex-1">Delivered</span>
                  <span className="text-xs text-muted">
                    {order.isDelivered ? formatDateTime(order.deliveredAt) : 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
              <span>📝</span> Order Notes
            </h3>
            <textarea
              placeholder="Add internal notes about this order..."
              className="input w-full h-24 text-sm"
              defaultValue={order.notes || ''}
            />
            <div className="mt-3 flex justify-end">
              <button className="btn-primary text-sm px-4 py-2">
                Save Notes
              </button>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="mt-8 text-center text-xs text-muted print:block hidden">
          <p>Invoice generated from AuraScents Admin Panel on {new Date().toLocaleString()}</p>
          <p className="mt-1">This is a computer generated invoice - no signature required.</p>
        </div>
      </main>
    </div>
  );
}

export default AdminOrderDetail;