// ============================================================
// POLISYNC AFRICA — ELECTION CONTROL CENTER NAVIGATION
// Only election administration, result transmission, verification,
// electoral geography, political parties and candidates are exposed.
// ============================================================

const superAdminNavigation = [
  { section: "ELECTION CONTROL", items: [
    { label: "Election Dashboard", href: "/super-admin/dashboard", icon: "⌂", key: "overview" },
    { label: "Elections", href: "/super-admin/elections", icon: "▣", key: "elections" },
    { label: "Political Parties", href: "/super-admin/political-parties", icon: "⚑", key: "political-parties" },
    { label: "Official Candidates", href: "/super-admin/elections/candidates", icon: "♛", key: "official-election-candidates" },
    { label: "Candidate Registrations", href: "/super-admin/candidates", icon: "♟", key: "candidates" },
    { label: "Electoral Geography", href: "/super-admin/geography", icon: "⌖", key: "geography" },
    { label: "Polling Stations", href: "/super-admin/polling-stations", icon: "⌖", key: "polling-stations" },
  ]},
  { section: "RESULT TRANSMISSION", items: [
    { label: "Transmit Results", href: "/submit-result", icon: "⇧", key: "transmit-results" },
    { label: "Live Results", href: "/super-admin/results/live", icon: "◉", key: "live-results" },
    { label: "Result Verification", href: "/super-admin/results/verification", icon: "✓", key: "result-verification" },
    { label: "EC8 Verification", href: "/super-admin/results/ec8", icon: "▤", key: "ec8" },
    { label: "Results History", href: "/super-admin/results/history", icon: "↺", key: "results-history" },
    { label: "Results Reports", href: "/super-admin/reports", icon: "▤", key: "reports" },
  ]},
  { section: "INTEGRITY & SECURITY", items: [
    { label: "Electoral Data Health", href: "/super-admin/electoral-data-health", icon: "♥", key: "electoral-data" },
    { label: "Audit Logs", href: "/super-admin/audit-logs", icon: "≡", key: "audit-logs" },
    { label: "Security Center", href: "/super-admin/security", icon: "♢", key: "security" },
    { label: "System Health", href: "/super-admin/system-health", icon: "◌", key: "system-health" },
  ]},
];

export default superAdminNavigation;
