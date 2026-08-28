"use client";

import { useMemo, useState } from "react";

const DEMO_ORGANIZATIONS = [
  {
    id: "ORG-1001",
    name: "New Patriotic Party",
    type: "Political Party",
    code: "NPP",
    status: "active",
    verification: "verified",
    admins: 16,
    members: 18420,
    regions: 16,
    constituencies: 276,
  },
  {
    id: "ORG-1002",
    name: "National Democratic Congress",
    type: "Political Party",
    code: "NDC",
    status: "active",
    verification: "verified",
    admins: 16,
    members: 17640,
    regions: 16,
    constituencies: 276,
  },
  {
    id: "ORG-1003",
    name: "Convention People's Party",
    type: "Political Party",
    code: "CPP",
    status: "active",
    verification: "verified",
    admins: 12,
    members: 6840,
    regions: 16,
    constituencies: 210,
  },
  {
    id: "ORG-1004",
    name: "Ghana Union Movement",
    type: "Political Party",
    code: "GUM",
    status: "active",
    verification: "pending",
    admins: 8,
    members: 3420,
    regions: 12,
    constituencies: 94,
  },
  {
    id: "ORG-1005",
    name: "National Observer Network",
    type: "Observer",
    code: "NON",
    status: "active",
    verification: "verified",
    admins: 5,
    members: 1250,
    regions: 10,
    constituencies: 78,
  },
];

