import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Memora AI — A Memory That Knows It Might Be Wrong",
  description:
    "A trust-aware AI memory system that stores memories with confidence scores, uncertainty flags, and expiration dates — because the most intelligent memory knows what it doesn't know.",
  keywords: ["AI", "memory", "trust", "confidence", "uncertainty", "privacy", "knowledge graph"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.toggle('dark', theme === 'dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        <Sidebar />
        <main className="md:pl-64 min-h-screen transition-all duration-300">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 pt-16 md:pt-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
