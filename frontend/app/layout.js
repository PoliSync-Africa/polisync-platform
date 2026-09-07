import "./visual-quality.css";
import "./modern-dashboard.css";
import LogoutSessionBridge from "../components/security/LogoutSessionBridge";
import RealtimeCallProvider from "../components/communications/RealtimeCallProvider";
import MobileCallLauncher from "../components/communications/MobileCallLauncher";
import TimeGreetingSync from "../components/dashboard/TimeGreetingSync";

export const metadata = {
  title: "PoliSync Africa",
  description: "POLISYNC AFRICA — Technology • Power • Elections",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <RealtimeCallProvider>
          <TimeGreetingSync />
          <LogoutSessionBridge />
          {children}
          <MobileCallLauncher />
        </RealtimeCallProvider>
      </body>
    </html>
  );
}
