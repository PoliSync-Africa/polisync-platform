"use client";

import { useMemo, useState } from "react";
import UserCard from "../../components/UserCard";

const DEMO_USERS = [
  {
    id: "USR-1001",
    name: "Kwame Mensah",
    email: "kwame@example.com",
    role: "national_admin",
    organization: "NPP",
    status: "active",
    verification: "verified",
    lastSeen: "2 min ago"
  },
  {
    id: "USR-1002",
    name: "Ama Boateng",
    email: "ama@example.com",
    role: "regional_admin",
    organization: "NDC",
    status: "active",
    verification: "verified",
    lastSeen: "8 min ago"
  }
];

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search.trim() ||
        user.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        user.email.toLowerCase().includes(search.trim().toLowerCase()) ||
        user.organization.toLowerCase().includes(search.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const updateUser = (id, changes) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, ...changes } : user
      )
    );
  };

  const handleSuspend = (id) => updateUser(id, { status: "suspended" });
  const handleActivate = (id) => updateUser(id, { status: "active" });
  const handleVerify = (id) => updateUser(id, { verification: "verified" });
  const handleChangeRole = (id, role) => updateUser(id, { role });

  return (
    <main
      style={{
        padding: 40,
        background: "#F3F5F7",
        minHeight: "100vh"
      }}
    >
      <h1>Platform Users</h1>

      <p style={{ color: "#6B7280", marginTop: 4 }}>
        {filteredUsers.length} of {users.length} users shown
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 24
        }}
      >
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email or organization..."
          style={{
            flex: 1,
            minWidth: 240,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            fontSize: 14
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
            cursor: "pointer"
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
          marginTop: 30
        }}
      >
        {filteredUsers.length === 0 ? (
          <p style={{ color: "#9CA3AF" }}>No users match this search.</p>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              {...user}
              onSuspend={handleSuspend}
              onActivate={handleActivate}
              onVerify={handleVerify}
              onChangeRole={handleChangeRole}
            />
          ))
        )}
      </div>
    </main>
  );
}
