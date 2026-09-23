import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Audiobook Converter",
  description: "Convert Text and Books into Natural AI Audiobooks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}