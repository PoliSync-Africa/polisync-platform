import "./globals.css";
import OfficialBrandRepair from "../components/branding/OfficialBrandRepair";

export const metadata = {
  title: "POLISYNC AFRICA",
  description: "Africa's Political Operating System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <OfficialBrandRepair />
        {children}
      </body>
    </html>
  );
}
