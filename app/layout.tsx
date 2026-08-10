import "./globals.css";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Referral Exchange",
  description:
    "A community-driven referral trading platform built around real trades and real reputation.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body>
        <header className="navbar">
          <Link href="/" className="logo">
            REFERRAL<span>EXCHANGE</span>
          </Link>

          <nav className="navLinks">
            <Link href="/events">Events</Link>
            <Link href="/trades">Trades</Link>
            <Link href="/leaderboard">Leaderboard</Link>

            {user ? (
              <Link href="/profile" className="primary">
                Profile
              </Link>
            ) : (
              <Link href="/auth" className="primary">
                Sign In
              </Link>
            )}
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
