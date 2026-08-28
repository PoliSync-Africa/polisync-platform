"use client";

import { useMemo, useState } from "react";

export default function RemindersPanel({
  initialReminders = [],
  onReminderCreate,
  onReminderComplete,
  onReminderDelete,
}) {
  const [reminders, setReminders] =
    useState(initialReminders);

  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [priority, setPriority] = useState("medium");

  const [error, setError] = useState("");

  const pendingReminders = useMemo(
    () =>
      reminders
        .filter((reminder) => !reminder.completed)
        .sort(
          (a, b) =>
            new Date(a.dueAt || 0) -
            new Date(b.dueAt || 0)
        ),
    [reminders]
  );

  const completedReminders = useMemo(
    () =>
      reminders.filter(
        (reminder) => reminder.completed
      ),
    [reminders]
  );

  const createReminder = (event) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a reminder.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!time) {
      setError("Please select a time.");
      return;
    }

    const dueAt = new Date(
      `${date}T${time}`
    );

    if (Number.isNaN(dueAt.getTime())) {
      setError("Please enter a valid date and time.");
      return;
    }

    const reminder = {
      id: `local-${Date.now()}`,

      title: title.trim(),

      dueAt: dueAt.toISOString(),

      priority,

      completed: false,

      createdAt: new Date().toISOString(),
    };

    setReminders((current) => [
      ...current,
      reminder,
    ]);

    if (onReminderCreate) {
      onReminderCreate(reminder);
    }

    setTitle("");
    setDate("");
    setTime("");
    setPriority("medium");
    setShowForm(false);
  };

  const completeReminder = (id) => {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              completed: true,
              completedAt:
                new Date().toISOString(),
            }
          : reminder
      )
    );

    const reminder = reminders.find(
      (item) => item.id === id
    );

    if (reminder && onReminderComplete) {
      onReminderComplete(reminder);
    }
  };

  const deleteReminder = (id) => {
    setReminders((current) =>
      current.filter(
        (reminder) => reminder.id !== id
      )
    );

    if (onReminderDelete) {
      onReminderDelete(id);
    }
  };

  return (
    <section className="polisync-reminders">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="reminders-header">
        <div>
          <span className="reminders-label">
            PERSONAL PRODUCTIVITY
          </span>

          <h2>Reminders & Tasks</h2>

          <p>
            Keep track of important tasks,
            deadlines and follow-ups.
          </p>
        </div>

        <button
          type="button"
          className="add-reminder-button"
          onClick={() =>
            setShowForm((current) => !current)
          }
        >
          <span>+</span>
          Add Reminder
        </button>
      </div>

      {/* ====================================================
          CREATE FORM
      ==================================================== */}

      {showForm && (
        <form
          className="reminder-form"
          onSubmit={createReminder}
        >
          <div className="reminder-form-title">
            New Reminder
          </div>

          <div className="reminder-form-grid">
            <div className="reminder-field reminder-field-wide">
              <label htmlFor="reminder-title">
                Reminder
              </label>

              <input
                id="reminder-title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Review election results"
                maxLength={200}
              />
            </div>

            <div className="reminder-field">
              <label htmlFor="reminder-date">
                Date
              </label>

              <input
                id="reminder-date"
                type="date"
                value={date}
                onChange={(event) =>
                  setDate(event.target.value)
                }
              />
            </div>

            <div className="reminder-field">
              <label htmlFor="reminder-time">
                Time
              </label>

              <input
                id="reminder-time"
                type="time"
                value={time}
                onChange={(event) =>
                  setTime(event.target.value)
                }
              />
            </div>

            <div className="reminder-field">
              <label htmlFor="reminder-priority">
                Priority
              </label>

              <select
                id="reminder-priority"
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
          </div>

          {error && (
            <div
              className="reminder-form-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <div className="reminder-form-actions">
            <button
              type="button"
              className="cancel-reminder-button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-reminder-button"
            >
              Save Reminder
            </button>
          </div>
        </form>
      )}

      {/* ====================================================
          PENDING REMINDERS
      ==================================================== */}

      <div className="reminder-list">
        {pendingReminders.length === 0 ? (
          <EmptyReminders
            onAdd={() => setShowForm(true)}
          />
        ) : (
          pendingReminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onComplete={() =>
                completeReminder(reminder.id)
              }
              onDelete={() =>
                deleteReminder(reminder.id)
              }
            />
          ))
        )}
      </div>

      {/* ====================================================
          COMPLETED
      ==================================================== */}

      {completedReminders.length > 0 && (
        <details className="completed-reminders">
          <summary>
            Completed (
            {completedReminders.length}
            )
          </summary>

          <div className="completed-list">
            {completedReminders.map(
              (reminder) => (
                <div
                  key={reminder.id}
                  className="completed-item"
                >
                  <span className="completed-check">
                    ✓
                  </span>

                  <span>
                    {reminder.title}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      deleteReminder(reminder.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              )
            )}
          </div>
        </details>
      )}

      <style jsx>{`
        .polisync-reminders {
          width: 100%;
          padding: 22px;
          border: 1px solid #e3ebe5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px rgba(17, 65, 36, 0.05);
        }

        .reminders-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
        }

        .reminders-label {
          display: block;
          color: #c9a227;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .reminders-header h2 {
          margin: 4px 0 0;
          color: #075f2b;
          font-size: 18px;
          font-weight: 850;
        }

        .reminders-header p {
          margin: 5px 0 0;
          color: #7b857e;
          font-size: 11px;
          line-height: 1.5;
        }

        .add-reminder-button {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 13px;
          border: 0;
          border-radius: 10px;
          background: #075f2b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .add-reminder-button span {
          font-size: 17px;
          line-height: 1;
        }

        .add-reminder-button:hover {
          background: #064d24;
        }

        /* ==================================================
           FORM
        ================================================== */

        .reminder-form {
          margin-top: 18px;
          padding: 16px;
          border: 1px solid #e4ebe6;
          border-radius: 13px;
          background: #f8fbf9;
        }

        .reminder-form-title {
          color: #075f2b;
          font-size: 13px;
          font-weight: 850;
        }

        .reminder-form-grid {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 11px;
          margin-top: 12px;
        }

        .reminder-field {
          min-width: 0;
        }

        .reminder-field-wide {
          grid-column: span 3;
        }

        .reminder-field label {
          display: block;
          margin-bottom: 5px;
          color: #526058;
          font-size: 10px;
          font-weight: 750;
        }

        .reminder-field input,
        .reminder-field select {
          width: 100%;
          min-height: 40px;
          padding: 9px 10px;
          border: 1px solid #dce5df;
          border-radius: 9px;
          background: #ffffff;
          color: #29342e;
          font-size: 12px;
          outline: none;
        }

        .reminder-field input:focus,
        .reminder-field select:focus {
          border-color: #075f2b;
          box-shadow:
            0 0 0 2px rgba(7, 95, 43, 0.08);
        }

        .reminder-form-error {
          margin-top: 10px;
          padding: 9px 10px;
          border: 1px solid #efcece;
          border-radius: 8px;
          background: #fff5f5;
          color: #a00000;
          font-size: 10px;
        }

        .reminder-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 13px;
        }

        .cancel-reminder-button,
        .save-reminder-button {
          padding: 9px 13px;
          border-radius: 9px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .cancel-reminder-button {
          border: 1px solid #dce5df;
          background: #ffffff;
          color: #68736c;
        }

        .save-reminder-button {
          border: 0;
          background: #075f2b;
          color: #ffffff;
        }

        /* ==================================================
           REMINDER LIST
        ================================================== */

        .reminder-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 18px;
        }

        .reminder-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e8eee9;
          border-radius: 11px;
          background: #ffffff;
        }

        .reminder-complete-button {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1.5px solid #b8c5bc;
          border-radius: 6px;
          background: #ffffff;
          color: #075f2b;
          cursor: pointer;
        }

        .reminder-complete-button:hover {
          border-color: #075f2b;
          background: #f1f7f3;
        }

        .reminder-content {
          min-width: 0;
          flex: 1;
        }

        .reminder-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #2d3831;
          font-size: 12px;
          font-weight: 750;
        }

        .reminder-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
          margin-top: 4px;
        }

        .reminder-date {
          color: #89928c;
          font-size: 9px;
        }

        .reminder-priority {
          padding: 2px 6px;
          border-radius: 999px;
          font-size: 8px;
          font-weight: 850;
          text-transform: uppercase;
        }

        .priority-low {
          background: #eef5f0;
          color: #52715e;
        }

        .priority-medium {
          background: #f7f4e9;
          color: #8a7221;
        }

        .priority-high {
          background: #fff0df;
          color: #9a5a12;
        }

        .priority-urgent {
          background: #fff0f0;
          color: #a00000;
        }

        .reminder-delete-button {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #9ba49e;
          cursor: pointer;
          font-size: 14px;
        }

        .reminder-delete-button:hover {
          background: #fff4f4;
          color: #a00000;
        }

        /* ==================================================
           EMPTY
        ================================================== */

        .empty-reminders {
          padding: 24px 12px;
          text-align: center;
          border: 1px dashed #dce5df;
          border-radius: 12px;
          background: #fbfdfb;
        }

        .empty-reminders-icon {
          font-size: 24px;
        }

        .empty-reminders strong {
          display: block;
          margin-top: 7px;
          color: #4f5b53;
          font-size: 12px;
        }

        .empty-reminders p {
          margin: 4px 0 10px;
          color: #919a94;
          font-size: 10px;
        }

        .empty-reminders button {
          padding: 7px 11px;
          border: 1px solid #c9a227;
          border-radius: 8px;
          background: #ffffff;
          color: #806916;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }

        /* ==================================================
           COMPLETED
        ================================================== */

        .completed-reminders {
          margin-top: 15px;
          border-top: 1px solid #edf1ee;
          padding-top: 12px;
        }

        .completed-reminders summary {
          color: #78827c;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
        }

        .completed-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 9px;
        }

        .completed-item {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #8a938d;
          font-size: 10px;
        }

        .completed-check {
          color: #0a8f3c;
          font-weight: 900;
        }

        .completed-item button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: #a00000;
          font-size: 9px;
          cursor: pointer;
        }

        @media (max-width: 650px) {
          .polisync-reminders {
            padding: 17px;
          }

          .reminders-header {
            flex-direction: column;
          }

          .add-reminder-button {
            width: 100%;
            justify-content: center;
          }

          .reminder-form-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .reminder-field-wide {
            grid-column: span 2;
          }
        }

        @media (max-width: 430px) {
          .reminder-form-grid {
            grid-template-columns: 1fr;
          }

          .reminder-field-wide {
            grid-column: span 1;
          }

          .reminder-form-actions {
            flex-direction: column-reverse;
          }

          .cancel-reminder-button,
          .save-reminder-button {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   REMINDER ITEM
============================================================ */

function ReminderItem({
  reminder,
  onComplete,
  onDelete,
}) {
  return (
    <div className="reminder-item">
      <button
        type="button"
        className="reminder-complete-button"
        aria-label={`Complete ${reminder.title}`}
        onClick={onComplete}
      >
        <span />
      </button>

      <div className="reminder-content">
        <div className="reminder-title">
          {reminder.title}
        </div>

        <div className="reminder-meta">
          <span className="reminder-date">
            📅 {formatDueDate(reminder.dueAt)}
          </span>

          <span
            className={`reminder-priority priority-${
              reminder.priority || "medium"
            }`}
          >
            {reminder.priority || "medium"}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="reminder-delete-button"
        aria-label={`Delete ${reminder.title}`}
        onClick={onDelete}
      >
        ×
      </button>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyReminders({ onAdd }) {
  return (
    <div className="empty-reminders">
      <div className="empty-reminders-icon">
        📅
      </div>

      <strong>No upcoming reminders</strong>

      <p>
        Add a reminder so you don't forget
        important tasks.
      </p>

      <button
        type="button"
        onClick={onAdd}
      >
        Create Reminder
      </button>
    </div>
  );
}

/* ============================================================
   DATE FORMATTER
============================================================ */

function formatDueDate(value) {
  if (!value) {
    return "No date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
