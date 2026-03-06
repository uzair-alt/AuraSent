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

function SummaryCard({ label, value, icon, trend, trendValue, color = "accent" }) {
  return (
    <div className="card p-5 hover-lift hover-glow group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className="text-2xl font-bold text-primary">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs ${trend === 'up' ? 'text-success' : 'text-error'}`}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
              <span className="text-xs text-muted">vs last month</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-full bg-${color}-soft flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [salesByDate, setSalesByDate] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState({ threshold: 0, products: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isSalesLoading, setIsSalesLoading] = useState(false);
  const [error, setError] = useState("");
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState("7days");
  const [categoryDistribution, setCategoryDistribution] = useState([]);
  const [acquisition, setAcquisition] = useState(null);
  const [revenueStats, setRevenueStats] = useState(null);
  const [abandonedStats, setAbandonedStats] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);

  const loadSales = async (params) => {
    try {
      setIsSalesLoading(true);
      const response = await api.get("/api/orders/stats/sales-by-date", {
        params,
      });
      setSalesByDate(response.data.daily || []);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to load sales timeline";
      setError(message);
    } finally {
      setIsSalesLoading(false);
    }
  };

  const loadRevenue = async (params) => {
    try {
      const response = await api.get("/api/orders/stats/revenue", {
        params,
      });
      setRevenueStats(response.data || null);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message || "Failed to load revenue analytics";
      setError(message);
    }
  };

  const loadAcquisition = async (params) => {
    try {
      const response = await api.get("/api/orders/stats/customer-acquisition", {
        params,
      });
      setAcquisition(response.data || null);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message || "Failed to load acquisition analytics";
      setError(message);
    }
  };

  useEffect(() => {
    const session = getSession();

    if (!session || !session.user?.isAdmin) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setError("");
        setIsLoading(true);

        const [
          summaryRes,
          topProductsRes,
          lowStockRes,
          ordersRes,
          abandonedRes,
          inventorySummaryRes,
          categoryDistributionRes,
        ] =
          await Promise.all([
            api.get("/api/orders/stats/summary"),
            api.get("/api/orders/stats/top-products", {
              params: { limit: 5 },
            }),
            api.get("/api/products/stats/low-stock", {
              params: { threshold: 5 },
            }),
            api.get("/api/orders", {
              params: { limit: 5 },
            }),
            api.get("/api/orders/stats/abandoned-carts", {
              params: { olderThanHours: 24 },
            }),
            api.get("/api/products/stats/inventory-summary", {
              params: { threshold: 5 },
            }),
            api.get("/api/products/stats/category-distribution"),
          ]);

        setSummary(summaryRes.data);
        setTopProducts(topProductsRes.data || []);
        setLowStock(lowStockRes.data);
        setRecentOrders(ordersRes.data || []);
        setAbandonedStats(abandonedRes.data || null);
        setInventorySummary(inventorySummaryRes.data || null);
        const rawCategories =
          categoryDistributionRes.data && Array.isArray(categoryDistributionRes.data.categories)
            ? categoryDistributionRes.data.categories
            : [];
        const colorMap = {
          Floral: "from-pink-500 to-purple-500",
          Woody: "from-amber-700 to-amber-500",
          Citrus: "from-orange-500 to-yellow-500",
          Fresh: "from-cyan-500 to-blue-500",
          Oriental: "from-red-500 to-orange-500",
        };
        const mappedCategories = rawCategories.map((item) => ({
          name: item.name,
          count: item.count,
          color: colorMap[item.name] || "from-cyan-500 to-blue-500",
        }));
        setCategoryDistribution(mappedCategories);

        await Promise.all([
          loadSales({}),
          loadRevenue({}),
          loadAcquisition({}),
        ]);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message || "Failed to load dashboard";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
    const params = {};
    const today = new Date();
    
    switch (range) {
      case "7days":
        params.from = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
        break;
      case "30days":
        params.from = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
        break;
      case "90days":
        params.from = new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0];
        break;
      case "year":
        params.from = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
        break;
    }
    
    params.to = new Date().toISOString().split('T')[0];
    loadSales(params);
    loadRevenue(params);
    loadAcquisition(params);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-surface-secondary rounded-xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 h-64 bg-surface-secondary rounded-xl" />
              <div className="h-64 bg-surface-secondary rounded-xl" />
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
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-muted">
            Welcome back, Admin! Here's what's happening with your store today.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="mb-8 card p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-primary">Quick Actions:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/admin/orders")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>📋 Orders</span>
              </button>
              <button
                onClick={() => navigate("/admin/products")}
                className="btn-primary text-xs px-4 py-2 group"
              >
                <span>📦 Products</span>
              </button>
              <button
                onClick={() => navigate("/admin/users")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>👥 Users</span>
              </button>
              <button
                onClick={() => navigate("/admin/marketing/coupons")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>🏷️ Coupons</span>
              </button>
              <button
                onClick={() => navigate("/admin/marketing/banners")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>🎯 Banners</span>
              </button>
              <button
                onClick={() => navigate("/admin/marketing/categories")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>🗂️ Categories</span>
              </button>
              <button
                onClick={() => navigate("/admin/marketing/featured-collections")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>✨ Collections</span>
              </button>
              <button
                onClick={() => navigate("/admin/support/tickets")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>🎧 Support</span>
              </button>
              <button
                onClick={() => navigate("/admin/analytics")}
                className="btn-outline text-xs px-4 py-2 group"
              >
                <span>📊 Analytics</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4 animate-shake">
            <div className="flex items-center gap-3">
              <span className="text-error text-lg">⚠️</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        )}

        {summary && (
          <>
            {/* Summary Cards */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <SummaryCard
                label="Total Sales"
                value={formatCurrency(summary.totalSales)}
                icon="💰"
                trend="up"
                trendValue="12.5%"
                color="accent"
              />
              <SummaryCard
                label="Total Orders"
                value={summary.totalOrders}
                icon="📦"
                trend="up"
                trendValue="8.2%"
                color="success"
              />
              <SummaryCard
                label="Paid Orders"
                value={summary.paidOrders}
                icon="✅"
                trend="up"
                trendValue="15.3%"
                color="info"
              />
              <SummaryCard
                label="Customers"
                value={summary.totalCustomers}
                icon="👥"
                trend="up"
                trendValue="5.7%"
                color="warning"
              />
            </section>

            {/* Main Analytics Grid */}
            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              {/* Sales Chart */}
              <div className="lg:col-span-2 card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                      <span>📈</span> Sales Overview
                    </h2>
                    <p className="text-xs text-muted">Revenue and order trends</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {["7days", "30days", "90days", "year"].map((range) => (
                      <button
                        key={range}
                        onClick={() => handleTimeRangeChange(range)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          selectedTimeRange === range
                            ? 'bg-accent-primary text-white'
                            : 'bg-surface-secondary text-muted hover:text-primary'
                        }`}
                      >
                        {range === '7days' ? '7D' : range === '30days' ? '30D' : range === '90days' ? '90D' : '1Y'}
                      </button>
                    ))}
                  </div>
                </div>

                {isSalesLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
                  </div>
                ) : salesByDate.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-sm text-muted">No sales data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Chart Bars */}
                    <div className="h-48 flex items-end gap-1">
                      {salesByDate.slice(-7).map((item) => {
                        const maxSales = Math.max(...salesByDate.map(d => d.totalSales));
                        const height = (item.totalSales / maxSales) * 100;
                        return (
                          <div key={item.date} className="flex-1 group relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-primary border border-border-subtle rounded px-2 py-1 text-xs whitespace-nowrap z-10">
                              {formatCurrency(item.totalSales)}
                            </div>
                            <div
                              className="h-full w-full rounded-t-lg bg-accent-gradient opacity-80 group-hover:opacity-100 transition-all"
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Dates */}
                    <div className="flex justify-between text-xs text-muted">
                      {salesByDate.slice(-7).map((item) => (
                        <span key={item.date}>{formatDate(item.date)}</span>
                      ))}
                    </div>

                    {/* Sales List */}
                    <div className="space-y-2 max-h-48 overflow-auto pr-2 mt-4">
                      {salesByDate.map((item) => (
                        <div
                          key={item.date}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                        >
                          <span className="text-sm text-primary">{formatDate(item.date)}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-accent-primary">
                              {formatCurrency(item.totalSales)}
                            </span>
                            <span className="text-xs text-muted w-16 text-right">
                              {item.orders} orders
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Products */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mb-4">
                  <span>🏆</span> Top Products
                </h2>
                
                {topProducts.length === 0 ? (
                  <p className="text-sm text-muted">No products sold yet</p>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center text-xs font-bold text-accent-primary">
                          {index + 1}
                        </div>
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover border border-border-subtle"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted">
                            {product.totalQuantity} units sold
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent-primary">
                            {formatCurrency(product.totalSales)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <section className="mb-8">
              <div className="card p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span>⚠️</span> Low Stock Alerts
                  </h2>
                  <span className="text-sm text-muted">Threshold: {lowStock.threshold} units</span>
                </div>

                {lowStock.products.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-4xl mb-3 block">✅</span>
                    <p className="text-sm text-muted">All products are well stocked</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {lowStock.products.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-error/20 bg-error/5 hover-lift"
                      >
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-12 w-12 rounded-lg object-cover border border-border-subtle"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-primary line-clamp-1">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-error">{product.stock}</p>
                          <p className="text-[10px] text-muted">left</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

        {/* Recent Orders & Category Distribution */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Orders */}
          <div className="lg:col-span-2 card p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                    <span>📋</span> Recent Orders
                  </h2>
                  <button
                    onClick={() => navigate("/admin/orders")}
                    className="text-sm text-accent-primary hover:text-accent-secondary transition-colors"
                  >
                    View all →
                  </button>
                </div>

                {recentOrders.length === 0 ? (
                  <p className="text-sm text-muted">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentOrders.slice(0, 5).map((order) => (
                      <div
                        key={order._id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            order.status === 'delivered' ? 'bg-success' :
                            order.status === 'processing' ? 'bg-warning' :
                            order.status === 'shipped' ? 'bg-info' : 'bg-muted'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-primary">
                              #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted">
                              {order.user?.name || 'Guest'} • {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent-primary">
                            {formatCurrency(order.totalPrice)}
                          </p>
                          <p className="text-xs text-muted capitalize">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Analytics & Inventory */}
              <div className="space-y-4">
                {/* Category Distribution */}
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-primary flex items-center gap-2 mb-4">
                    <span>🥧</span> Category Distribution
                  </h2>
                  
                  <div className="space-y-4">
                    {categoryDistribution.map((cat) => (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-primary">{cat.name}</span>
                          <span className="text-muted">{cat.count} products</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                            style={{ width: `${Math.min(100, (cat.count / 50) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analytics & Reporting */}
                <div className="card p-6 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                      <span>📊</span> Analytics & Reporting
                    </h2>
                    <span className="text-xs text-muted">Last 30 days</span>
                  </div>

                  <div className="space-y-3">
                    {revenueStats && (
                      <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                        <div>
                          <p className="text-xs text-muted">Revenue analytics</p>
                          <p className="text-sm font-medium text-primary">
                            {formatCurrency(revenueStats.totalRevenue || 0)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted">
                          <p>
                            {revenueStats.totalOrders || 0} orders
                          </p>
                          <p>
                            Avg {formatCurrency(revenueStats.averageOrderValue || 0)}
                          </p>
                        </div>
                      </div>
                    )}

                    {acquisition && (
                      <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                        <div>
                          <p className="text-xs text-muted">Customer acquisition</p>
                          <p className="text-sm font-medium text-primary">
                            {acquisition.totalNewCustomers || 0} new
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted">
                          <p>
                            {acquisition.totalReturningCustomers || 0} returning
                          </p>
                        </div>
                      </div>
                    )}

                    {abandonedStats && (
                      <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                        <div>
                          <p className="text-xs text-muted">Abandoned carts</p>
                          <p className="text-sm font-medium text-primary">
                            {abandonedStats.totalAbandoned || 0} checkouts
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted">
                          <p>
                            Lost {formatCurrency(abandonedStats.estimatedLostRevenue || 0)}
                          </p>
                        </div>
                      </div>
                    )}

                    {inventorySummary && (
                      <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                        <div>
                          <p className="text-xs text-muted">Inventory overview</p>
                          <p className="text-sm font-medium text-primary">
                            {inventorySummary.totalProducts || 0} products
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted">
                          <p>
                            {inventorySummary.outOfStockCount || 0} out of stock
                          </p>
                          <p>
                            {inventorySummary.lowStockCount || 0} low stock
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
