import { useEffect, useState } from "react";
import api from "../../api/client";

function AdminFaqs() {
  const [faqs, setFaqs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState("");

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await api.get("/api/faqs/admin");

        setFaqs(Array.isArray(response.data) ? response.data : []);
      } catch (errorResponse) {
        const messageText =
          errorResponse.response?.data?.message ||
          "Failed to load FAQs.";
        setError(messageText);
      } finally {
        setIsLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setCategory("");
    setOrder(0);
    setIsActive(true);
    setEditingId("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        question,
        answer,
        category,
        order: Number.isNaN(Number(order)) ? 0 : Number(order),
        isActive,
      };

      if (editingId) {
        const response = await api.put(`/api/faqs/${editingId}`, payload);

        setFaqs((previous) =>
          previous.map((item) =>
            item._id === editingId ? response.data : item
          )
        );
        setSuccess("FAQ updated.");
      } else {
        const response = await api.post("/api/faqs", payload);

        setFaqs((previous) => [...previous, response.data]);
        setSuccess("FAQ added.");
      }

      resetForm();
    } catch (errorResponse) {
      const messageText =
        errorResponse.response?.data?.message ||
        "Failed to save FAQ. Please try again.";
      setError(messageText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (faq) => {
    setEditingId(faq._id);
    setQuestion(faq.question || "");
    setAnswer(faq.answer || "");
    setCategory(faq.category || "");
    setOrder(faq.order || 0);
    setIsActive(Boolean(faq.isActive));
    setSuccess("");
    setError("");
  };

  const handleDelete = async (id) => {
    if (!id) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(`/api/faqs/${id}`);

      setFaqs((previous) => previous.filter((item) => item._id !== id));

      if (editingId === id) {
        resetForm();
      }

      setSuccess("FAQ deleted.");
    } catch (errorResponse) {
      const messageText =
        errorResponse.response?.data?.message ||
        "Failed to delete FAQ. Please try again.";
      setError(messageText);
    }
  };

  return (
    <div className="min-h-screen bg-page">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">❓</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                FAQ Management
              </h1>
            </div>
            <p className="text-muted text-sm">
              Manage the questions shown on the customer Help center page.
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs text-success">
            {success}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr,1.8fr]">
          <form
            onSubmit={handleSubmit}
            className="card p-4 space-y-3"
          >
            <h2 className="text-sm font-semibold text-primary mb-1">
              {editingId ? "Edit FAQ" : "Add new FAQ"}
            </h2>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Question shown to customers"
                className="input text-sm px-3 py-2"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted">
                Answer
              </label>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Answer including any helpful links or instructions"
                rows={4}
                className="input text-sm px-3 py-2 resize-none"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted">
                  Category
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="e.g. Returns, Orders"
                  className="input text-xs px-3 py-2"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted">
                  Order
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  className="input text-xs px-3 py-2"
                />
              </div>
              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-3 w-3"
                />
                <span className="text-xs text-muted">Visible to customers</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-outline px-4 py-2 text-xs"
                >
                  Cancel edit
                </button>
              ) : (
                <span className="text-[11px] text-muted">
                  Group FAQs by category to keep Help center organized.
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary px-4 py-2 text-xs disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingId
                  ? "Update FAQ"
                  : "Add FAQ"}
              </button>
            </div>
          </form>

          <section className="card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-sm font-semibold text-primary">
                Existing FAQs
              </h2>
              <p className="text-[11px] text-muted">
                {faqs.length} item{faqs.length === 1 ? "" : "s"}
              </p>
            </div>
            {isLoading ? (
              <p className="text-xs text-muted">Loading FAQs...</p>
            ) : faqs.length === 0 ? (
              <p className="text-xs text-muted">
                No FAQs have been created yet. Add your first FAQ using the form
                on the left.
              </p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {faqs.map((faq) => (
                  <div
                    key={faq._id}
                    className="rounded-lg border border-border-subtle bg-surface-secondary p-3 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-primary">
                          {faq.question}
                        </p>
                        <p className="mt-1 text-muted whitespace-pre-line line-clamp-3">
                          {faq.answer}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-muted">
                          {faq.category || "General"}
                        </span>
                        <span className="text-[10px] text-muted">
                          Order {faq.order}
                        </span>
                        <span
                          className={`text-[10px] ${
                            faq.isActive ? "text-success" : "text-muted"
                          }`}
                        >
                          {faq.isActive ? "Visible" : "Hidden"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(faq)}
                        className="btn-outline px-3 py-1 text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(faq._id)}
                        className="btn-outline border-error text-error hover:bg-error/10 px-3 py-1 text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default AdminFaqs;

