"use client";

const STATUS_COLORS = {
  active: { background: "#DCFCE7", color: "#166534" },
  suspended: { background: "#FEE2E2", color: "#991B1B" }
};

const VERIFICATION_COLORS = {
  verified: { background: "#DCFCE7", color: "#166534" },
  unverified: { background: "#FEF3C7", color: "#92400E" }
};

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  onSuspend,
  onActivate,
  onVerify,
  onChangeRole
}) {
  const statusStyle =
    STATUS_COLORS[status] || STATUS_COLORS.active;

  const verificationStyle =
    VERIFICATION_COLORS[verification] ||
    VERIFICATION_COLORS.unverified;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 18,
        padding: 22,
        boxShadow: "0 8px 20px rgba(0,0,0,.06)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{name}</h3>

          <p
            style={{
              margin: "4px 0 0",
              color: "#6B7280",
              fontSize: 13
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
            fontWeight: 600
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
          gap: 8
        }}
      >
        <span
          style={{
            background: "#F3F5F7",
            color: "#0B3D2E",
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 12
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
            fontSize: 12
          }}
        >
          {organization}
        </span>

        <span
          style={{
            ...verificationStyle,
            padding: "6px 12px",
            borderRadius: 20,
            fontSize: 12
          }}
        >
          {verification === "verified" ? "Verified" : "Unverified"}
        </span>
      </div>

      <p
        style={{
          marginTop: 12,
          color: "#9CA3AF",
          fontSize: 12
        }}
      >
        Last seen: {lastSeen}
      </p>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          borderTop: "1px solid #F3F5F7",
          paddingTop: 14
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
              cursor: "pointer"
            }}
          >
            Suspend
          </button>
        ) : (
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
              cursor: "pointer"
            }}
          >
            Activate
          </button>
        )}

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
              cursor: "pointer"
            }}
          >
            Verify
          </button>
        )}

        <select
          value={role}
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
            cursor: "pointer"
          }}
        >
          <option value="national_admin">National Admin</option>
          <option value="regional_admin">Regional Admin</option>
          <option value="constituency_admin">Constituency Admin</option>
          <option value="polling_station_agent">
            Polling Station Agent
          </option>
        </select>
      </div>
    </div>
  );
}
