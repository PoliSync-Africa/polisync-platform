"use client";

import { useMemo, useState } from "react";

export default function NotificationsPanel({
  initialNotifications = [],
  onNotificationRead,
  onNotificationDelete,
}) {
  const [notifications, setNotifications] =
    useState(initialNotifications);

  const [filter, setFilter] = useState("all");

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (notification) => !notification.read
      ).length,
    [notifications]
  );

  const visibleNotifications = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter(
        (notification) => !notification.read
      );
    }

    return notifications;
  }, [notifications, filter]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
              readAt: new Date().toISOString(),
            }
          : notification
      )
    );

    const notification = notifications.find(
      (item) => item.id === id
    );

    if (notification && onNotificationRead) {
      onNotificationRead(notification);
    }
  };

  const markAllAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
        readAt:
          notification.readAt ||
          new Date().toISOString(),
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((current) =>
      current.filter(
        (notification) =>
          notification.id !== id
      )
    );

    if (onNotificationDelete) {
      onNotificationDelete(id);
    }
  };

  return (
    <section className="polisync-notifications">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="notifications-header">
        <div className="notifications-title-area">
          <div className="notifications-icon">
            🔔
          </div>

          <div>
            <span className="notifications-label">
              ALERT CENTER
            </span>

            <h2>
              Notifications
              {unreadCount > 0 && (
                <span className="unread-count">
                  {unreadCount}
                </span>
              )}
            </h2>

            <p>
              Important updates and account
              activity.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="mark-all-button"
            onClick={markAllAsRead}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* ====================================================
          FILTERS
      ==================================================== */}

      <div className="notification-filters">
        <button
          type="button"
          className={
            filter === "all"
              ? "notification-filter-active"
              : ""
          }
          onClick={() => setFilter("all")}
        >
          All
        </button>

        <button
          type="button"
          className={
            filter === "unread"
              ? "notification-filter-active"
              : ""
          }
          onClick={() => setFilter("unread")}
        >
          Unread
          {unreadCount > 0 && (
            <span>{unreadCount}</span>
          )}
        </button>
      </div>

      {/* ====================================================
          NOTIFICATION LIST
      ==================================================== */}

      <div className="notification-list">
        {visibleNotifications.length === 0 ? (
          <EmptyNotifications
            unreadOnly={filter === "unread"}
          />
        ) : (
          visibleNotifications.map(
            (notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() =>
                  markAsRead(notification.id)
                }
                onDelete={() =>
                  deleteNotification(
                    notification.id
                  )
                }
              />
            )
          )
        )}
      </div>

      {/* ====================================================
          FOOTER
      ==================================================== */}

      <div className="notifications-footer">
        <span>
          Notifications are specific to your
          PoliSync account and permissions.
        </span>
      </div>

      <style jsx>{`
        .polisync-notifications {
          width: 100%;
          padding: 22px;
          border: 1px solid #e3ebe5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px rgba(17, 65, 36, 0.05);
        }

        /* ==================================================
           HEADER
        ================================================== */

        .notifications-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .notifications-title-area {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .notifications-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 13px;
          background: #eaf5ee;
          border: 1px solid #d9e9de;
          font-size: 20px;
        }

        .notifications-label {
          display: block;
          color: #c9a227;
          font-size: 8px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }

        .notifications-title-area h2 {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 3px 0 0;
          color: #075f2b;
          font-size: 18px;
          font-weight: 850;
        }

        .notifications-title-area p {
          margin: 3px 0 0;
          color: #818a84;
          font-size: 10px;
        }

        .unread-count {
          min-width: 19px;
          height: 19px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border-radius: 999px;
          background: #c9a227;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
        }

        .mark-all-button {
          padding: 8px 10px;
          border: 1px solid #dce6df;
          border-radius: 8px;
          background: #ffffff;
          color: #526058;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
        }

        .mark-all-button:hover {
          background: #f3f8f5;
          color: #075f2b;
        }

        /* ==================================================
           FILTERS
        ================================================== */

        .notification-filters {
          display: flex;
          gap: 5px;
          margin-top: 17px;
          padding-bottom: 10px;
          border-bottom: 1px solid #edf1ee;
        }

        .notification-filters button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #7d8780;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
        }

        .notification-filters button:hover {
          background: #f4f8f5;
          color: #075f2b;
        }

        .notification-filters
          .notification-filter-active {
          background: #eaf5ee;
          color: #075f2b;
        }

        .notification-filters button span {
          min-width: 15px;
          height: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #c9a227;
          color: #ffffff;
          font-size: 7px;
        }

        /* ==================================================
           LIST
        ================================================== */

        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-top: 12px;
        }

        .notification-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e7eee9;
          border-radius: 11px;
          background: #ffffff;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .notification-item-unread {
          background: #f8fcf9;
          border-color: #dbe9df;
        }

        .notification-item-unread::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 3px;
          border-radius: 11px 0 0 11px;
          background: #c9a227;
        }

        .notification-item-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #edf6f0;
          font-size: 14px;
        }

        .notification-item-content {
          min-width: 0;
          flex: 1;
        }

        .notification-item-title {
          color: #344139;
          font-size: 11px;
          font-weight: 800;
          line-height: 1.4;
        }

        .notification-item-message {
          margin-top: 3px;
          color: #78827b;
          font-size: 9px;
          line-height: 1.5;
        }

        .notification-item-time {
          margin-top: 5px;
          color: #a0a8a3;
          font-size: 8px;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
        }

        .notification-action {
          width: 27px;
          height: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: #89928c;
          font-size: 12px;
          cursor: pointer;
        }

        .notification-action:hover {
          background: #eef5f0;
          color: #075f2b;
        }

        .notification-delete:hover {
          background: #fff4f4;
          color: #a00000;
        }

        /* ==================================================
           EMPTY
        ================================================== */

        .empty-notifications {
          padding: 28px 15px;
          text-align: center;
          border: 1px dashed #dce5df;
          border-radius: 12px;
          background: #fbfdfb;
        }

        .empty-notifications-icon {
          font-size: 24px;
        }

        .empty-notifications strong {
          display: block;
          margin-top: 8px;
          color: #536058;
          font-size: 12px;
        }

        .empty-notifications p {
          margin: 4px 0 0;
          color: #929b95;
          font-size: 9px;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .notifications-footer {
          margin-top: 13px;
          padding-top: 11px;
          border-top: 1px solid #edf1ee;
          color: #9aa29d;
          font-size: 8px;
          line-height: 1.4;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 600px) {
          .polisync-notifications {
            padding: 17px;
          }

          .notifications-title-area p {
            display: none;
          }

          .notification-item {
            padding: 10px;
          }

          .notification-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 430px) {
          .notifications-icon {
            width: 38px;
            height: 38px;
          }

          .notifications-title-area h2 {
            font-size: 16px;
          }

          .mark-all-button {
            font-size: 8px;
            padding: 7px;
          }
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   NOTIFICATION ITEM
============================================================ */

function NotificationItem({
  notification,
  onRead,
  onDelete,
}) {
  const type = notification.type || "general";

  return (
    <div
      className={`notification-item ${
        !notification.read
          ? "notification-item-unread"
          : ""
      }`}
    >
      <div className="notification-item-icon">
        {getNotificationIcon(type)}
      </div>

      <div className="notification-item-content">
        <div className="notification-item-title">
          {notification.title ||
            "PoliSync notification"}
        </div>

        <div className="notification-item-message">
          {notification.message ||
            "You have a new notification."}
        </div>

        <div className="notification-item-time">
          {formatNotificationTime(
            notification.createdAt
          )}
        </div>
      </div>

      <div className="notification-actions">
        {!notification.read && (
          <button
            type="button"
            className="notification-action"
            aria-label="Mark notification as read"
            title="Mark as read"
            onClick={onRead}
          >
            ✓
          </button>
        )}

        <button
          type="button"
          className="notification-action notification-delete"
          aria-label="Delete notification"
          title="Delete"
          onClick={onDelete}
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyNotifications({
  unreadOnly,
}) {
  return (
    <div className="empty-notifications">
      <div className="empty-notifications-icon">
        {unreadOnly ? "✓" : "🔔"}
      </div>

      <strong>
        {unreadOnly
          ? "You're all caught up"
          : "No notifications"}
      </strong>

      <p>
        {unreadOnly
          ? "You have no unread notifications."
          : "New account and workspace updates will appear here."}
      </p>
    </div>
  );
}

/* ============================================================
   ICON
============================================================ */

function getNotificationIcon(type) {
  switch (String(type).toLowerCase()) {
    case "security":
      return "🔐";

    case "result":
    case "election":
      return "📊";

    case "approval":
      return "✓";

    case "message":
      return "💬";

    case "reminder":
      return "📅";

    case "report":
      return "📄";

    case "complaint":
      return "⚠️";

    case "system":
      return "⚙️";

    default:
      return "🔔";
  }
}

/* ============================================================
   TIME
============================================================ */

function formatNotificationTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = Date.now();
  const difference =
    now - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference < minute) {
    return "Just now";
  }

  if (difference < hour) {
    return `${Math.floor(
      difference / minute
    )}m ago`;
  }

  if (difference < day) {
    return `${Math.floor(
      difference / hour
    )}h ago`;
  }

  if (difference < 7 * day) {
    return `${Math.floor(
      difference / day
    )}d ago`;
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
