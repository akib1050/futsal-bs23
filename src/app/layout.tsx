import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getCurrentUser } from "@/lib/auth";

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
    "Biweekly futsal cost tracker, player credit, bKash payments, and balanced team maker for BS23 Europe.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const pending = user && !user.isApproved;

  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <div className="pitch-grid flex min-h-full flex-1 flex-col">
          <Nav
            user={
              user
                ? {
                    name: user.name,
                    role: user.role,
                    isApproved: user.isApproved,
                  }
                : null
            }
          />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6">
            {pending ? <PendingApproval name={user.name} /> : children}
          </main>
          <footer className="border-t border-line px-4 py-5 text-center text-sm text-chalk/50">
            Futsal BS23 · Europe turf pool &amp; team maker
          </footer>
        </div>
      </body>
    </html>
  );
}

function PendingApproval({ name }: { name: string }) {
  return (
    <div className="anim-rise mx-auto mt-10 max-w-xl rounded-xl border border-amber/30 bg-amber/5 p-6 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-amber/80">
        Waiting for approval
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl tracking-wide text-chalk">
        Almost in, {name}
      </h1>
      <p className="mt-3 text-chalk/65">
        Your account is created. The admin needs to approve you and link you to
        your player card before you can see credit, stats and payments.
      </p>
      <p className="mt-4 text-sm text-chalk/50">
        Ping the group once you&apos;ve registered — approval takes a second.
      </p>
    </div>
  );
}
