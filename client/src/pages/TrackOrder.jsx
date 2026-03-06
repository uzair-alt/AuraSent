import { useState } from "react";
import api from "../api/client";

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!orderId.trim()) {
      setError("Enter an order ID to track.");
      setOrder(null);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setOrder(null);

      const response = await api.get(`/api/orders/${orderId.trim()}`);

      setOrder(response.data);
    } catch (errorResponse) {
      const messageText =
        errorResponse.response?.data?.message ||
        "Unable to find this order. Check the ID and try again.";
      setError(messageText);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatStatus = (status) => {
    if (status === "shipped") {
      return "Shipped";
    }
    if (status === "delivered") {
      return "Delivered";
    }
    if (status === "cancelled") {
      return "Cancelled";
    }
    if (status === "processing") {
      return "Processing";
    }
    return "Pending";
  };

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-6 space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-1">
            Track your order
          </h1>
          <p className="text-sm text-muted">
            Enter your order ID to see the latest status and delivery
            information.
          </p>
        </header>

        <section className="card p-5 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            <input
              type="text"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              placeholder="Enter order ID"
              className="input flex-1 text-sm px-3 py-2"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
            >
              {isLoading ? "Searching..." : "Track order"}
            </button>
          </form>

          {error && (
            <div className="rounded-lg border border-danger-soft bg-danger-soft/20 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          {order && (
            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <h2 className="text-base font-semibold text-primary">
                  Order overview
                </h2>
                <p className="text-muted">
                  <span className="font-medium text-primary">Order ID:</span>{" "}
                  <span className="font-mono">{order._id}</span>
                </p>
                <p className="text-muted">
                  <span className="font-medium text-primary">Placed:</span>{" "}
                  {formatDateTime(order.createdAt)}
                </p>
                <p className="text-muted">
                  <span className="font-medium text-primary">Total:</span>{" "}
                  <span className="font-mono">
                    ₹{Math.round(order.totalPrice || 0).toLocaleString("en-IN")}
                  </span>
                </p>
                <p className="text-muted">
                  <span className="font-medium text-primary">
                    Payment:
                  </span>{" "}
                  {order.isPaid ? "Paid" : "Pending"}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <h2 className="text-base font-semibold text-primary">
                  Delivery status
                </h2>
                <p className="text-muted">
                  <span className="font-medium text-primary">Status:</span>{" "}
                  {formatStatus(order.status)}
                </p>
                <p className="text-muted">
                  <span className="font-medium text-primary">Shipped:</span>{" "}
                  {order.status === "shipped" || order.isDelivered
                    ? formatDateTime(order.updatedAt)
                    : "Not shipped yet"}
                </p>
                <p className="text-muted">
                  <span className="font-medium text-primary">Delivered:</span>{" "}
                  {order.isDelivered
                    ? formatDateTime(order.deliveredAt)
                    : "Not delivered yet"}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default TrackOrder;

