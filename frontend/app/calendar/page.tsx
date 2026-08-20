"use client";

import { useMemo, useState } from "react";

type EventType =
  | "Executive Meeting"
  | "Campaign Strategy"
  | "Polling Agent Training"
  | "Community Engagement"
  | "Election Operations"
  | "Research Meeting"
  | "Press Conference"
  | "Virtual Meeting";

type CalendarEvent = {
  id: number;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  priority: "Low" | "Normal" | "High" | "Urgent";
  status: "Scheduled" | "Confirmed" | "Pending";
};

const initialEvents: CalendarEvent[] = [
  {
    id: 1,
    title: "Regional Executive Meeting",
    type: "Executive Meeting",
    date: "2026-08-24",
    startTime: "10:00",
    endTime: "12:00",
    location: "Techiman Regional Office",
    organizer: "Regional Administration",
    priority: "High",
    status: "Confirmed",
  },
  {
    id: 2,
    title: "Polling Agent Training",
    type: "Polling Agent Training",
    date: "2026-08-25",
    startTime: "09:00",
    endTime: "13:00",
    location: "Techiman Community Centre",
    organizer: "Election Operations",
    priority: "Urgent",
    status: "Scheduled",
  },
  {
    id: 3,
    title: "Campaign Strategy Meeting",
    type: "Campaign Strategy",
    date: "2026-08-27",
    startTime: "14:00",
    endTime: "16:00",
    location: "Constituency Office",
    organizer: "Campaign Team",
    priority: "High",
    status: "Pending",
  },
];

