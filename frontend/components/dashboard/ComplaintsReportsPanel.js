"use client";

import { useMemo, useState } from "react";

export default function ComplaintsReportsPanel({
  initialItems = [],
  isSuperAdmin = false,
  onSubmit,
  onStatusChange,
}) {
  const [items, setItems] =
    useState(initialItems);

  const [filter, setFilter] = useState("all");

  const [showForm, setShowForm] =
    useState(false);

  const [type, setType] =
    useState("complaint");

  const [subject, setSubject] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState("medium");

  const [error, setError] =
    useState("");

  const [selectedItem, setSelectedItem] =
    useState(null);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    return items.filter(
      (item) => item.status === filter
    );
  }, [items, filter]);

  const pendingCount = items.filter(
    (item) =>
      item.status === "pending" ||
      item.status === "under_review"
  ).length;

  const submitComplaint = (event) => {
    event.preventDefault();

    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!description.trim()) {
      setError(
        "Please describe the complaint or report."
      );
      return;
    }

    const item = {
      id: `local-${Date.now()}`,

      type,

      subject: subject.trim(),

      description: description.trim(),

      priority,

      status: "pending",

      createdAt:
        new Date().toISOString(),

      submittedBy: "Current user",
    };

    setItems((current) => [
      item,
      ...current,
    ]);

    if (onSubmit) {
      onSubmit(item);
    }

    setSubject("");
    setDescription("");
    setPriority("medium");
    setType("complaint");
    setShowForm(false);
  };

  const changeStatus = (
    id,
    status
  ) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              updatedAt:
                new Date().toISOString(),
            }
          : item
      )
    );

    if (onStatusChange) {
      onStatusChange(id, status);
    }
  };

  return (
    <section className="polisync-complaints">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="complaints-header">
        <div className="complaints-title-area">
          <div className="complaints-icon">
            {isSuperAdmin ? "🛡️" : "📢"}
          </div>

          <div>
            <span className="complaints-label">
              {isSuperAdmin
                ? "PLATFORM OVERSIGHT"
                : "USER SUPPORT"}
            </span>

            <h2>
              {isSuperAdmin
                ? "Complaints & Reports"
                : "Report an Issue"}
            </h2>

            <p>
              {isSuperAdmin
                ? "Review complaints, reports and platform incidents."
                : "Send a complaint, report or platform issue."}
            </p>
          </div>
        </div>

        {!isSuperAdmin && (
          <button
            type="button"
            className="new-report-button"
            onClick={() =>
              setShowForm(
                (current) => !current
              )
            }
          >
            + Submit Report
          </button>
        )}
      </div>

      {/* ====================================================
          SUPER ADMIN SUMMARY
      ==================================================== */}

      {isSuperAdmin && (
        <div className="complaint-stat-grid">
          <StatCard
            label="Total"
            value={items.length}
            icon="📋"
          />

          <StatCard
            label="Pending"
            value={pendingCount}
            icon="⏳"
          />

          <StatCard
            label="Under Review"
            value={
              items.filter(
                (item) =>
                  item.status ===
                  "under_review"
              ).length
            }
            icon="🔎"
          />

          <StatCard
            label="Resolved"
            value={
              items.filter(
                (item) =>
                  item.status ===
                  "resolved"
              ).length
            }
            icon="✓"
          />
        </div>
      )}

      {/* ====================================================
          SUBMISSION FORM
      ==================================================== */}

      {showForm && (
        <form
          className="complaint-form"
          onSubmit={submitComplaint}
        >
          <div className="form-title">
            Submit a Complaint or Report
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="report-type">
                Type
              </label>

              <select
                id="report-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
              >
                <option value="complaint">
                  Complaint
                </option>

                <option value="report">
                  Report
                </option>

                <option value="incident">
                  Incident
                </option>

                <option value="technical">
                  Technical Issue
                </option>

                <option value="security">
                  Security Concern
                </option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="report-priority">
                Priority
              </label>

              <select
                id="report-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
              >
                <option value="low">
                  Low
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="high">
                  High
                </option>

                <option value="urgent">
                  Urgent
                </option>
              </select>
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="report-subject">
                Subject
              </label>

              <input
                id="report-subject"
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                placeholder="Enter the subject"
                maxLength={200}
              />
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="report-description">
                Description
              </label>

              <textarea
                id="report-description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Describe the issue in detail..."
                maxLength={5000}
              />
            </div>
          </div>

          {error && (
            <div
              className="form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
            >
              Submit Report
            </button>
          </div>
        </form>
      )}

      {/* ====================================================
          FILTERS
      ==================================================== */}

      {isSuperAdmin && (
        <div className="complaint-filters">
          <button
            type="button"
            className={
              filter === "all"
                ? "filter-active"
                : ""
            }
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === "pending"
                ? "filter-active"
                : ""
            }
            onClick={() =>
              setFilter("pending")
            }
          >
            Pending
          </button>

          <button
            type="button"
            className={
              filter === "under_review"
                ? "filter-active"
                : ""
            }
            onClick={() =>
              setFilter("under_review")
            }
          >
            Under Review
          </button>

          <button
            type="button"
            className={
              filter === "resolved"
                ? "filter-active"
                : ""
            }
            onClick={() =>
              setFilter("resolved")
            }
          >
            Resolved
          </button>
        </div>
      )}

      {/* ====================================================
          LIST
      ==================================================== */}

      <div className="complaints-list">
        {filteredItems.length === 0 && (
          <div className="complaints-empty">
            {isSuperAdmin
              ? "No complaints or reports match this filter."
              : "You haven't submitted any reports yet."}
          </div>
        )}

        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="complaint-item"
            onClick={() =>
              setSelectedItem(
                (current) =>
                  current && current.id === item.id
                    ? null
                    : item
              )
            }
          >
            <div className="complaint-item-header">
              <span
                className={`complaint-type-badge complaint-type-${item.type}`}
              >
                {item.type}
              </span>

              <span
                className={`complaint-priority-badge complaint-priority-${item.priority}`}
              >
                {item.priority}
              </span>

              <span
                className={`complaint-status-badge complaint-status-${item.status}`}
              >
                {item.status.replace("_", " ")}
              </span>
            </div>

            <div className="complaint-item-subject">
              {item.subject}
            </div>

            {selectedItem &&
              selectedItem.id === item.id && (
                <div className="complaint-item-description">
                  {item.description}
                </div>
              )}

            <div className="complaint-item-meta">
              <span>
                {item.submittedBy || "Anonymous"}
              </span>

              <span>
                {new Date(
                  item.createdAt
                ).toLocaleString()}
              </span>
            </div>

            {isSuperAdmin && (
              <div
                className="complaint-item-actions"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <button
                  type="button"
                  disabled={
                    item.status === "under_review"
                  }
                  onClick={() =>
                    changeStatus(
                      item.id,
                      "under_review"
                    )
                  }
                >
                  Mark Under Review
                </button>

                <button
                  type="button"
                  disabled={
                    item.status === "resolved"
                  }
                  onClick={() =>
                    changeStatus(
                      item.id,
                      "resolved"
                    )
                  }
                >
                  Mark Resolved
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        {icon}
      </div>

      <div className="stat-card-value">
        {value}
      </div>

      <div className="stat-card-label">
        {label}
      </div>
    </div>
  );
}
