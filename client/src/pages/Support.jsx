import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";

function Support() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketType, setTicketType] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(false);
  const [faqError, setFaqError] = useState("");

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setIsLoadingTickets(true);
        setTicketError("");

        const response = await api.get("/api/tickets/my");

        setTickets(Array.isArray(response.data) ? response.data : []);
      } catch (errorResponse) {
        const messageText =
          errorResponse.response?.data?.message ||
          "Failed to load your support requests.";
        setTicketError(messageText);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    loadTickets();
  }, []);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setIsLoadingFaqs(true);
        setFaqError("");

        const response = await api.get("/api/faqs");

        setFaqs(Array.isArray(response.data) ? response.data : []);
      } catch (errorResponse) {
        const messageText =
          errorResponse.response?.data?.message ||
          "Failed to load frequently asked questions.";
        setFaqError(messageText);
      } finally {
        setIsLoadingFaqs(false);
      }
    };

    loadFaqs();
  }, []);

  const handleSubmitTicket = async (event) => {
    event.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setTicketError("Please enter a subject and message.");
      return;
    }

    try {
      setIsSubmitting(true);
      setTicketError("");

      const response = await api.post("/api/tickets", {
        subject,
        message,
        type: ticketType,
      });

      setSubject("");
      setMessage("");
      setTicketType("general");

      setTickets((previous) => [response.data, ...previous]);
    } catch (errorResponse) {
      const messageText =
        errorResponse.response?.data?.message ||
        "Failed to submit your request. Please try again.";
      setTicketError(messageText);
    } finally {
      setIsSubmitting(false);
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
    if (status === "resolved" || status === "closed") {
      return "Resolved";
    }

    if (status === "in_progress") {
      return "In progress";
    }

    return "Open";
  };

  const groupedFaqs = useMemo(() => {
    if (!faqs.length) {
      return [];
    }

    const groups = {};

    faqs.forEach((item) => {
      const key = item.category || "General";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
    });

    return Object.entries(groups).map(([category, items]) => ({
      category,
      items,
    }));
  }, [faqs]);

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient mb-2">
              Customer Service
            </h1>
            <p className="text-sm text-muted">
              Returns, refunds, support chat, FAQs, and order help in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => navigate("/track-order")}
              className="btn-outline px-4 py-2"
            >
              Track an order
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="btn-primary px-4 py-2"
            >
              Contact support
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,1.2fr]">
          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-primary mb-3">
                Start a support request
              </h2>
              <p className="text-sm text-muted mb-4">
                Tell us what you need help with. We will reply to you in the
                support chat.
              </p>
              {ticketError && (
                <div className="mb-3 rounded-lg border border-danger-soft bg-danger-soft/20 px-3 py-2 text-xs text-danger">
                  {ticketError}
                </div>
              )}
              <form onSubmit={handleSubmitTicket} className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">
                      Topic
                    </label>
                    <select
                      value={ticketType}
                      onChange={(event) =>
                        setTicketType(event.target.value)
                      }
                      className="input text-xs px-3 py-2"
                    >
                      <option value="general">General question</option>
                      <option value="order">Order issue</option>
                      <option value="return">Return or exchange</option>
                      <option value="refund">Refund</option>
                      <option value="chat">Chat</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Short summary of your request"
                      className="input text-xs px-3 py-2"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted">
                    Details
                  </label>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Describe the issue and include any order details."
                    rows={4}
                    className="input text-xs px-3 py-2 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted">
                    For returns or refunds, include your order ID so we can
                    help faster.
                  </p>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
                  >
                    {isSubmitting ? "Sending..." : "Submit request"}
                  </button>
                </div>
              </form>
            </div>

            <div className="card p-5">
              <h2 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <span>❓</span>
                Frequently asked questions
              </h2>
              {isLoadingFaqs ? (
                <p className="text-xs text-muted">
                  Loading frequently asked questions...
                </p>
              ) : faqError ? (
                <p className="text-xs text-danger">{faqError}</p>
              ) : !groupedFaqs.length ? (
                <p className="text-xs text-muted">
                  No FAQs are available yet. Check back soon or contact support.
                </p>
              ) : (
                <div className="space-y-4 text-sm text-muted">
                  {groupedFaqs.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {group.category}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((faq) => (
                          <details
                            key={faq._id}
                            className="group rounded-xl border border-border-subtle bg-surface-secondary p-3"
                          >
                            <summary className="flex cursor-pointer items-center justify-between text-sm text-primary">
                              <span>{faq.question}</span>
                              <span className="text-xs text-muted group-open:rotate-180 transition-transform">
                                ▼
                              </span>
                            </summary>
                            <div className="mt-2 text-xs text-muted whitespace-pre-line">
                              {faq.answer}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card p-5">
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span>💬</span>
                Support chat
              </h2>
              <p className="text-sm text-muted mb-4">
                Use your latest open ticket to continue chatting with our
                support team.
              </p>
              {isLoadingTickets ? (
                <p className="text-xs text-muted">Loading your requests...</p>
              ) : tickets.length === 0 ? (
                <p className="text-xs text-muted">
                  You do not have any open support requests yet. Submit a new
                  request to start chatting with us.
                </p>
              ) : (
                <div className="space-y-3 text-xs">
                  {tickets.slice(0, 3).map((ticket) => (
                    <button
                      key={ticket._id}
                      type="button"
                      onClick={() =>
                        navigate(`/contact?ticketId=${ticket._id}`)
                      }
                      className="w-full text-left rounded-xl border border-border-subtle bg-surface-secondary p-3 hover:border-accent-primary transition-colors"
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
                          {formatStatus(ticket.status)}
                        </span>
                      </div>
                    </button>
                  ))}
                  {tickets.length > 3 && (
                    <button
                      type="button"
                      onClick={() => navigate("/contact")}
                      className="w-full text-center text-[11px] text-accent-primary hover:underline"
                    >
                      View all support conversations
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span>🔄</span>
                Returns and refunds
              </h2>
              <p className="text-sm text-muted mb-3">
                Request a return or refund in a few steps.
              </p>
              <ul className="space-y-2 text-xs text-muted">
                <li>Check that your order is within 30 days of delivery.</li>
                <li>
                  Make sure the fragrance is unopened and in its original
                  packaging.
                </li>
                <li>
                  Start a return request with your order ID and reason for
                  return.
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  setTicketType("return");
                  setSubject("Return or refund request");
                }}
                className="mt-4 w-full btn-outline text-xs py-2"
              >
                Start return request
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default Support;
