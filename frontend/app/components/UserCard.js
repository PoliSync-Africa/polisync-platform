"use client";

const STATUS_COLORS = {
  active: { background: "#DCFCE7", color: "#166534" },
  pending: { background: "#FEF3C7", color: "#92400E" },
  suspended: { background: "#FEE2E2", color: "#991B1B" },
  rejected: { background: "#FEE2E2", color: "#991B1B" },
  deactivated: { background: "#E5E7EB", color: "#374151" },
};

const VERIFICATION_COLORS = {
  verified: { background: "#DCFCE7", color: "#166534" },
  unverified: { background: "#FEF3C7", color: "#92400E" },
};

const ROLE_OPTIONS = [
  ["national_party_admin", "National Party Admin"],
  ["regional_party_admin", "Regional Party Admin"],
  ["constituency_admin", "Constituency Admin"],
  ["polling_station_agent", "Polling Station Agent"],
  ["national_observer_admin", "National Observer Admin"],
  ["regional_observer_admin", "Regional Observer Admin"],
  ["constituency_observer_admin", "Constituency Observer Admin"],
  ["observer_polling_station_agent", "Observer Polling Station Agent"],
  ["presidential_candidate", "Presidential Candidate"],
  ["parliamentary_candidate", "Parliamentary Candidate"],
  ["individual_researcher", "Individual Researcher"],
  ["research_institution_admin", "Research Institution Admin"],
  ["researcher", "Researcher"],
  ["organization_member", "Organization Member"],
];

function formatRole(role) {
  if (role === "super_admin") return "Super Admin";
  const option = ROLE_OPTIONS.find(([value]) => value === role);
  if (option) return option[1];
  if (!role) return "User";
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatLastSeen(value, isOnline) {
  if (isOnline) return "Online now";
  if (!value) return "Last seen: Never";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last seen: Unknown";

  return `Last seen: ${date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
}

export default function UserCard({
  id,
  name,
  email,
  role,
  organization,
  status,
  verification,
  lastSeen,
  isOnline,
  onSuspend,
  onActivate,
  onVerify,
  onChangeRole,
}) {
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const verificationStyle =
    VERIFICATION_COLORS[verification] || VERIFICATION_COLORS.unverified;
  const isSuperAdmin = role === "super_admin";

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 8px 20px rgba(0,0,0,.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, wordBreak: "break-word" }}>{name}</h3>
          <p
            style={{
              margin: "4px 0 0",
              color: "#6B7280",
              fontSize: 13,
              wordBreak: "break-word",
            }}
          >
            {email}
          </p>
        </div>

        <span
          style={{
            ...statusStyle,
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            background: "#F3F5F7",
            color: "#0B3D2E",
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 12,
          }}
        >
          {formatRole(role)}
        </span>

        <span
          style={{
            background: "#F3F5F7",
            color: "#0B3D2E",
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 12,
          }}
        >
          {organization || "No organization"}
        </span>

        <span
          style={{
            ...verificationStyle,
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 12,
          }}
        >
          {verification === "verified" ? "Verified" : "Unverified"}
        </span>
      </div>

      <p
        style={{
          marginTop: 12,
          color: isOnline ? "#166534" : "#9CA3AF",
          fontSize: 12,
        }}
      >
        {formatLastSeen(lastSeen, isOnline)}
      </p>

      {!isSuperAdmin && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            borderTop: "1px solid #F3F5F7",
            paddingTop: 14,
          }}
        >
          {status === "active" ? (
            <button
              type="button"
              onClick={() => onSuspend && onSuspend(id)}
              style={{
                background: "#FEE2E2",
                color: "#991B1B",
                border: "none",
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Suspend
            </button>
          ) : status === "suspended" ? (
            <button
              type="button"
              onClick={() => onActivate && onActivate(id)}
              style={{
                background: "#DCFCE7",
                color: "#166534",
                border: "none",
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Activate
            </button>
          ) : null}

          {verification !== "verified" && (
            <button
              type="button"
              onClick={() => onVerify && onVerify(id)}
              style={{
                background: "#FEF3C7",
                color: "#92400E",
                border: "none",
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Verify
            </button>
          )}

          <select
            value={ROLE_OPTIONS.some(([value]) => value === role) ? role : "organization_member"}
            onChange={(event) =>
              onChangeRole && onChangeRole(id, event.target.value)
            }
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 12,
              color: "#0B3D2E",
              background: "white",
              cursor: "pointer",
              minWidth: 190,
            }}
          >
            {ROLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
