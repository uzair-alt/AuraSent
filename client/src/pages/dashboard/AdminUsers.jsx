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

function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    active: 0,
    inactive: 0,
    newToday: 0,
  });
  
  const session = getSession();
  const currentUserId = session?.user?.id;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError("");
        setIsLoading(true);
        const response = await api.get("/api/users", {
          params: {
            page,
            pageSize: 20,
            q: search || undefined,
            role: roleFilter || undefined,
            active:
              statusFilter === "active"
                ? "true"
                : statusFilter === "inactive"
                ? "false"
                : undefined,
            sort: `${sortBy}:${sortOrder}`,
          },
        });

        const payload = Array.isArray(response.data)
          ? {
              users: response.data,
              page: 1,
              totalPages: 1,
            }
          : response.data;

        const usersData = payload.users || [];
        setUsers(usersData);
        setPage(payload.page || 1);
        setTotalPages(payload.totalPages || 1);

        // Calculate stats
        const today = new Date().setHours(0, 0, 0, 0);
        setStats({
          total: usersData.length,
          admins: usersData.filter(u => u.isAdmin).length,
          active: usersData.filter(u => u.isActive).length,
          inactive: usersData.filter(u => !u.isActive).length,
          newToday: usersData.filter(u => new Date(u.createdAt) >= today).length,
        });
      } catch (errorResponse) {
        const message =
          errorResponse.response?.data?.message || "Failed to load users";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  const updateUser = async (userId, payload) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.put(`/api/users/${userId}`, payload);
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId ? { ...user, ...response.data } : user
        )
      );
      setSuccess("User updated successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        "Failed to update user. Please try again.";
      setError(message);
    }
  };

  const handleToggleAdmin = (user) => {
    updateUser(user._id, { isAdmin: !user.isAdmin });
  };

  const handleToggleActive = (user) => {
    if (user._id === currentUserId && user.isActive) {
      setError("You cannot deactivate your own account");
      return;
    }
    updateUser(user._id, { isActive: !user.isActive });
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    const actionText = action === 'makeAdmin' ? 'make admin' : 
                      action === 'removeAdmin' ? 'remove admin' :
                      action === 'activate' ? 'activate' : 'deactivate';

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} ${selectedUsers.length} selected user(s)?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");
      
      if (action === 'makeAdmin' || action === 'removeAdmin') {
        const isAdmin = action === 'makeAdmin';
        await Promise.all(
          selectedUsers.map(id => 
            api.put(`/api/users/${id}`, { isAdmin })
          )
        );
        setUsers(prev => 
          prev.map(u => 
            selectedUsers.includes(u._id) ? { ...u, isAdmin } : u
          )
        );
      } else {
        const isActive = action === 'activate';
        // Filter out current user if trying to deactivate
        if (!isActive && selectedUsers.includes(currentUserId)) {
          setError("You cannot deactivate your own account");
          return;
        }
        await Promise.all(
          selectedUsers.map(id => 
            api.put(`/api/users/${id}`, { isActive })
          )
        );
        setUsers(prev => 
          prev.map(u => 
            selectedUsers.includes(u._id) ? { ...u, isActive } : u
          )
        );
      }

      setSuccess(`Updated ${selectedUsers.length} users successfully`);
      setSelectedUsers([]);
      setTimeout(() => setSuccess(""), 3000);
    } catch (errorResponse) {
      const message =
        errorResponse.response?.data?.message ||
        `Failed to update users. Please try again.`;
      setError(message);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u._id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Filter users for display (for stats we already have all users)
  const filteredUsers = users.filter(user => {
    if (roleFilter === "admin") return user.isAdmin;
    if (roleFilter === "user") return !user.isAdmin;
    return true;
  }).filter(user => {
    if (statusFilter === "active") return user.isActive;
    if (statusFilter === "inactive") return !user.isActive;
    return true;
  }).filter(user => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-page">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-surface-secondary rounded w-48" />
            <div className="h-4 bg-surface-secondary rounded w-64" />
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-surface-secondary rounded-xl" />
              ))}
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
              <span className="text-3xl">👥</span>
              <h1 className="text-3xl md:text-4xl font-bold text-gradient">
                User Management
              </h1>
            </div>
            <p className="text-muted">
              Manage customer and administrator accounts
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="btn-outline inline-flex items-center gap-2 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="card p-4">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted">Total Users</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-accent-primary">{stats.admins}</p>
            <p className="text-xs text-muted">Administrators</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted">Active</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-warning">{stats.inactive}</p>
            <p className="text-xs text-muted">Inactive</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-info">{stats.newToday}</p>
            <p className="text-xs text-muted">New Today</p>
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
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  placeholder="Search by name or email..."
                  className="input w-full pl-10 pr-4 py-2"
                />
              </div>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setPage(1);
                setRoleFilter(e.target.value);
              }}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Customers</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
              className="input px-4 py-2 sm:w-40"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input px-3 py-2 text-sm w-32"
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="createdAt">Joined</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                className="btn-outline px-3 py-2 text-sm"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>

            {(search || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setPage(1);
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
                className="btn-outline px-4 py-2 text-sm whitespace-nowrap"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent-soft border border-accent-primary/20 animate-slide-up">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary font-medium">
                  {selectedUsers.length} user(s) selected
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleBulkAction('makeAdmin')}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Make Admin
                </button>
                <button
                  onClick={() => handleBulkAction('removeAdmin')}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Remove Admin
                </button>
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="btn-outline border-success text-success hover:bg-success/10 text-sm px-4 py-2"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="btn-outline border-warning text-warning hover:bg-warning/10 text-sm px-4 py-2"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="btn-outline text-sm px-4 py-2"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-primary mb-2">No Users Found</h3>
            <p className="text-muted mb-6">
              {search || roleFilter || statusFilter
                ? "No users match your filters"
                : "No users have been created yet"}
            </p>
            {(search || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
                className="btn-primary"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-secondary border-b border-border-subtle">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length}
                          onChange={handleSelectAll}
                          className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user._id}
                        className="hover:bg-surface-secondary transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => handleSelectUser(user._id)}
                            disabled={user._id === currentUserId}
                            className="rounded border-border-subtle bg-surface-secondary text-accent-primary focus:ring-accent-primary disabled:opacity-50"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/admin/users/${user._id}`)}
                            className="font-medium text-primary hover:text-accent-primary transition-colors text-left"
                          >
                            {user.name}
                            {user._id === currentUserId && (
                              <span className="ml-2 text-xs text-accent-primary">(You)</span>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-secondary">
                          {user.email}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isAdmin
                              ? 'bg-accent-primary/20 text-accent-primary'
                              : 'bg-surface-secondary text-muted'
                          }`}>
                            {user.isAdmin ? 'Admin' : 'Customer'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.isActive
                              ? 'bg-success/20 text-success'
                              : 'bg-error/20 text-error'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleAdmin(user)}
                              className={`btn-outline text-xs px-3 py-1.5 ${
                                user.isAdmin
                                  ? 'border-warning text-warning hover:bg-warning/10'
                                  : 'border-success text-success hover:bg-success/10'
                              }`}
                            >
                              {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button
                              onClick={() => handleToggleActive(user)}
                              disabled={user._id === currentUserId && user.isActive}
                              className={`btn-outline text-xs px-3 py-1.5 ${
                                user.isActive
                                  ? 'border-warning text-warning hover:bg-warning/10'
                                  : 'border-success text-success hover:bg-success/10'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
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
                    Showing {filteredUsers.length} of {users.length} users
                  </span>
                  <div className="flex gap-4">
                    <span className="text-muted">
                      Admins: {stats.admins} • Active: {stats.active}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  ← Previous
                </button>
                <span className="text-sm text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-outline px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminUsers;