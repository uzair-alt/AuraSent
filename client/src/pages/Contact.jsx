import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api/client";

function Contact() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTicketId = searchParams.get("ticketId") || "";

  const [tickets, setTickets] = useState([]);
  const [activeTicketId, setActiveTicketId] = useState(initialTicketId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/api/tickets/my");

        const list = Array.isArray(response.data) ? response.data : [];

        setTickets(list);

        if (!activeTicketId && list.length > 0) {
          setActiveTicketId(list[0]._id);
        }
      } catch (errorResponse) {
        const messageText =
          errorResponse.response?.data?.message ||
          "Failed to load your support conversations.";
        setError(messageText);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, [activeTicketId]);

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket._id === activeTicketId) || null,
    [tickets, activeTicketId]
  );

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!activeTicket || !newMessage.trim()) {
      return;
    }

    try {
      setIsSending(true);

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

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-1">
            Contact support
          </h1>
          <p className="text-sm text-muted">
            Chat with our team about your orders, returns, or any questions.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-danger-soft bg-danger-soft/20 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr,1.8fr]">
          <aside className="card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-semibold text-primary">
                Your conversations
              </h2>
              <p className="text-[11px] text-muted">
                {tickets.length} open
              </p>
            </div>
            {isLoading ? (
              <p className="text-xs text-muted">
                Loading support conversations...
              </p>
            ) : tickets.length === 0 ? (
              <p className="text-xs text-muted">
                You do not have any support tickets yet. Start a request from
                the Help center.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
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
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[11px] text-muted">
                        {ticket.type === "return"
                          ? "Return or refund"
                          : ticket.type === "order"
                          ? "Order issue"
                          : ticket.type === "refund"
                          ? "Refund"
                          : ticket.type === "chat"
                          ? "Chat"
                          : "General"}
                      </span>
                      <span className="text-[11px] text-accent-primary">
                        {ticket.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="card p-4 flex flex-col h-[460px]">
            {!activeTicket ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <p className="text-sm text-muted mb-2">
                  Select a support request on the left to open the chat.
                </p>
                <p className="text-[11px] text-muted">
                  You can start a new request from the Help center page.
                </p>
              </div>
            ) : (
              <>
                <header className="mb-3 border-b border-border-subtle pb-2">
                  <h2 className="text-sm font-semibold text-primary line-clamp-2">
                    {activeTicket.subject}
                  </h2>
                  <p className="text-[11px] text-muted">
                    Created {formatDateTime(activeTicket.createdAt)}
                  </p>
                </header>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {activeTicket.messages && activeTicket.messages.length > 0 ? (
                    activeTicket.messages.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          entry.senderType === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs rounded-2xl px-3 py-2 text-xs ${
                            entry.senderType === "user"
                              ? "bg-accent-primary text-white rounded-br-sm"
                              : "bg-surface-secondary text-primary rounded-bl-sm"
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
                      No messages yet. Send the first message below.
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
                    placeholder="Type your message..."
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

export default Contact;

