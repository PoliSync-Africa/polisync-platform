export const metadata = {
  title: "POLISYNC AFRICA",
  description: "Africa's Political Technology Platform"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
