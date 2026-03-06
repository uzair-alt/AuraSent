import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";

function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [activeTicketId, setActiveTicketId] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoading(true);
        setError("");

        const params = {};

        if (statusFilter) {
          params.status = statusFilter;
        }

        if (typeFilter) {
          params.type = typeFilter;
        }

        const response = await api.get("/api/tickets", { params });

        setTickets(Array.isArray(response.data) ? response.data : []);

        if (!activeTicketId && response.data && response.data.length > 0) {
          setActiveTicketId(response.data[0]._id);
        }
      } catch (errorResponse) {
        const messageText =
          errorResponse.response?.data?.message ||
          "Failed to load support tickets.";
        setError(messageText);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [statusFilter, typeFilter, activeTicketId]);

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket._id === activeTicketId) || null,
    [tickets, activeTicketId]
  );

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

  const formatStatusLabel = (status) => {
    if (status === "resolved" || status === "closed") {
      return "Resolved";
    }

    if (status === "in_progress") {
      return "In progress";
    }

    return "Open";
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!activeTicket || !newMessage.trim()) {
      return;
    }

    try {
      setIsSending(true);
      setError("");

      const response = await api.post(
        `/api/tickets/${activeTicket._id}/messages`,
        {
          message: newMessage,
        }
      );

      setNewMessage("");

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket._id === activeTicket._id ? response.data : ticket
        )
      );
    } catch (errorResponse) {
      const messageText =
        errorResponse.response?.data?.message ||
        "Failed to send message. Please try again.";
      setError(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeTicket || !status) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      setError("");

      const response = await api.put(`/api/tickets/${activeTicket._id}/status`, {
        status,
      });

      setTickets((previous) =>
        previous.map((ticket) =>
          ticket._id === activeTicket._id ? response.data : ticket
        )
      );
    } catch (errorResponse) {
      const messageText =
        errorResponse.response?.data?.message ||
        "Failed to update ticket status.";
      setError(messageText);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const openTicketsCount = tickets.filter(
    (ticket) => ticket.status === "open" || ticket.status === "in_progress"
  ).length;

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🎧</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Support Tickets
              </h1>
            </div>
            <p className="text-muted text-sm">
              Manage customer service tickets, replies, and resolutions.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-muted">
              {tickets.length} tickets • {openTicketsCount} open or in progress
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs text-error">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr,1.8fr]">
          <aside className="card p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-primary">
                Tickets
              </h2>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="input text-[11px] px-2 py-1"
                >
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="input text-[11px] px-2 py-1"
                >
                  <option value="">All types</option>
                  <option value="general">General</option>
                  <option value="order">Order</option>
                  <option value="return">Return</option>
                  <option value="refund">Refund</option>
                  <option value="chat">Chat</option>
                </select>
              </div>
            </div>
            {isLoading ? (
              <p className="text-xs text-muted">
                Loading support tickets...
              </p>
            ) : tickets.length === 0 ? (
              <p className="text-xs text-muted">
                No tickets found for the selected filters.
              </p>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket._id}
                    type="button"
                    onClick={() => setActiveTicketId(ticket._id)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      activeTicketId === ticket._id
                        ? "border-accent-primary bg-accent-soft/20"
                        : "border-border-subtle bg-surface-secondary hover:border-accent-primary"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-primary line-clamp-1">
                        {ticket.subject}
                      </p>
                      <span className="text-[10px] text-muted">
                        {formatDateTime(ticket.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-muted line-clamp-1">
                        {ticket.user?.name || "Unknown user"}
                      </span>
                      <span className="text-[11px] text-accent-primary">
                        {formatStatusLabel(ticket.status)}
                      </span>
                    </div>
                    {ticket.order && (
                      <p className="mt-1 text-[10px] text-muted">
                        Order #{ticket.order._id.slice(-8).toUpperCase()} •{" "}
                        {ticket.order.status}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="card p-4 flex flex-col h-[540px]">
            {!activeTicket ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-sm text-muted mb-2">
                  Select a ticket to view details and reply.
                </p>
                <p className="text-[11px] text-muted">
                  Use the filters on the left to narrow down the list.
                </p>
              </div>
            ) : (
              <>
                <header className="mb-3 border-b border-border-subtle pb-2 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-primary line-clamp-2">
                      {activeTicket.subject}
                    </h2>
                    <p className="text-[11px] text-muted">
                      From {activeTicket.user?.name || "Unknown"} •{" "}
                      {activeTicket.user?.email || "No email"}
                    </p>
                    {activeTicket.order && (
                      <p className="text-[11px] text-muted">
                        Order #{activeTicket.order._id.slice(-8).toUpperCase()}{" "}
                        • {activeTicket.order.status} • ₹
                        {Math.round(
                          activeTicket.order.totalPrice || 0
                        ).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <select
                      value={activeTicket.status}
                      onChange={(event) =>
                        handleUpdateStatus(event.target.value)
                      }
                      disabled={isUpdatingStatus}
                      className="input text-[11px] px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <p className="text-[10px] text-muted">
                      Created {formatDateTime(activeTicket.createdAt)}
                    </p>
                  </div>
                </header>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {activeTicket.messages && activeTicket.messages.length > 0 ? (
                    activeTicket.messages.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          entry.senderType === "user"
                            ? "justify-start"
                            : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-sm rounded-2xl px-3 py-2 text-xs ${
                            entry.senderType === "user"
                              ? "bg-surface-secondary text-primary rounded-bl-sm"
                              : "bg-accent-primary text-white rounded-br-sm"
                          }`}
                        >
                          <p className="whitespace-pre-line">
                            {entry.message}
                          </p>
                          <p className="mt-1 text-[9px] opacity-80">
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted">
                      No messages yet. Send the first reply below.
                    </p>
                  )}
                </div>
                <form
                  onSubmit={handleSendMessage}
                  className="mt-3 border-t border-border-subtle pt-2 flex items-center gap-2"
                >
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder="Type your reply to the customer..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-border-subtle bg-surface-secondary px-3 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
                  >
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default AdminSupportTickets;

