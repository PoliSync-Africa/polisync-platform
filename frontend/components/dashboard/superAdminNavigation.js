// ============================================================
// POLISYNC AFRICA — SUPER ADMIN NAVIGATION
// ============================================================

const superAdminNavigation = [
  {
    section: "PLATFORM MANAGEMENT",
    items: [
      { label: "Dashboard", href: "/super-admin/dashboard", icon: "⌂", key: "overview" },
      { label: "Users & Accounts", href: "/super-admin/users", icon: "♙", key: "users" },
      { label: "Organizations", href: "/super-admin/organizations", icon: "▦", key: "organizations" },
      { label: "Candidates", href: "/super-admin/candidates", icon: "♟", key: "candidates" },
      { label: "Geographic Data", href: "/super-admin/geography", icon: "⌖", key: "geography" },
      { label: "Polling Stations", href: "/super-admin/polling-stations", icon: "⌖", key: "polling-stations" },
      { label: "Elections", href: "/super-admin/elections", icon: "▣", key: "elections" },
      { label: "Approvals", href: "/super-admin/approvals", icon: "✓", key: "approvals" },
    ],
  },
  {
    section: "ELECTION INTELLIGENCE",
    items: [
      { label: "Live Results", href: "/super-admin/results/live", icon: "◉", key: "live-results" },
      { label: "Result Verification", href: "/super-admin/results/verification", icon: "✓", key: "result-verification" },
      { label: "EC8 Verification", href: "/super-admin/results/ec8", icon: "▤", key: "ec8" },
      { label: "Field Reports", href: "/super-admin/reports", icon: "▤", key: "reports" },
      { label: "Analytics & Analytics", href: "/super-admin/analytics", icon: "◒", key: "analytics" },
      { label: "AI Election Intelligence", href: "/super-admin/ai-election-intelligence", icon: "✦", key: "ai-election-intelligence" },
    ],
  },
  {
    section: "SUPER ADMIN OPERATIONS",
    items: [
      { label: "Complaints & Reports", href: "/super-admin/complaints", icon: "⚠", key: "complaints", badge: true },
      { label: "Security Center", href: "/super-admin/security", icon: "♢", key: "security" },
      { label: "Audit Logs", href: "/super-admin/audit-logs", icon: "≡", key: "audit-logs" },
      { label: "System Health", href: "/super-admin/system-health", icon: "♥", key: "system-health" },
      { label: "Announcements", href: "/super-admin/announcements", icon: "▱", key: "announcements" },
      { label: "Notifications", href: "/super-admin/notifications", icon: "♧", key: "notifications" },
      { label: "Settings & Configuration", href: "/super-admin/settings", icon: "⚙", key: "settings" },
    ],
  },
];

export default superAdminNavigation;
