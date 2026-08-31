"use client";

import UserDashboardLanding from "../../../components/dashboard/UserDashboardLanding";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const SUPER_ADMIN_PRIVILEGES = [
  "System-wide visibility across all organizations and election operations",
  "Manage users, organizations, roles, permissions and platform configuration",
  "Access and oversee live results, verification, EC8 submissions and history",
  "Review security, audit logs, complaints, system health and announcements",
  "Use superior administrative controls without changing the common dashboard experience",
];

export default function SuperAdminDashboard() {
  return (
    <UserDashboardLanding
      role="super_admin"
      title="Super Admin Dashboard"
      navigation={superAdminNavigation}
      activeSection="overview"
      onSectionChange={() => {}}
      extraContent={
        <section className="super-admin-privileges" aria-label="Super Admin privileges">
          <header>
            <span>SUPER ADMIN CONTROL</span>
            <h2>Superior Platform Privileges</h2>
            <p>The dashboard remains identical in structure to every PoliSync workspace; only your authorization level is elevated.</p>
          </header>
          <ul>
            {SUPER_ADMIN_PRIVILEGES.map((privilege) => (
              <li key={privilege}>
                <span aria-hidden="true">✓</span>
                <span>{privilege}</span>
              </li>
            ))}
          </ul>
        </section>
      }
    />
  );
}
