import "./globals.css";

export const metadata = {
  title: "SupportAI",
  description: "AI-powered customer support platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
