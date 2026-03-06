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

function getPaymentMethodIcon(method) {
  if (!method) return "💳";
  const value = String(method).toLowerCase();
  if (value.includes("upi")) return "📲";
  if (value.includes("card") || value.includes("visa") || value.includes("master")) return "💳";
  if (value.includes("wallet")) return "👛";
  if (value.includes("cod") || value.includes("cash")) return "💵";
  if (value.includes("netbank") || value.includes("bank")) return "🏦";
  return "💳";
}

function AdminAnalytics() {
  const navigate = useNavigate();
  const [topCustomers, setTopCustomers] = useState([]);
  const [abandonedStats, setAbandonedStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  useEffect(() => {
    const session = getSession();

    if (!session || !session.user?.isAdmin) {
      navigate("/login");
      return;
    }

    const fetchAnalytics = async () => {
      try {
        setError("");
        setIsLoading(true);

        const [topCustomersRes, abandonedRes] = await Promise.all([
          api.get("/api/orders/stats/top-customers", {
            params: { limit: 10 },
          }),
          api.get("/api/orders/stats/abandoned-carts", {
            params: { olderThanHours: 24 },
          }),
        ]);

        const customersData =
          topCustomersRes.data && Array.isArray(topCustomersRes.data.customers)
            ? topCustomersRes.data.customers
            : [];

        setTopCustomers(customersData);
        setAbandonedStats(abandonedRes.data || null);
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load analytics";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 bg-surface-secondary rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">📊</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Analytics
              </h1>
            </div>
            <p className="text-muted">
              Deep dive into your customers and checkout performance.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="btn-outline text-xs px-4 py-2 inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <span>←</span>
            <span>Back to dashboard</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-error/20 bg-error/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-error text-lg">⚠️</span>
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                  <span>🏆</span> Top customers by revenue
                </h2>
                <p className="text-xs text-muted">
                  Based on paid orders in the last 30 days.
                </p>
              </div>
            </div>

            {topCustomers.length === 0 ? (
              <p className="text-sm text-muted">
                No customer revenue data available yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted border-b border-border-subtle">
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4 hidden sm:table-cell">Email</th>
                      <th className="py-2 pr-4 text-right">Orders</th>
                      <th className="py-2 pr-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer) => (
                      <tr
                        key={customer.userId}
                        className="border-b border-border-subtle/60 last:border-b-0"
                      >
                        <td className="py-2 pr-4">
                          <div className="flex flex-col">
                            <span className="text-primary text-sm">
                              {customer.name || "Unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 pr-4 hidden sm:table-cell">
                          <span className="text-xs text-muted">
                            {customer.email || "—"}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <span className="text-xs text-primary font-medium">
                            {customer.orders}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <span className="text-xs font-semibold text-primary">
                            {formatCurrency(customer.totalRevenue)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
                <span>🛒</span> Abandoned by payment method
              </h2>
              <span className="text-xs text-muted">Older than 24 hours</span>
            </div>

            {abandonedStats && abandonedStats.byPaymentMethod?.length > 0 ? (
              <div className="space-y-3">
                {abandonedStats.byPaymentMethod.map((item) => (
                  <div
                    key={item.paymentMethod || "unknown"}
                    className="rounded-lg bg-surface-secondary px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-primary flex items-center gap-2">
                          <span className="text-base">
                            {getPaymentMethodIcon(item.paymentMethod)}
                          </span>
                          <span>{item.paymentMethod || "Unknown"}</span>
                        </p>
                        <p className="text-[11px] text-muted">
                          {item.count} abandoned checkouts
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted">Lost value</p>
                        <p className="text-xs font-semibold text-primary">
                          {formatCurrency(item.estimatedLostRevenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">
                No abandoned checkout data for the selected window.
              </p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default AdminAnalytics;
