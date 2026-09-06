"use client";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import PrivacySecurityPanel from "../../../components/dashboard/PrivacySecurityPanel";

const navigation = [
  {
    section: "Account",
    items: [
      { label: "Dashboard", href: "/dashboard", key: "overview", icon: "⌂" },
      { label: "Profile", href: "/profile", key: "profile", icon: "♙" },
      { label: "Results", href: "/results", key: "results", icon: "↗" },
      { label: "Privacy & Security", href: "/settings/security", key: "security", icon: "♢" },
    ],
  },
];

export default function PrivacySecurityPage() {
  return (
    <DashboardShell
      title="Privacy & Security"
      subtitle="Manage your privacy, presence, communication and location controls."
      role="user"
      navigation={navigation}
      activeSection="security"
    >
      <main className="security-page">
        <div className="security-intro">
          <span>ACCOUNT PROTECTION</span>
          <h2>Privacy & Security</h2>
          <p>Control how your information is shared across your PoliSync Africa account.</p>
        </div>
        <PrivacySecurityPanel />
      </main>
      <style jsx>{`
        .security-page { min-width: 0; padding: clamp(18px, 2.6vw, 34px); background: #f7faf8; }
        .security-intro { margin-bottom: 16px; }
        .security-intro span { color: #c39a1f; font-size: 10px; font-weight: 900; letter-spacing: 1.5px; }
        .security-intro h2 { margin: 5px 0 4px; color: #075f2b; font-size: clamp(24px, 2.5vw, 32px); line-height: 1.1; }
        .security-intro p { margin: 0; color: #6b7b72; font-size: 12px; line-height: 1.5; }
        @media (max-width: 600px) { .security-page { padding: 16px; } }
      `}</style>
    </DashboardShell>
  );
}
