import "./globals.css";
import "./visual-quality.css";
import "./responsive-overrides.css";

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
