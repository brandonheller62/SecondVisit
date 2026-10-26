import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { IntroSplash } from "@/components/shell/IntroSplash";
import "./globals.css";

// Archivo carries both voices: heavy for headings (the nav wordmark alone is
// stretched wider, like a Miami Modern sign), regular for the UI text. Plex Mono stays for patient IDs
// and raw tool output, where character alignment matters.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Second Visit",
  description: "Retention-support agent: ranks which already-eligible trial participants need the most support to stay in a trial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${plexMono.variable} font-sans antialiased`}>
        <IntroSplash />
        {children}
      </body>
    </html>
  );
}