const eventTypes: EventType[] = [
  "Executive Meeting",
  "Campaign Strategy",
  "Polling Agent Training",
  "Community Engagement",
  "Election Operations",
  "Research Meeting",
  "Press Conference",
  "Virtual Meeting",
];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [view, setView] = useState<"agenda" | "week" | "month">("agenda");
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-08-24");

  const [form, setForm] = useState({
    title: "",
    type: "Executive Meeting" as EventType,
    date: "2026-08-24",
    startTime: "10:00",
    endTime: "11:00",
    location: "",
    organizer: "Current User",
    priority: "Normal" as CalendarEvent["priority"],
  });

  const todayEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate]
  );

  const upcomingEvents = useMemo(
    () =>
      [...events].sort(
        (a, b) =>
          `${a.date} ${a.startTime}`.localeCompare(
            `${b.date} ${b.startTime}`
          )
      ),
    [events]
  );

  function createEvent() {
    if (!form.title.trim()) {
      alert("Please enter a meeting title.");
      return;
    }

    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: form.title.trim(),
      type: form.type,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location.trim() || "Location not specified",
      organizer: form.organizer,
      priority: form.priority,
      status: "Scheduled",
    };

    setEvents((current) => [...current, newEvent]);
    setSelectedDate(form.date);
    setShowForm(false);

    setForm({
      title: "",
      type: "Executive Meeting",
      date: form.date,
      startTime: "10:00",
      endTime: "11:00",
      location: "",
      organizer: "Current User",
      priority: "Normal",
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#07111f",
        color: "#ffffff",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "14px",
                color: "#8fa3bf",
                marginBottom: "8px",
              }}
            >
              POLISYNC AFRICA
            </div>

            <h1
              style={{
                fontSize: "34px",
                margin: 0,
              }}
            >
              Smart Calendar
            </h1>

            <p
              style={{
                color: "#b7c4d8",
                marginTop: "8px",
              }}
            >
              Meetings, deadlines, election activities and organizational
              schedules.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            style={{
              background: "#0A7F5A",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              padding: "14px 20px",
              fontWeight: "bold",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            + Create Event
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {[
            {
              label: "Today's Meetings",
              value: todayEvents.length,
              icon: "📅",
            },
            {
              label: "Upcoming Events",
              value: upcomingEvents.length,
              icon: "⏰",
            },
            {
              label: "Pending RSVP",
              value: events.filter((e) => e.status === "Pending").length,
              icon: "🤝",
            },
            {
              label: "Urgent",
              value: events.filter((e) => e.priority === "Urgent").length,
              icon: "🚨",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "#0F1E33",
                border: "1px solid #1c3553",
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "26px" }}>{stat.icon}</div>

              <div
                style={{
                  marginTop: "12px",
                  color: "#8fa3bf",
                  fontSize: "14px",
                }}
              >
                {stat.label}
              </div>

              <div
                style={{
                  fontSize: "28px",
                  fontWeight: "bold",
                  marginTop: "5px",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "#0F1E33",
            borderRadius: "18px",
            border: "1px solid #1c3553",
            padding: "18px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {(["agenda", "week", "month"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setView(item)}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  border: "1px solid #304b6a",
                  background: view === item ? "#1B365D" : "#0b1728",
                  color: "#ffffff",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {item} View
              </button>
            ))}

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                marginLeft: "auto",
                background: "#0b1728",
                color: "#ffffff",
                border: "1px solid #304b6a",
                borderRadius: "10px",
                padding: "10px 12px",
              }}
            />
          </div>
        </section>

        {view === "agenda" && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
              gap: "24px",
            }}
          >
            <div
              style={{
                background: "#0F1E33",
                borderRadius: "18px",
                border: "1px solid #1c3553",
                padding: "22px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Agenda — {selectedDate}
              </h2>

              {todayEvents.length === 0 ? (
                <div
                  style={{
                    padding: "40px 20px",
                    textAlign: "center",
                    color: "#8fa3bf",
                  }}
                >
                  No events scheduled for this date.
                </div>
              ) : (
                todayEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      background: "#102642",
                      borderRadius: "14px",
                      padding: "18px",
                      marginBottom: "14px",
                      borderLeft: "5px solid #0A7F5A",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "18px",
                          }}
                        >
                          {event.title}
                        </h3>

                        <div
                          style={{
                            color: "#9db1ca",
                            marginTop: "8px",
                          }}
                        >
                          {event.type}
                        </div>
                      </div>

                      <div
                        style={{
                          color: "#7fe0b8",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {event.startTime}–{event.endTime}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "6px",
                        marginTop: "14px",
                        color: "#c5d2e3",
                        fontSize: "14px",
                      }}
                    >
                      <div>📍 {event.location}</div>
                      <div>👤 {event.organizer}</div>
                      <div>
                        🎯 Priority: {event.priority}
                      </div>
                      <div>
                        📌 Status: {event.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <aside
              style={{
                background: "#0F1E33",
                borderRadius: "18px",
                border: "1px solid #1c3553",
                padding: "22px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Upcoming Events</h2>

              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid #1c3553",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {event.title}
                  </div>

                  <div
                    style={{
                      color: "#8fa3bf",
                      fontSize: "13px",
                      marginTop: "5px",
                    }}
                  >
                    {event.date} • {event.startTime}
                  </div>
                </div>
              ))}
            </aside>
          </section>
        )}

        {view !== "agenda" && (
          <section
            style={{
              background: "#0F1E33",
              borderRadius: "18px",
              border: "1px solid #1c3553",
              padding: "22px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              {view === "week" ? "Weekly Calendar" : "Monthly Calendar"}
            </h2>

            <p style={{ color: "#9db1ca" }}>
              Calendar grid infrastructure is ready. Event records are
              currently connected to the Smart Calendar data model.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "14px",
                marginTop: "18px",
              }}
            >
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    background: "#102642",
                    borderRadius: "14px",
                    padding: "16px",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {event.title}
                  </div>

                  <div
                    style={{
                      color: "#8fa3bf",
                      marginTop: "7px",
                      fontSize: "13px",
                    }}
                  >
                    {event.date}
                  </div>

                  <div
                    style={{
                      color: "#7fe0b8",
                      marginTop: "5px",
                    }}
                  >
                    {event.startTime}–{event.endTime}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {showForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.72)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "560px",
                background: "#0F1E33",
                border: "1px solid #2b4565",
                borderRadius: "18px",
                padding: "24px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Create Calendar Event
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "14px",
                }}
              >
                <input
                  placeholder="Meeting title"
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  style={inputStyle}
                />

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as EventType,
                    })
                  }
                  style={inputStyle}
                >
                  {eventTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      date: e.target.value,
                    })
                  }
                  style={inputStyle}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startTime: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />

                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endTime: e.target.value,
                      })
                    }
                    style={inputStyle}
                  />
                </div>

                <input
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: e.target.value,
                    })
                  }
                  style={inputStyle}
                />

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority:
                        e.target.value as CalendarEvent["priority"],
                    })
                  }
                  style={inputStyle}
                >
                  <option>Low</option>
                  <option>Normal</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      ...secondaryButton,
                      flex: 1,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={createEvent}
                    style={{
                      ...primaryButton,
                      flex: 1,
                    }}
                  >
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "13px 14px",
  borderRadius: "10px",
  border: "1px solid #304b6a",
  background: "#0b1728",
  color: "#ffffff",
  fontSize: "14px",
};

const primaryButton = {
  background: "#0A7F5A",
  color: "#ffffff",
  border: "none",
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButton = {
  background: "transparent",
  color: "#ffffff",
  border: "1px solid #4b6380",
  borderRadius: "10px",
  padding: "13px 16px",
  fontWeight: "bold",
  cursor: "pointer",
};