export default function OrganizationsPage() {
  const [organizations, setOrganizations] =
    useState(DEMO_ORGANIZATIONS);

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedOrganization, setSelectedOrganization] =
    useState(null);

  const filteredOrganizations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return organizations.filter(
      (organization) => {
        const matchesSearch =
          !query ||
          organization.name
            .toLowerCase()
            .includes(query) ||
          organization.code
            .toLowerCase()
            .includes(query) ||
          organization.id
            .toLowerCase()
            .includes(query);

        const matchesType =
          typeFilter === "all" ||
          organization.type === typeFilter;

        const matchesStatus =
          statusFilter === "all" ||
          organization.status === statusFilter;

        return (
          matchesSearch &&
          matchesType &&
          matchesStatus
        );
      }
    );
  }, [
    organizations,
    search,
    typeFilter,
    statusFilter,
  ]);

  const activeCount =
    organizations.filter(
      (organization) =>
        organization.status === "active"
    ).length;

  const pendingCount =
    organizations.filter(
      (organization) =>
        organization.verification ===
        "pending"
    ).length;

  const partyCount =
    organizations.filter(
      (organization) =>
        organization.type ===
        "Political Party"
    ).length;

  const observerCount =
    organizations.filter(
      (organization) =>
        organization.type === "Observer"
    ).length;

  const updateStatus = (
    id,
    status
  ) => {
    setOrganizations((current) =>
      current.map((organization) =>
        organization.id === id
          ? {
              ...organization,
              status,
              verification:
                status === "active"
                  ? "verified"
                  : organization.verification,
            }
          : organization
      )
    );

    if (
      selectedOrganization?.id === id
    ) {
      setSelectedOrganization(
        (current) =>
          current
            ? {
                ...current,
                status,
              }
            : current
      );
    }
  };

  return (
    <main className="organizations-page">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="page-header">
        <div>
          <span className="eyebrow">
            SUPER ADMIN • PLATFORM MANAGEMENT
          </span>

          <h1>
            Organizations
          </h1>

          <p>
            Manage political parties,
            observers and organizational
            accounts across PoliSync Africa.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
        >
          + Add Organization
        </button>
      </header>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <section className="stats-grid">
        <StatCard
          icon="🏢"
          label="Total Organizations"
          value={organizations.length}
        />

        <StatCard
          icon="✓"
          label="Active"
          value={activeCount}
        />

        <StatCard
          icon="🏛️"
          label="Political Parties"
          value={partyCount}
        />

        <StatCard
          icon="👁️"
          label="Observers"
          value={observerCount}
        />

        <StatCard
          icon="⏳"
          label="Pending Verification"
          value={pendingCount}
        />
      </section>

      {/* =====================================================
          ORGANIZATION TYPES
      ===================================================== */}

      <section className="type-banner">
        <div>
          <strong>
            Organization architecture
          </strong>

          <p>
            Parties and observers use the
            same core organizational features,
            roles and functionality.
          </p>
        </div>

        <div className="hierarchy">
          <span>National Admin</span>
          <b>→</b>
          <span>Regional Admin</span>
          <b>→</b>
          <span>Constituency Admin</span>
          <b>→</b>
          <span>Polling Agent</span>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <section className="toolbar">
        <div className="search-box">
          <span>⌕</span>

          <input
            type="search"
            placeholder="Search organizations..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Types
          </option>

          <option value="Political Party">
            Political Parties
          </option>

          <option value="Observer">
            Observers
          </option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="suspended">
            Suspended
          </option>
        </select>
      </section>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <section className="organization-card">
        <div className="table-header">
          <div>
            <h2>
              Registered Organizations
            </h2>

            <p>
              {filteredOrganizations.length}{" "}
              organizations displayed
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
          >
            Export
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Status</th>
                <th>Admins</th>
                <th>Members</th>
                <th>Coverage</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrganizations.map(
                (organization) => (
                  <tr
                    key={organization.id}
                  >
                    <td>
                      <div className="organization-name">
                        <div className="organization-avatar">
                          {organization.code.slice(
                            0,
                            2
                          )}
                        </div>

                        <div>
                          <strong>
                            {
                              organization.name
                            }
                          </strong>

                          <small>
                            {organization.id}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="type-badge">
                        {organization.type}
                      </span>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          organization.status
                        }
                      />
                    </td>

                    <td>
                      {organization.admins}
                    </td>

                    <td>
                      {organization.members.toLocaleString()}
                    </td>

                    <td>
                      <span className="coverage">
                        {organization.regions}{" "}
                        regions
                        <br />
                        {organization.constituencies}{" "}
                        constituencies
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="view-button"
                        onClick={() =>
                          setSelectedOrganization(
                            organization
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          {filteredOrganizations.length ===
            0 && (
            <div className="empty-state">
              <div>🔎</div>

              <strong>
                No organizations found
              </strong>

              <p>
                Try changing your search or
                filters.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          DETAIL PANEL
      ===================================================== */}

      {selectedOrganization && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setSelectedOrganization(null)
          }
        >
          <section
            className="organization-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  ORGANIZATION PROFILE
                </span>

                <h2>
                  {
                    selectedOrganization.name
                  }
                </h2>

                <p>
                  {
                    selectedOrganization.id
                  }
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setSelectedOrganization(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              <DetailItem
                label="Organization Type"
                value={
                  selectedOrganization.type
                }
              />

              <DetailItem
                label="Organization Code"
                value={
                  selectedOrganization.code
                }
              />

              <DetailItem
                label="Verification"
                value={
                  selectedOrganization.verification
                }
              />

              <DetailItem
                label="Administrators"
                value={
                  selectedOrganization.admins
                }
              />

              <DetailItem
                label="Members"
                value={
                  selectedOrganization.members.toLocaleString()
                }
              />

              <DetailItem
                label="Regions"
                value={
                  selectedOrganization.regions
                }
              />

              <DetailItem
                label="Constituencies"
                value={
                  selectedOrganization.constituencies
                }
              />

              <DetailItem
                label="Status"
                value={
                  selectedOrganization.status
                }
              />
            </div>

            <div className="organization-hierarchy">
              <h3>
                Organizational hierarchy
              </h3>

              <div className="hierarchy-flow">
                <HierarchyItem
                  label="National Admin"
                />

                <span>↓</span>

                <HierarchyItem
                  label="Regional Admin"
                />

                <span>↓</span>

                <HierarchyItem
                  label="Constituency Admin"
                />

                <span>↓</span>

                <HierarchyItem
                  label="Polling Agents"
                />
              </div>
            </div>

            <div className="modal-actions">
              {selectedOrganization.status ===
              "active" ? (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() =>
                    updateStatus(
                      selectedOrganization.id,
                      "suspended"
                    )
                  }
                >
                  Suspend Organization
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() =>
                    updateStatus(
                      selectedOrganization.id,
                      "active"
                    )
                  }
                >
                  Activate Organization
                </button>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedOrganization(null)
                }
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}

      <style jsx>{`
        .organizations-page {
          min-height: 100vh;
          padding: 24px;
          background: #f5f8f6;
          color: #26332b;
          box-sizing: border-box;
        }

        .page-header {
          max-width: 1500px;
          margin: 0 auto 20px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .eyebrow {
          color: #c9a227;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .page-header h1 {
          margin: 4px 0;
          color: #075f2b;
          font-size: 26px;
          font-weight: 850;
        }

        .page-header p {
          margin: 0;
          color: #7d8780;
          font-size: 11px;
        }

        button,
        select,
        input {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        .primary-button {
          padding: 10px 14px;
          border: 0;
          border-radius: 9px;
          background: #075f2b;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
        }

        .primary-button:hover {
          background: #064d24;
        }

        .secondary-button {
          padding: 9px 13px;
          border: 1px solid #dce6df;
          border-radius: 8px;
          background: #ffffff;
          color: #526058;
          font-size: 9px;
          font-weight: 750;
        }

        /* ==================================================
           STATS
        ================================================== */

        .stats-grid {
          max-width: 1500px;
          margin: 0 auto 13px;
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap: 10px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px;
          border: 1px solid #dfe8e2;
          border-radius: 13px;
          background: #ffffff;
        }

        .stat-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 10px;
          background: #edf6f0;
          font-size: 17px;
        }

        .stat-card span {
          display: block;
          color: #8b948e;
          font-size: 8px;
        }

        .stat-card strong {
          display: block;
          margin-top: 3px;
          color: #075f2b;
          font-size: 19px;
          font-weight: 850;
        }

        /* ==================================================
           TYPE BANNER
        ================================================== */

        .type-banner {
          max-width: 1500px;
          margin: 0 auto 13px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px;
          border: 1px solid #dbe8df;
          border-radius: 13px;
          background: #edf6f0;
        }

        .type-banner strong {
          color: #075f2b;
          font-size: 11px;
        }

        .type-banner p {
          margin: 3px 0 0;
          color: #78837b;
          font-size: 8px;
        }

        .hierarchy {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .hierarchy span {
          padding: 6px 8px;
          border-radius: 7px;
          background: #ffffff;
          color: #075f2b;
          font-size: 7px;
          font-weight: 750;
        }

        .hierarchy b {
          color: #c9a227;
          font-size: 10px;
        }

        /* ==================================================
           TOOLBAR
        ================================================== */

        .toolbar {
          max-width: 1500px;
          margin: 0 auto 12px;
          display: flex;
          gap: 8px;
        }

        .search-box {
          flex: 1;
          min-width: 180px;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 0 11px;
          border: 1px solid #dce6df;
          border-radius: 9px;
          background: #ffffff;
        }

        .search-box span {
          color: #89938c;
          font-size: 16px;
        }

        .search-box input {
          width: 100%;
          padding: 10px 0;
          border: 0;
          outline: 0;
          color: #344139;
          font-size: 9px;
        }

        .toolbar select {
          min-width: 135px;
          padding: 9px;
          border: 1px solid #dce6df;
          border-radius: 9px;
          outline: 0;
          background: #ffffff;
          color: #68736c;
          font-size: 8px;
        }

        /* ==================================================
           TABLE
        ================================================== */

        .organization-card {
          max-width: 1500px;
          margin: 0 auto;
          border: 1px solid #dfe8e2;
          border-radius: 14px;
          background: #ffffff;
          overflow: hidden;
        }

        .table-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px;
          border-bottom: 1px solid #edf1ee;
        }

        .table-header h2 {
          margin: 0;
          color: #26352c;
          font-size: 14px;
        }

        .table-header p {
          margin: 3px 0 0;
          color: #949d97;
          font-size: 8px;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        th {
          padding: 10px 13px;
          background: #f8faf9;
          color: #8a938d;
          font-size: 7px;
          font-weight: 850;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td {
          padding: 12px 13px;
          border-top: 1px solid #edf1ee;
          color: #58645c;
          font-size: 8px;
        }

        .organization-name {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .organization-avatar {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #075f2b;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
        }

        .organization-name strong {
          display: block;
          color: #344139;
          font-size: 9px;
        }

        .organization-name small {
          display: block;
          margin-top: 2px;
          color: #9ba39e;
          font-size: 7px;
        }

        .type-badge {
          padding: 5px 7px;
          border-radius: 999px;
          background: #f0f5f2;
          color: #526058;
          font-size: 7px;
          font-weight: 750;
          white-space: nowrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          border-radius: 999px;
          font-size: 7px;
          font-weight: 800;
        }

        .status-active {
          background: #e8f5ec;
          color: #087532;
        }

        .status-suspended {
          background: #fff1f1;
          color: #a00000;
        }

        .coverage {
          color: #78837b;
          line-height: 1.6;
        }

        .view-button {
          padding: 6px 9px;
          border: 1px solid #dbe5df;
          border-radius: 7px;
          background: #ffffff;
          color: #075f2b;
          font-size: 8px;
          font-weight: 800;
        }

        .view-button:hover {
          background: #edf6f0;
        }

        .empty-state {
          padding: 45px 20px;
          text-align: center;
        }

        .empty-state div {
          font-size: 25px;
        }

        .empty-state strong {
          display: block;
          margin-top: 8px;
          color: #526058;
          font-size: 12px;
        }

        .empty-state p {
          margin: 4px 0 0;
          color: #929b95;
          font-size: 9px;
        }

        /* ==================================================
           MODAL
        ================================================== */

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(
            10,
            35,
            20,
            0.42
          );
        }

        .organization-modal {
          width: 100%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 20px;
          border: 2px solid #c9a227;
          border-radius: 17px;
          background: #ffffff;
          box-shadow:
            0 20px 60px
              rgba(0, 0, 0, 0.16);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #edf1ee;
        }

        .modal-header h2 {
          margin: 4px 0;
          color: #075f2b;
          font-size: 19px;
        }

        .modal-header p {
          margin: 0;
          color: #929b95;
          font-size: 8px;
        }

        .close-button {
          width: 30px;
          height: 30px;
          border: 0;
          border-radius: 8px;
          background: #f1f5f2;
          color: #657069;
          font-size: 18px;
        }

        .detail-grid {
          display: grid;
          grid-template-columns:
            repeat(2, 1fr);
          gap: 8px;
          margin-top: 15px;
        }

        .detail-item {
          padding: 10px;
          border-radius: 9px;
          background: #f7f9f8;
        }

        .detail-item span {
          display: block;
          color: #969f99;
          font-size: 7px;
        }

        .detail-item strong {
          display: block;
          margin-top: 4px;
          color: #344139;
          font-size: 9px;
        }

        .organization-hierarchy {
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid #edf1ee;
        }

        .organization-hierarchy h3 {
          margin: 0 0 9px;
          color: #344139;
          font-size: 10px;
        }

        .hierarchy-flow {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          flex-wrap: wrap;
        }

        .hierarchy-flow > span {
          color: #c9a227;
          font-weight: 900;
        }

        .hierarchy-item {
          padding: 8px 10px;
          border: 1px solid #dce7df;
          border-radius: 8px;
          background: #edf6f0;
          color: #075f2b;
          font-size: 7px;
          font-weight: 800;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
          padding-top: 13px;
          border-top: 1px solid #edf1ee;
        }

        .danger-button {
          padding: 9px 12px;
          border: 1px solid #e7caca;
          border-radius: 8px;
          background: #fff5f5;
          color: #a00000;
          font-size: 8px;
          font-weight: 800;
        }

        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .type-banner {
            align-items: flex-start;
            flex-direction: column;
          }

          .hierarchy {
            justify-content: flex-start;
          }
        }

        @media (max-width: 600px) {
          .organizations-page {
            padding: 14px;
          }

          .page-header {
            flex-direction: column;
          }

          .page-header h1 {
            font-size: 22px;
          }

          .primary-button {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .toolbar {
            flex-direction: column;
          }

          .search-box {
            min-width: 0;
          }

          .toolbar select {
            width: 100%;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }

          .modal-actions {
            flex-direction: column;
          }

          .modal-actions button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* ============================================================
   STATUS BADGE
============================================================ */

function StatusBadge({
  status,
}) {
  const active =
    status === "active";

  return (
    <span
      className={`status-badge ${
        active
          ? "status-active"
          : "status-suspended"
      }`}
    >
      ●
      {active
        ? "Active"
        : "Suspended"}
    </span>
  );
}

/* ============================================================
   DETAIL ITEM
============================================================ */

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* ============================================================
   HIERARCHY ITEM
============================================================ */

function HierarchyItem({
  label,
}) {
  return (
    <div className="hierarchy-item">
      {label}
    </div>
  );
}
