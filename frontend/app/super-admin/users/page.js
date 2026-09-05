"use client";

import { useEffect, useMemo, useState } from "react";
import UserCard from "../../components/UserCard";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

function getToken() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("polisync_token") ||
    sessionStorage.getItem("polisync_token") ||
    ""
  );
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!API_BASE) throw new Error("The backend API URL is not configured.");
      if (!token) throw new Error("Your session has expired. Please log in again.");

      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(
        `${API_BASE}/api/platform-users?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 403) {
        throw new Error(data.message || "You are not authorized to view platform users.");
      }

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Unable to load platform users.");
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (loadError) {
      setUsers([]);
      setError(loadError.message || "Unable to load platform users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const displayedCount = useMemo(() => users.length, [users]);

  const updateUser = async (id, changes) => {
    setError("");

    try {
      const token = getToken();
      if (!API_BASE || !token) throw new Error("Your session has expired. Please log in again.");

      const response = await fetch(`${API_BASE}/api/platform-users/${id}`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(changes),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "Unable to update this user.");
      }

      setUsers((current) =>
        current.map((user) => (user.id === id ? data.user : user))
      );
    } catch (updateError) {
      setError(updateError.message || "Unable to update this user.");
    }
  };

  const handleSuspend = (id) => updateUser(id, { accountStatus: "suspended" });
  const handleActivate = (id) => updateUser(id, { accountStatus: "active" });
  const handleVerify = (id) => updateUser(id, { verification: "verified" });
  const handleChangeRole = (id, role) => updateUser(id, { role });

  return (
    <main
      style={{
        padding: "40px 24px 60px",
        background: "#F3F5F7",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <h1 style={{ margin: 0 }}>Platform Users</h1>

        <p style={{ color: "#6B7280", marginTop: 8 }}>
          {loading ? "Loading users…" : `${displayedCount} users shown`}
        </p>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 18,
              padding: "12px 14px",
              borderRadius: 12,
              background: "#FEE2E2",
              color: "#991B1B",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 24,
          }}
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone or username…"
            style={{
              flex: 1,
              minWidth: 240,
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              fontSize: 14,
              background: "white",
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              fontSize: 14,
              background: "white",
              cursor: "pointer",
            }}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: "50px 0", textAlign: "center", color: "#6B7280" }}>
            Loading real platform users…
          </div>
        ) : users.length === 0 ? (
          <div
            style={{
              marginTop: 30,
              padding: 30,
              background: "white",
              borderRadius: 18,
              color: "#6B7280",
            }}
          >
            No real users match this search or filter.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              marginTop: 30,
            }}
          >
            {users.map((user) => (
              <UserCard
                key={user.id}
                {...user}
                onSuspend={handleSuspend}
                onActivate={handleActivate}
                onVerify={handleVerify}
                onChangeRole={handleChangeRole}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
