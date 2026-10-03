import type { Metadata } from "next";

import "./globals.css";

import BackgroundGenerationManager from "../components/BackgroundGenerationManager";

export const metadata: Metadata = {
  title:
    "RAFTA AI Audiobook Converter",

  description:
    "Convert text and books into natural-sounding AI audiobooks with RAFTA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <BackgroundGenerationManager />

        {children}
      </body>
    </html>
  );
}