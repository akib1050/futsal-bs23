import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Futsal BS23 — Europe",
  description:
    "Biweekly futsal cost tracker, player ratings, and balanced team maker for BS23 Europe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <div className="pitch-grid flex min-h-full flex-1 flex-col">
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6">
            {children}
          </main>
          <footer className="border-t border-line px-4 py-5 text-center text-sm text-chalk/50">
            Futsal BS23 · Europe turf pool &amp; team maker
          </footer>
        </div>
      </body>
    </html>
  );
}
