import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { IntroSplash } from "@/components/shell/IntroSplash";
import "./globals.css";

// IBM Plex Sans for text, Plex Mono for patient IDs and raw tool output: one
// family designed as a pair, with true tabular figures for the numbers.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Trial Mirror",
  description: "Retention-support agent: ranks which already-eligible trial participants need the most support to stay in a trial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} font-sans antialiased`}>
        <IntroSplash />
        {children}
      </body>
    </html>
  );
}
