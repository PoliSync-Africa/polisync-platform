import "./visual-quality.css";
import "./modern-dashboard.css";

export const metadata = {
  title: "PoliSync Africa",
  description: "POLISYNC AFRICA — Technology • Power • Elections",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
