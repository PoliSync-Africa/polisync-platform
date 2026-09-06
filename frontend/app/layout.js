import "./visual-quality.css";
import "./modern-dashboard.css";
import LogoutSessionBridge from "../components/security/LogoutSessionBridge";

export const metadata = {
  title: "PoliSync Africa",
  description: "POLISYNC AFRICA — Technology • Power • Elections",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LogoutSessionBridge />
        {children}
      </body>
    </html>
  );
}
