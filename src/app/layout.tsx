import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DevMate AI — AI Code Review, Optimization & Conversion",
  description:
    "Paste code, get a full AI-powered review: bugs, vulnerabilities, complexity analysis, language conversion and concept breakdowns — in one editor.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable}`}>
        <ThemeProvider>
          {children}
          <Toaster
            theme="system"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--font-mono)",
              },
              className: "!bg-bg-raised !text-ink !border !border-border",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
