import "./visual-quality.css";
import "./modern-dashboard.css";
import LogoutSessionBridge from "../components/security/LogoutSessionBridge";
import RealtimeCallProvider from "../components/communications/RealtimeCallProvider";
import MobileCallLauncher from "../components/communications/MobileCallLauncher";
import TimeGreetingSync from "../components/dashboard/TimeGreetingSync";
import DashboardEnvironmentInjector from "../components/dashboard/DashboardEnvironmentInjector";
import PoliSyncWhatsAppButton from "../components/dashboard/PoliSyncWhatsAppButton";
import WhatsAppMessagesEnhancer from "../components/dashboard/WhatsAppMessagesEnhancer";

export const metadata = {
  title: "PoliSync Africa",
  description: "POLISYNC AFRICA — Technology • Power • Elections",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RealtimeCallProvider>
          <TimeGreetingSync />
          <DashboardEnvironmentInjector />
          <LogoutSessionBridge />
          <WhatsAppMessagesEnhancer />
          {children}
          <MobileCallLauncher />
          <PoliSyncWhatsAppButton />
        </RealtimeCallProvider>
      </body>
    </html>
  );
}
