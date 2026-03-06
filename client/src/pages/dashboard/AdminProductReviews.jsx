import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";

function AdminProductReviews() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    visible: 0,
    hidden: 0,
    averageRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        setIsLoading(true);

        const [productResponse, reviewsResponse] = await Promise.all([
          api.get(`/api/products/${id}`),
          api.get(`/api/products/${id}/reviews/admin`),
        ]);

        const productData = productResponse.data || null;
        const reviewsData = reviewsResponse.data || [];

        setProduct(productData);
        setReviews(reviewsData);

        // Calculate stats
        const visibleReviews = reviewsData.filter(r => !r.isHidden);
        const hiddenReviews = reviewsData.filter(r => r.isHidden);
        const averageRating = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / (reviewsData.length || 1);
        
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsData.forEach(r => {
          if (r.rating >= 1 && r.rating <= 5) {
            ratingCounts[Math.floor(r.rating)]++;
          }
        });

        setStats({
          total: reviewsData.length,
          visible: visibleReviews.length,
          hidden: hiddenReviews.length,
          averageRating: averageRating || 0,
          ratingCounts,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message ||
          "Failed to load product reviews";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleToggleHide = async (reviewId, isHidden) => {
    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      const response = await api.patch(
        `/api/products/${id}/reviews/${reviewId}/hide`,
        { isHidden: !isHidden }
      );

      const updatedReview = response.data;
      
      setReviews((previousReviews) =>
        previousReviews.map((review) =>
          review._id === reviewId ? { ...review, ...updatedReview } : review
        )
      );

      setSuccess(`Review ${!isHidden ? 'hidden' : 'unhidden'} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update review visibility. Please try again.";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (reviewId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review permanently? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      await api.delete(`/api/products/${id}/reviews/${reviewId}`);

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review._id !== reviewId)
      );

      setSuccess("Review deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to delete review. Please try again.";
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReviews.length === 0) return;

    const actionText = action === 'hide' ? 'hide' : action === 'unhide' ? 'unhide' : 'delete';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${selectedReviews.length} selected review(s)?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      setIsUpdating(true);

      if (action === 'delete') {
        // Delete all selected reviews
        await Promise.all(
          selectedReviews.map(reviewId =>
            api.delete(`/api/products/${id}/reviews/${reviewId}`)
          )
        );
        setReviews(prev => prev.filter(r => !selectedReviews.includes(r._id)));
        setSuccess(`Deleted ${selectedReviews.length} reviews`);
      } else {
        // Hide/unhide all selected reviews
        const isHidden = action === 'hide';
        await Promise.all(
          selectedReviews.map(reviewId =>
            api.patch(`/api/products/${id}/reviews/${reviewId}/hide`, { isHidden })
          )
        );
        setReviews(prev =>
          prev.map(r =>
            selectedReviews.includes(r._id) ? { ...r, isHidden } : r
          )
        );
        setSuccess(`${action === 'hide' ? 'Hidden' : 'Unhidden'} ${selectedReviews.length} reviews`);
      }

      setSelectedReviews([]);
      setTimeout(() => setSuccess(""), 5000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        `Failed to ${action} reviews. Please try again.`;
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === filteredReviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(filteredReviews.map(r => r._id));
    }
  };

  const handleSelectReview = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-accent-primary' : 'text-muted'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      if (statusFilter === "visible") return !review.isHidden;
      if (statusFilter === "hidden") return review.isHidden;
      return true;
    })
    .filter(review => {
      if (ratingFilter === "all") return true;
      return Math.floor(review.rating) === parseInt(ratingFilter);
    })
    .filter(review => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        review.name?.toLowerCase().includes(searchLower) ||
        review.comment?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="flex gap-4">
              <div className="h-24 bg-surface-secondary rounded-xl w-48" />
              <div className="h-24 bg-surface-secondary rounded-xl w-48" />
              <div className="h-24 bg-surface-secondary rounded-xl w-48" />
            </div>
            <div className="h-96 bg-surface-secondary rounded-xl" />
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
              <span className="text-3xl">⭐</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                Review Management
              </h1>
            </div>
            {product && (
              <p className="text-muted">
                Managing reviews for <span className="text-primary font-medium">{product.name}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/products"
              className="btn-outline inline-flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Back to Products</span>
            </Link>
            {product && (
              <Link
                to={`/admin/products/${product._id}/edit`}
                className="btn-primary inline-flex items-center gap-2"
              >
                <span>✏️</span>
                <span>Edit Product</span>
              </Link>
            )}
          </div>
        </div>

        {/* Product Info Card */}
        {product && (
          <div className="mb-8 card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover border border-border-subtle"
              />
            )}
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-primary">{product.name}</h2>
              <p className="text-sm text-muted">{product.brand} • {product.category}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent-primary">
                  {product.rating?.toFixed(1) || "0.0"}
                </p>
                <p className="text-xs text-muted">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
                <p className="text-xs text-muted">Total Reviews</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Reviews</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.visible}</p>
            <p className="text-xs text-muted">Visible</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-warning">{stats.hidden}</p>
            <p className="text-xs text-muted">Hidden</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-accent-primary">
              {stats.averageRating.toFixed(1)}
            </p>
            <p className="text-xs text-muted">Avg Rating</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-1">
              {[5,4,3,2,1].map(rating => (
                <div key={rating} className="flex-1 text-center">
                  <p className="text-sm font-bold text-primary">{stats.ratingCounts[rating]}</p>
                  <p className="text-[10px] text-muted">{rating}★</p>
                </div>
              ))}
            </div>
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

        {/* Filters and Bulk Actions */}
        <div className="mb-6 space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by reviewer name or comment..."
                  className="input w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>

            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent-soft border border-accent-primary/20 animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary font-medium">
                  {selectedReviews.length} review(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkAction('hide')}
                  disabled={isUpdating}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Hide Selected
                </button>
                <button
                  onClick={() => handleBulkAction('unhide')}
                  disabled={isUpdating}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Unhide Selected
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  disabled={isUpdating}
                  className="btn-outline border-error text-error hover:bg-error/10 text-sm px-4 py-2"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedReviews([])}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Table */}
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Reviews Yet</h3>
            <p className="text-muted">
              This product hasn't received any reviews from customers
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Matching Reviews</h3>
            <p className="text-muted mb-6">No reviews match your search criteria</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setRatingFilter("all");
                setSortBy("newest");
              }}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-secondary border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === filteredReviews.length}
                        onChange={handleSelectAll}
                        className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Reviewer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredReviews.map((review, index) => (
                    <tr
                      key={review._id}
                      className="hover:bg-surface-secondary transition-colors animate-fade-in"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review._id)}
                          onChange={() => handleSelectReview(review._id)}
                          className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-primary">{review.name}</p>
                          {review.user && (
                            <p className="text-xs text-muted">Verified Purchase</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-muted">({review.rating})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-secondary line-clamp-2">{review.comment}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                            review.isHidden
                              ? 'bg-warning/20 text-warning'
                              : 'bg-success/20 text-success'
                          }`}
                        >
                          {review.isHidden ? 'Hidden' : 'Visible'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleHide(review._id, review.isHidden)}
                            disabled={isUpdating}
                            className={`btn-outline text-xs px-3 py-1.5 ${
                              review.isHidden
                                ? 'border-success text-success hover:bg-success/10'
                                : 'border-warning text-warning hover:bg-warning/10'
                            }`}
                          >
                            {review.isHidden ? 'Unhide' : 'Hide'}
                          </button>
                          <button
                            onClick={() => handleDelete(review._id)}
                            disabled={isUpdating}
                            className="btn-outline text-xs px-3 py-1.5 border-error text-error hover:bg-error/10"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-4 py-3 border-t border-border-subtle bg-surface-secondary">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  Showing {filteredReviews.length} of {reviews.length} reviews
                </span>
                <div className="flex gap-4">
                  <span className="text-muted">
                    Average: {stats.averageRating.toFixed(1)} / 5
                  </span>
                  <span className="text-muted">
                    Visible: {stats.visible} • Hidden: {stats.hidden}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminProductReviews;