import "./globals.css";
import "./visual-quality.css";
import "./dashboard-fixed-header.css";

export const metadata = {
  title: "POLISYNC AFRICA",
  description: "Africa's Political Operating System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
