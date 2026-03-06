import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";

function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null,
    mostPurchasedCategory: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        setIsLoading(true);

        const [userResponse, ordersResponse] = await Promise.all([
          api.get(`/api/users/${id}`),
          api.get(`/api/orders/user/${id}`),
        ]);

        const userData = userResponse.data || null;
        const ordersData = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];

        setUser(userData);
        setOrders(ordersData);

        // Calculate stats
        const totalSpent = ordersData.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const lastOrder = ordersData.length > 0 
          ? ordersData.reduce((latest, order) => 
              new Date(order.createdAt) > new Date(latest.createdAt) ? order : latest
            ) 
          : null;

        // Mock category stats - in real app, this would come from API
        const categoryCounts = {};
        ordersData.forEach(order => {
          order.orderItems?.forEach(item => {
            if (item.category) {
              categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
            }
          });
        });
        const mostPurchasedCategory = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        setStats({
          totalOrders: ordersData.length,
          totalSpent,
          averageOrderValue: ordersData.length > 0 ? totalSpent / ordersData.length : 0,
          lastOrderDate: lastOrder?.createdAt || null,
          mostPurchasedCategory,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load user details";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleToggleStatus = async () => {
    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      const response = await api.patch(`/api/users/${id}/status`, {
        isActive: !user.isActive,
      });

      setUser(prev => ({ ...prev, ...response.data }));
      setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update user status. Please try again.";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMakeAdmin = async () => {
    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      const response = await api.patch(`/api/users/${id}/role`, {
        isAdmin: !user.isAdmin,
      });

      setUser(prev => ({ ...prev, ...response.data }));
      setSuccess(`User role updated successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update user role. Please try again.";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="h-64 bg-surface-secondary rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="text-6xl mb-4">😔</div>
            <h1 className="text-2xl font-bold text-gradient mb-2">User Not Found</h1>
            <p className="text-muted mb-6">{error || "The user you're looking for doesn't exist."}</p>
            <Link to="/admin/users" className="btn-primary inline-flex items-center gap-2">
              <span>←</span> Back to Users
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
              <span className="text-3xl">👤</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                User Profile
              </h1>
            </div>
            <p className="text-muted">
              Detailed view of customer information and activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/users")}
              className="btn-outline inline-flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to Users</span>
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

        {/* User Header Card */}
        <div className="mb-8 card p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-accent-soft flex items-center justify-center text-4xl">
                {user.name?.charAt(0).toUpperCase() || "👤"}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary">{user.name}</h2>
                <p className="text-muted">{user.email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isActive 
                      ? 'bg-success/20 text-success' 
                      : 'bg-error/20 text-error'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.isAdmin 
                      ? 'bg-accent-primary/20 text-accent-primary' 
                      : 'bg-surface-secondary text-muted'
                  }`}>
                    {user.isAdmin ? 'Administrator' : 'Customer'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`btn-outline px-4 py-2 text-sm ${
                  user.isActive 
                    ? 'border-warning text-warning hover:bg-warning/10' 
                    : 'border-success text-success hover:bg-success/10'
                }`}
              >
                {user.isActive ? 'Deactivate User' : 'Activate User'}
              </button>
              <button
                onClick={handleMakeAdmin}
                disabled={isUpdating}
                className={`btn-outline px-4 py-2 text-sm ${
                  user.isAdmin 
                    ? 'border-warning text-warning hover:bg-warning/10' 
                    : 'border-success text-success hover:bg-success/10'
                }`}
              >
                {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
            <p className="text-xs text-muted">Total Orders</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-accent-primary">{formatCurrency(stats.totalSpent)}</p>
            <p className="text-xs text-muted">Total Spent</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.averageOrderValue)}</p>
            <p className="text-xs text-muted">Avg Order Value</p>
          </div>
          <div className="card p-4">
            <p className="text-sm font-bold text-primary truncate">
              {stats.lastOrderDate ? formatDate(stats.lastOrderDate) : 'No orders'}
            </p>
            <p className="text-xs text-muted">Last Order</p>
          </div>
          <div className="card p-4">
            <p className="text-lg font-bold text-primary truncate">{stats.mostPurchasedCategory}</p>
            <p className="text-xs text-muted">Top Category</p>
          </div>
        </div>

        {/* User Details Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Profile Details */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <span>📋</span> Profile Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted">User ID</span>
                <span className="text-primary font-mono text-sm">{user._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Full Name</span>
                <span className="text-primary">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Email</span>
                <span className="text-primary">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phone</span>
                <span className="text-primary">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Joined</span>
                <span className="text-primary">{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <span>🔐</span> Account Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.isActive ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Role</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  user.isAdmin ? 'bg-accent-primary/20 text-accent-primary' : 'bg-surface-secondary text-muted'
                }`}>
                  {user.isAdmin ? 'Administrator' : 'Customer'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Email Verified</span>
                <span className="text-success">✓ Yes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Last Login</span>
                <span className="text-primary">{formatDate(user.lastLogin)}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <span>⏱️</span> Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-sm text-primary">Last order placed</span>
                <span className="text-xs text-muted ml-auto">
                  {stats.lastOrderDate ? formatDate(stats.lastOrderDate) : 'Never'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-info" />
                <span className="text-sm text-primary">Account created</span>
                <span className="text-xs text-muted ml-auto">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span className="text-sm text-primary">Profile updated</span>
                <span className="text-xs text-muted ml-auto">
                  {formatDate(user.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order History */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
              <span>📦</span> Order History
            </h3>
            <span className="text-sm text-muted">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🛍️</div>
              <p className="text-muted">This user hasn't placed any orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Items
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
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/orders/${order._id}`}
                          className="font-mono font-medium text-accent-primary hover:text-accent-secondary transition-colors"
                        >
                          #{order._id.slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-secondary whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-primary">{order.orderItems?.length || 0} items</span>
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
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                          <span className="mr-1">{getStatusIcon(order.status)}</span>
                          {order.status}
                        </span>
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
          )}
        </section>

        {/* Danger Zone */}
        <div className="mt-8 p-6 card border-error/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl text-error">⚠️</span>
              <div>
                <h3 className="text-lg font-semibold text-error mb-1">Danger Zone</h3>
                <p className="text-sm text-muted">
                  Permanently delete this user account and all associated data
                </p>
              </div>
            </div>
            <button className="btn-outline border-error text-error hover:bg-error/10 px-6 py-2">
              Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminUserDetail;