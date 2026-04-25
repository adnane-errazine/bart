import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const ibmSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-sans",
  display: "swap",
});
const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-mono",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BART — Art Analytics Terminal",
  description: "Institutional research terminal for the art market",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark"
      className={`${ibmSans.variable} ${ibmMono.variable} ${sourceSerif.variable}`}
      style={{
        ["--font-sans" as string]: "var(--font-ibm-sans), -apple-system, system-ui, sans-serif",
        ["--font-mono" as string]: "var(--font-ibm-mono), monospace",
        ["--font-serif" as string]: "var(--font-source-serif), 'Times New Roman', Georgia, serif",
      }}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
